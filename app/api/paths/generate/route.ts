import { NextResponse } from "next/server";

import type { GeneratedLearningPath, LearningConcept } from "@/lib/learning-path";

const allowedTextExtensions = new Set(["csv", "json", "md", "txt"]);
const blockedHeadings = new Set([
  "about", "api reference", "contact", "contents", "core concepts", "data", "definition", "documentation", "examples", "external links", "get started", "guides", "home", "introduction", "menu", "methodology", "on this page", "overview", "privacy", "references", "resources", "search", "see also", "settings", "suggested",
]);
const stopWords = new Set([
  "about", "after", "again", "against", "also", "because", "before", "being", "between", "could", "from", "have", "into", "more", "most", "other", "over", "should", "some", "such", "than", "that", "their", "there", "these", "they", "this", "through", "under", "using", "very", "want", "what", "when", "where", "which", "while", "with", "would", "your",
]);
const instructionWords = new Set(["basic", "build", "clearly", "design", "enough", "evaluate", "learn", "simple", "small", "understand", "well"]);

type FetchedSource = {
  id: string;
  url: string;
  title: string;
  text: string;
  headings: string[];
};

type TextFileSource = {
  id: string;
  name: string;
  text: string;
  headings: string[];
};

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
      if (!part || typeof part !== "object") continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") return text;
    }
  }

  return null;
}

function cleanText(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanHeading(value: string) {
  return cleanText(value.replace(/^#{1,6}\s*/, "")).replace(/[|•·]+/g, " ").trim().slice(0, 72);
}

function htmlContentRegion(html: string) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  return main.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? main;
}

function extractHtmlHeadings(html: string) {
  return Array.from(htmlContentRegion(html).matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi))
    .map((match) => cleanHeading(match[1]))
    .filter(isUsefulHeading)
    .slice(0, 12);
}

function extractTextHeadings(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => cleanHeading(line))
    .filter((line) => line.length >= 4 && line.length <= 72 && (line.split(/\s+/).length <= 9 || /^#{1,6}\s/.test(line)))
    .filter(isUsefulHeading)
    .slice(0, 12);
}

function isUsefulHeading(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const looksLikeNavigation = /^(?:browse|explore|search)\b.*(?:api|docs?|documentation)?$/.test(normalized)
    || /^(?:learn|read|view) more$/.test(normalized);
  return normalized.length >= 4 && !blockedHeadings.has(normalized) && !looksLikeNavigation && !/^chapter \d+$/.test(normalized);
}

function isSafeSourceUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return false;
    if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal") || hostname === "::1") return false;
    if (/^(?:0|10|127|169\.254|192\.168)\./.test(hostname)) return false;
    const match172 = hostname.match(/^172\.(\d+)\./);
    if (match172 && Number(match172[1]) >= 16 && Number(match172[1]) <= 31) return false;
    return true;
  } catch {
    return false;
  }
}

async function fetchSource(url: string, id: string): Promise<FetchedSource | null> {
  if (!isSafeSourceUrl(url)) return null;
  try {
    let currentUrl = url;
    let response: Response | null = null;
    for (let redirects = 0; redirects < 4; redirects += 1) {
      response = await fetch(currentUrl, {
        headers: { accept: "text/html, text/plain, application/json;q=0.9", "user-agent": "CurrentLearning/1.0" },
        redirect: "manual",
        signal: AbortSignal.timeout(6500),
      });
      if (response.status < 300 || response.status >= 400) break;
      const location = response.headers.get("location");
      if (!location) return null;
      const nextUrl = new URL(location, currentUrl).toString();
      if (!isSafeSourceUrl(nextUrl)) return null;
      currentUrl = nextUrl;
    }
    if (!response) return null;
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("text/") && !contentType.includes("json") && !contentType.includes("xml")) return null;
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > 2_000_000) return null;
    const raw = (await response.text()).slice(0, 1_000_000);
    const sourceBody = contentType.includes("html") ? htmlContentRegion(raw) : raw;
    const htmlTitle = raw.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    return {
      id,
      url,
      title: cleanHeading(htmlTitle ?? new URL(currentUrl).hostname),
      text: cleanText(sourceBody).slice(0, 60_000),
      headings: contentType.includes("html") ? extractHtmlHeadings(raw) : extractTextHeadings(raw),
    };
  } catch {
    return null;
  }
}

