import { NextResponse } from "next/server";

import type { LearningConcept, LearningSource, SourceConceptPatch, SourceUpdateProposal } from "@/lib/learning-path";
import { currentModelRoutes } from "@/lib/model-routing";
import { createSourceSnapshot, fallbackSourceUpdate, hasMeaningfulSourceChange, truncateSourceText } from "@/lib/source-updates";

type RefreshRequest = {
  pathId?: string;
  pathTitle?: string;
  source?: LearningSource;
  concepts?: LearningConcept[];
};

function isSafeSourceUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return false;
    if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal") || hostname === "::1") return false;
    if (/^(?:0|10|127|169\.254|192\.168)\./.test(hostname)) return false;
    const match172 = hostname.match(/^172\.(\d+)\./);
    return !(match172 && Number(match172[1]) >= 16 && Number(match172[1]) <= 31);
  } catch {
    return false;
  }
}

function cleanSourceText(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchLatestSource(url: string) {
  let currentUrl = url;
  let response: Response | null = null;
  for (let redirects = 0; redirects < 4; redirects += 1) {
    response = await fetch(currentUrl, {
      headers: { accept: "text/html, text/plain, application/json;q=0.9", "user-agent": "CurrentLearning/1.0" },
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    if (response.status < 300 || response.status >= 400) break;
    const location = response.headers.get("location");
    if (!location) throw new Error("The source redirected without a destination.");
    const nextUrl = new URL(location, currentUrl).toString();
    if (!isSafeSourceUrl(nextUrl)) throw new Error("The source redirected to a private location.");
    currentUrl = nextUrl;
  }
  if (!response?.ok) throw new Error(`The source returned ${response?.status ?? "no response"}.`);
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("text/") && !contentType.includes("json") && !contentType.includes("xml")) throw new Error("The source is not readable text.");
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > 2_000_000) throw new Error("The source is too large to refresh.");
  return cleanSourceText((await response.text()).slice(0, 1_000_000)).slice(0, 40_000);
}

function outputText(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const response = result as { output_text?: unknown; output?: unknown };
  if (typeof response.output_text === "string") return response.output_text;
  if (!Array.isArray(response.output)) return null;
  for (const item of response.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") return (part as { text: string }).text;
    }
  }
  return null;
}

function validateLiveProposal(value: unknown, fallback: SourceUpdateProposal, conceptCount: number, model: SourceUpdateProposal["model"]): SourceUpdateProposal | null {
  if (!value || typeof value !== "object") return null;
  const proposal = value as Partial<SourceUpdateProposal>;
  if (typeof proposal.summary !== "string" || typeof proposal.beforeExcerpt !== "string" || typeof proposal.afterExcerpt !== "string") return null;
  if (!Array.isArray(proposal.affectedConceptIndexes) || !Array.isArray(proposal.patches)) return null;
  const indexes = proposal.affectedConceptIndexes.filter((index): index is number => Number.isInteger(index) && index >= 0 && index < conceptCount).slice(0, 3);
  const patches = proposal.patches.filter((patch): patch is SourceConceptPatch => Boolean(
    patch && Number.isInteger(patch.conceptIndex) && patch.conceptIndex >= 0 && patch.conceptIndex < conceptCount
      && typeof patch.summary === "string" && typeof patch.sourceNote === "string" && Array.isArray(patch.checkpoints),
  )).slice(0, 3).map((patch) => ({
    conceptIndex: patch.conceptIndex,
    summary: truncateSourceText(patch.summary, 360),
    sourceNote: truncateSourceText(patch.sourceNote, 420),
    checkpoints: patch.checkpoints.filter((item): item is string => typeof item === "string").map((item) => truncateSourceText(item, 160)).filter(Boolean).slice(0, 5),
  }));
  if (!indexes.length || !patches.length) return null;
  return {
    ...fallback,
    summary: truncateSourceText(proposal.summary, 420),
    beforeExcerpt: truncateSourceText(proposal.beforeExcerpt, 420),
    afterExcerpt: truncateSourceText(proposal.afterExcerpt, 420),
    affectedConceptIndexes: indexes,
    patches,
    mode: "live",
    model,
  };
}