function extensionFor(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function isTextFile(file: File) {
  return file.type.startsWith("text/") || allowedTextExtensions.has(extensionFor(file));
}

async function readTextFile(file: File, id: string): Promise<TextFileSource | null> {
  if (!isTextFile(file)) return null;
  const text = (await file.text()).slice(0, 60_000);
  return { id, name: file.name, text, headings: extractTextHeadings(text) };
}

function linkSourceId(link: string, index: number) {
  return `link-${index}-${link}`;
}

function fileSourceId(file: File, index: number) {
  return `file-${index}-${file.name}`;
}

async function fileDataUrl(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 8192) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  }
  return `data:${file.type || "application/pdf"};base64,${btoa(binary)}`;
}

function sentenceStyle(value: string) {
  const trimmed = value.trim().toLowerCase();
  return trimmed ? `${trimmed[0].toUpperCase()}${trimmed.slice(1)}` : "";
}

function frequentTerms(value: string) {
  const words = value.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? [];
  const scores = new Map<string, { score: number; firstIndex: number }>();
  const useful = (word: string) => word.length >= 4 && !stopWords.has(word) && !instructionWords.has(word);
  const record = (term: string, score: number, index: number) => {
    const current = scores.get(term);
    scores.set(term, { score: (current?.score ?? 0) + score, firstIndex: current?.firstIndex ?? index });
  };

  for (let index = 0; index < words.length; index += 1) {
    if (useful(words[index])) record(words[index], 1, index);
    if (index < words.length - 1 && useful(words[index]) && useful(words[index + 1])) {
      record(`${words[index]} ${words[index + 1]}`, 4, index);
    }
  }
  return [...scores.entries()]
    .sort((left, right) => right[1].score - left[1].score || left[1].firstIndex - right[1].firstIndex)
    .map(([term]) => sentenceStyle(term))
    .filter((term) => isUsefulHeading(term))
    .slice(0, 10);
}

function actionConcepts(goal: string) {
  const concepts: string[] = [];
  for (const clause of goal.split(/\band\b|[.;]/i)) {
    const match = clause.match(/\b(evaluate|design|build|compare|analyze|apply|implement|practice)\s+(.+)/i);
    if (!match) continue;
    const action = match[1].toLowerCase();
    const object = cleanHeading(match[2])
      .replace(/^(?:a|an|the)\s+/i, "")
      .replace(/^(?:small|basic|simple)\s+/i, "")
      .replace(/\b(?:well|clearly|enough)\b.*$/i, "")
      .trim();
    if (!object) continue;
    if (action === "design") concepts.push(sentenceStyle(`${object} design`));
    else if (action === "evaluate") concepts.push(sentenceStyle(`Evaluating ${object}`));
    else if (action === "compare") concepts.push(sentenceStyle(`Comparing ${object}`));
    else if (action === "analyze") concepts.push(sentenceStyle(`Analyzing ${object}`));
    else if (action === "apply" || action === "implement" || action === "practice") concepts.push(sentenceStyle(`Applying ${object}`));
    else concepts.push(sentenceStyle(object));
  }
  return concepts;
}

function subjectConcepts(subject: string) {
  const normalized = subject.toLowerCase();
  if (/decision theory|decision analysis/.test(normalized)) return ["Actions, states, and outcomes", "Probability and expected value", "Risk preferences and utility", "Value of information", "Sensitivity analysis"];
  if (/causal|causality/.test(normalized)) return ["Potential outcomes and counterfactuals", "Confounding and identification", "Directed acyclic graphs", "Adjustment and study design"];
  if (/distributed system|distributed computing/.test(normalized)) return ["Replication and consistency", "Failure detection and recovery", "Partitioning and consensus", "Architecture tradeoffs"];
  if (/machine learning|neural network|deep learning/.test(normalized)) return ["Features and representations", "Training and generalization", "Loss functions and optimization", "Model evaluation and error analysis"];
  if (/statistics|probability/.test(normalized)) return ["Random variables and distributions", "Sampling and uncertainty", "Estimation and intervals", "Hypothesis tests and model checks"];
  if (/programming|software|coding/.test(normalized)) return ["Data and control flow", "Interfaces and composition", "Testing and debugging", "Building a complete implementation"];
  if (/economics|finance/.test(normalized)) return ["Incentives and tradeoffs", "Models and assumptions", "Evidence and measurement", "Decision-making under uncertainty"];
  if (/biology|genetics/.test(normalized)) return ["Structure and function", "Mechanisms and regulation", "Variation and inheritance", "Evidence from experiments"];
  if (/history|historical/.test(normalized)) return ["Context and chronology", "Actors and institutions", "Primary-source interpretation", "Competing explanations"];
  if (/language|spanish|french|german|japanese|mandarin/.test(normalized)) return ["Core sound and sentence patterns", "High-frequency vocabulary", "Comprehension in context", "Guided production and correction"];
  return [];
}

function conceptContent(title: string, subject: string, goal: string, final: boolean): Pick<LearningConcept, "objective" | "summary" | "checkpoints"> {
  const normalized = title.toLowerCase();
  if (final) return {
    objective: `Compare a concrete ${subject} decision, defend the choice, and explain what evidence could change it.`,
    summary: `This final activity combines the path into one decision you can inspect, challenge, and revise.`,
    checkpoints: ["Frame the decision", "Compare alternatives", "Test what would change the choice"],
  };
  if (/foundation/.test(normalized)) return {
    objective: `Identify the core objects, assumptions, and questions that define ${/^[aeiou]/i.test(subject) ? "an" : "a"} ${subject} problem.`,
    summary: `A useful foundation separates the decision itself from the evidence, constraints, and outcomes around it.`,
    checkpoints: ["Core vocabulary", "Assumptions and boundaries", "A representative problem"],
  };
  if (/actions?.*states?.*outcomes?/.test(normalized)) return {
    objective: "Represent a decision as available actions, uncertain states, and resulting outcomes.",
    summary: "Separating what you control from what remains uncertain prevents outcomes from being confused with choices.",
    checkpoints: ["Available actions", "Uncertain states", "Consequences for each pairing"],
  };
  if (/probability|expected value/.test(normalized)) return {
    objective: "Calculate expected value from possible outcomes and their probabilities, then state what the average hides.",
    summary: "Expected value gives a probability-weighted comparison, but it does not capture every difference in downside or preference.",
    checkpoints: ["Outcome probabilities", "Probability-weighted value", "Limits of the average"],
  };
  if (/risk|utility/.test(normalized)) return {
    objective: "Compare decisions with similar expected value but different downside, variance, or utility.",
    summary: "Risk preferences explain why the same payoff distribution can support different choices for different decision-makers.",
    checkpoints: ["Downside exposure", "Risk tolerance", "Utility rather than raw payoff"],
  };
  if (/value of information|value uncertainty/.test(normalized)) return {
    objective: "Decide whether reducing uncertainty is worth the cost and delay of gathering more information.",
    summary: "Information has value when it can change the chosen action enough to justify acquiring it.",
    checkpoints: ["Decision-relevant uncertainty", "Cost of information", "Chance the choice changes"],
  };
  if (/sensitivity|compare decisions/.test(normalized)) return {
    objective: "Vary the uncertain assumptions in a decision and identify when the preferred option changes.",
    summary: "Sensitivity analysis reveals which assumptions actually control the decision and which details are distractions.",
    checkpoints: ["Key assumptions", "Plausible ranges", "Decision-switching thresholds"],
  };
  if (/comparing decisions under risk/.test(normalized)) return {
    objective: "Compare alternatives under uncertainty using expected outcomes, downside exposure, and explicit tradeoffs.",
    summary: "A defensible comparison makes uncertainty and risk tolerance visible instead of hiding them in one score.",
    checkpoints: ["Alternatives and outcomes", "Probability and downside", "Tradeoff justification"],
  };

  const conciseGoal = cleanText(goal).replace(/^(?:understand|learn)\s+/i, "").replace(/[.]$/, "");
  return {
    objective: `Explain ${title.toLowerCase()} and show how it changes a concrete decision about ${conciseGoal}.`,
    summary: `${title} is one working piece of ${subject}; learn what it changes, where it applies, and how it can fail.`,
    checkpoints: ["Definition and boundaries", "Effect on a real decision", "A common failure or limitation"],
  };
}

function sourceEvidence(title: string, sources: Array<{ id: string; text: string }>, index: number) {
  if (!sources.length) return {};
  const terms = title.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) ?? [];
  const ranked = sources.map((source) => {
    const sentences = source.text.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.length >= 45 && sentence.length <= 420);
    const matching = sentences.find((sentence) => terms.some((term) => sentence.toLowerCase().includes(term)));
    return { source, note: matching ?? sentences[0] ?? source.text.slice(0, 320) };
  });
  const selected = ranked[index % ranked.length];
  const sourceNote = cleanText(selected.note).slice(0, 360);
  return sourceNote ? { sourceIds: [selected.source.id], sourceNote } : { sourceIds: [selected.source.id] };
}