export async function POST(request: Request) {
  const body = await request.json() as RefreshRequest;
  const source = body.source;
  const concepts = Array.isArray(body.concepts) ? body.concepts.filter((concept): concept is LearningConcept => Boolean(concept && typeof concept.title === "string" && typeof concept.objective === "string")).slice(0, 12) : [];
  if (!body.pathId || !source?.id || source.kind !== "link" || !source.href || !isSafeSourceUrl(source.href) || !concepts.length) {
    return NextResponse.json({ error: "A public linked source and its learning path are required." }, { status: 400 });
  }

  try {
    const latest = createSourceSnapshot(await fetchLatestSource(source.href));
    const relevantNotes = concepts.filter((concept) => concept.sourceIds?.includes(source.id)).map((concept) => concept.sourceNote).filter((note): note is string => Boolean(note)).join(" ");
    const previous = source.snapshot ?? (relevantNotes ? createSourceSnapshot(relevantNotes, "2026-07-01T00:00:00.000Z") : undefined);
    if (!hasMeaningfulSourceChange(previous, latest)) {
      return NextResponse.json({ changed: false, latestSnapshot: latest, checkedAt: latest.capturedAt });
    }

    const fallback = fallbackSourceUpdate({
      pathId: body.pathId,
      sourceId: source.id,
      sourceTitle: source.title,
      sourceHref: source.href,
      previous,
      latest,
      concepts,
    });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ changed: true, proposal: fallback });

    try {
      const route = currentModelRoutes.sourceResearch;
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: route.model,
          reasoning: { effort: route.reasoningEffort },
          store: false,
          max_output_tokens: 8000,
          input: [
            {
              role: "system",
              content: "You are Current's curriculum update agent. Compare the stored and refreshed source snapshots. Report only meaningful changes in claims, instructions, scope, or terminology that affect the supplied learning concepts. Cite the exact old and new evidence through concise excerpts. Patch only affected concepts, preserving their intent while updating summary, source note, and testable checkpoints. Do not treat navigation, formatting, or boilerplate changes as curriculum changes. Keep every field concise and always complete the required JSON object.",
            },
            {
              role: "user",
              content: JSON.stringify({ pathTitle: body.pathTitle, source: { id: source.id, title: source.title, href: source.href }, previousContent: previous?.content.slice(0, 20_000) ?? "No stored snapshot", latestContent: latest.content.slice(0, 20_000), concepts }),
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "source_update",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  summary: { type: "string" },
                  beforeExcerpt: { type: "string" },
                  afterExcerpt: { type: "string" },
                  affectedConceptIndexes: { type: "array", minItems: 1, maxItems: 3, items: { type: "number" } },
                  patches: {
                    type: "array",
                    minItems: 1,
                    maxItems: 3,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        conceptIndex: { type: "number" },
                        summary: { type: "string" },
                        sourceNote: { type: "string" },
                        checkpoints: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
                      },
                      required: ["conceptIndex", "summary", "sourceNote", "checkpoints"],
                    },
                  },
                },
                required: ["summary", "beforeExcerpt", "afterExcerpt", "affectedConceptIndexes", "patches"],
              },
            },
          },
        }),
      });
      if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
      const text = outputText(await response.json());
      if (!text) throw new Error("OpenAI response did not contain output text");
      const proposal = validateLiveProposal(JSON.parse(text), fallback, concepts.length, route.model);
      if (!proposal) throw new Error("OpenAI response did not match the update contract");
      return NextResponse.json({ changed: true, proposal });
    } catch (error) {
      console.error("Live source comparison failed; using deterministic fallback", error);
      return NextResponse.json({ changed: true, proposal: fallback });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The source could not be refreshed." }, { status: 502 });
  }
}