function buildConcepts(subject: string, goal: string, fetched: FetchedSource[], textFiles: TextFileSource[], files: File[]): LearningConcept[] {
  const subjectTitle = cleanHeading(subject);
  const sourceHeadings = [...fetched.flatMap((source) => source.headings), ...textFiles.flatMap((source) => source.headings)];
  const fileNames = files.map((file) => cleanHeading(file.name.replace(/\.[^.]+$/, ""))).filter(isUsefulHeading);
  const terms = frequentTerms(`${goal} ${fetched.map((source) => source.text.slice(0, 10_000)).join(" ")} ${textFiles.map((source) => source.text.slice(0, 10_000)).join(" ")}`);
  const candidates = [`${subjectTitle} foundations`, ...actionConcepts(goal), ...subjectConcepts(subject), ...sourceHeadings, ...fileNames, ...terms];
  const titles: string[] = [];

  for (const candidate of candidates) {
    const cleaned = cleanHeading(candidate);
    const cleanedTokens = cleaned.toLowerCase().match(/[a-z0-9-]+/g)?.filter((word) => word !== "and") ?? [];
    const repeatsExistingIdea = titles.some((title) => {
      const titleTokens = title.toLowerCase().match(/[a-z0-9-]+/g)?.filter((word) => word !== "and") ?? [];
      return title.toLowerCase() === cleaned.toLowerCase()
        || (cleanedTokens.length > 0 && cleanedTokens.every((word) => titleTokens.includes(word)));
    });
    if (!cleaned || repeatsExistingIdea) continue;
    titles.push(cleaned);
    if (titles.length === 5) break;
  }

  const fillers = [`Core ideas in ${subjectTitle}`, `Methods used in ${subjectTitle}`, `Common failure modes in ${subjectTitle}`, `Applying ${subjectTitle}`];
  for (const filler of fillers) {
    if (titles.length === 5) break;
    if (!titles.some((title) => title.toLowerCase() === filler.toLowerCase())) titles.push(filler);
  }

  const practiceTitle = `${subjectTitle} in practice`;
  if (!titles.some((title) => title.toLowerCase() === practiceTitle.toLowerCase())) titles.push(practiceTitle);

  const evidenceSources = [
    ...fetched.map((source) => ({ id: source.id, text: source.text })),
    ...textFiles.map((source) => ({ id: source.id, text: source.text })),
  ];
  return titles.map((title, index) => ({
    title,
    ...conceptContent(title, subjectTitle, goal, index === titles.length - 1),
    ...sourceEvidence(title, evidenceSources, index),
  }));
}

function demoPath(subject: string, goal: string, fetched: FetchedSource[], textFiles: TextFileSource[], files: File[]): GeneratedLearningPath {
  const concepts = buildConcepts(subject, goal, fetched, textFiles, files);
  const subjectOverlap = subject.toLowerCase();
  const relatedPathId = /agent eval|model eval/.test(subjectOverlap)
    ? "agent-evals"
    : /agent|responses|openai api|tool calling/.test(subjectOverlap) ? "long-running" : null;

  return {
    title: cleanHeading(subject),
    description: cleanText(goal).slice(0, 220),
    concepts,
    relatedPathId,
    mode: "demo",
  };
}

function validateGeneratedPath(value: unknown): Omit<GeneratedLearningPath, "mode"> | null {
  if (!value || typeof value !== "object") return null;
  const path = value as Partial<GeneratedLearningPath>;
  if (typeof path.title !== "string" || typeof path.description !== "string" || !Array.isArray(path.concepts)) return null;
  const concepts = path.concepts.filter((concept): concept is LearningConcept => Boolean(
    concept && typeof concept === "object" && typeof concept.title === "string" && typeof concept.objective === "string",
  ));
  if (concepts.length < 5) return null;
  const allowedRelatedPaths = new Set(["long-running", "responses-api", "agent-evals", null]);
  return {
    title: cleanHeading(path.title).slice(0, 80),
    description: cleanText(path.description).slice(0, 220),
    concepts: concepts.slice(0, 7).map((concept) => ({
      title: cleanHeading(concept.title),
      objective: cleanText(concept.objective).slice(0, 240),
      summary: typeof concept.summary === "string" ? cleanText(concept.summary).slice(0, 360) : undefined,
      checkpoints: Array.isArray(concept.checkpoints) ? concept.checkpoints.filter((item): item is string => typeof item === "string").map((item) => cleanText(item).slice(0, 120)).slice(0, 5) : undefined,
      sourceIds: Array.isArray(concept.sourceIds) ? concept.sourceIds.filter((item): item is string => typeof item === "string").slice(0, 4) : undefined,
      sourceNote: typeof concept.sourceNote === "string" ? cleanText(concept.sourceNote).slice(0, 360) : undefined,
    })),
    relatedPathId: allowedRelatedPaths.has(path.relatedPathId ?? null) ? path.relatedPathId ?? null : null,
  };
}

export async function POST(request: Request) {
  const form = await request.formData();
  const subject = String(form.get("subject") ?? "").trim();
  const goal = String(form.get("goal") ?? "").trim();
  const links = form.getAll("links").map(String).map((link) => link.trim()).filter(Boolean);
  const files = form.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (subject.length < 3 || subject.length > 80) return NextResponse.json({ error: "Subject must be between 3 and 80 characters." }, { status: 400 });
  if (goal.length < 10 || goal.length > 600) return NextResponse.json({ error: "Describe what you want to understand in 10 to 600 characters." }, { status: 400 });
  if (links.length > 4 || links.some((link) => !isSafeSourceUrl(link))) return NextResponse.json({ error: "Add up to four public HTTPS source links." }, { status: 400 });
  if (files.length > 4) return NextResponse.json({ error: "Attach up to four files." }, { status: 400 });
  if (files.some((file) => file.size > 6_000_000) || files.reduce((total, file) => total + file.size, 0) > 12_000_000) {
    return NextResponse.json({ error: "Files must be under 6 MB each and 12 MB combined." }, { status: 400 });
  }
  if (files.some((file) => file.type !== "application/pdf" && !isTextFile(file))) {
    return NextResponse.json({ error: "Attach PDF, Markdown, text, CSV, or JSON files." }, { status: 400 });
  }

  const fetched = (await Promise.all(links.map((link, index) => fetchSource(link, linkSourceId(link, index))))).filter((source): source is FetchedSource => Boolean(source));
  const textFiles = (await Promise.all(files.map((file, index) => readTextFile(file, fileSourceId(file, index))))).filter((source): source is TextFileSource => Boolean(source));
  const fallback = demoPath(subject, goal, fetched, textFiles, files);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json(fallback);

  try {
    const sourceSections = [
      ...fetched.map((source) => `Source ID: ${source.id}\nSource link: ${source.title}\nURL: ${source.url}\n${source.text.slice(0, 16_000)}`),
      ...textFiles.map((source) => `Source ID: ${source.id}\nSource file: ${source.name}\n${source.text.slice(0, 16_000)}`),
    ];
    const content: Array<Record<string, string>> = [
      {
        type: "input_text",
        text: `Subject: ${subject}\nLearner goal: ${goal}\n\nAvailable source material:\n${sourceSections.join("\n\n").slice(0, 80_000) || "No extractable source text was supplied."}`,
      },
    ];

    for (const [index, file] of files.entries()) {
      if (file.type !== "application/pdf") continue;
      content.push({ type: "input_text", text: `The following PDF has Source ID: ${fileSourceId(file, index)}` });
      content.push({ type: "input_file", filename: file.name, file_data: await fileDataUrl(file) });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5.6-sol",
        reasoning: { effort: "high" },
        store: false,
        max_output_tokens: 2200,
        input: [
          {
            role: "system",
            content: "You design source-grounded learning paths for Current. Produce 5 to 7 progressive, specific concepts that move from prerequisite mental models to application. Every concept needs a concrete learning objective, a two-sentence-or-shorter explanation, and 2 to 4 checkpoints that can be tested through active recall. When source material is supplied, include the exact relevant source IDs and a concise source-grounded note for each concept. Use an empty sourceIds array and empty sourceNote only when no supplied evidence supports that concept. Avoid tautologies such as 'understand X' for a concept named X. Use supplied source terminology when relevant, but do not reproduce navigation headings or invent claims. Keep the title literal and concise. relatedPathId may be long-running, responses-api, agent-evals, or null.",
          },
          { role: "user", content },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "learning_path",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                concepts: {
                  type: "array",
                  minItems: 5,
                  maxItems: 7,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      title: { type: "string" },
                      objective: { type: "string" },
                      summary: { type: "string" },
                      checkpoints: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } },
                      sourceIds: { type: "array", maxItems: 4, items: { type: "string" } },
                      sourceNote: { type: "string" },
                    },
                    required: ["title", "objective", "summary", "checkpoints", "sourceIds", "sourceNote"],
                  },
                },
                relatedPathId: { anyOf: [{ type: "string", enum: ["long-running", "responses-api", "agent-evals"] }, { type: "null" }] },
              },
              required: ["title", "description", "concepts", "relatedPathId"],
            },
          },
        },
      }),
    });

    if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
    const text = outputText(await response.json());
    if (!text) throw new Error("OpenAI response did not contain output text");
    const generated = validateGeneratedPath(JSON.parse(text));
    if (!generated) throw new Error("OpenAI response did not match the learning path contract");
    return NextResponse.json({ ...generated, mode: "live" as const });
  } catch (error) {
    console.error("Live path generation failed; using deterministic fallback", error);
    return NextResponse.json(fallback);
  }
}
