import { NextResponse } from "next/server";

type Evaluation = {
  score: number;
  verdict: string;
  feedback: string;
  misconception: string | null;
  nextPrompt: string;
  mode: "live" | "demo";
};

function demoEvaluation(answer: string): Evaluation {
  const normalized = answer.toLowerCase();
  const mentionsTrigger = normalized.includes("threshold") || normalized.includes("token count") || normalized.includes("context limit");
  const mentionsPreservedState = normalized.includes("state") || normalized.includes("reasoning") || normalized.includes("context");
  const mentionsCompactItem = normalized.includes("opaque") || normalized.includes("compact item") || normalized.includes("compaction item");
  const mentionsNextRequest = normalized.includes("new user") || normalized.includes("new message") || normalized.includes("only the new");
  const mentionsResponseId = normalized.includes("previous_response_id") || normalized.includes("response id");
  const score = Math.min(
    96,
    28
      + Number(mentionsTrigger) * 18
      + Number(mentionsPreservedState) * 16
      + Number(mentionsCompactItem) * 12
      + Number(mentionsNextRequest) * 13
      + Number(mentionsResponseId) * 13,
  );

  const missing: string[] = [];
  if (!mentionsTrigger) missing.push("the configured token threshold triggers compaction");
  if (!(mentionsPreservedState && mentionsCompactItem)) missing.push("an opaque item preserves the key prior state and reasoning");
  if (!(mentionsNextRequest && mentionsResponseId)) missing.push("the next chained request contains only the new user message plus previous_response_id");

  return {
    score,
    verdict: score >= 78 ? "You have the handoff" : score >= 60 ? "One link is missing" : "Rebuild the sequence",
    feedback: score >= 78
      ? "You connected the trigger, preserved state, and next-request behavior into one accurate sequence."
      : `Your explanation still needs ${missing[0] ?? "the relationship between the compact item and the next request"}.`,
    misconception: score >= 78 ? null : missing.join("; "),
    nextPrompt: score >= 78 ? "Configure compaction for a long-running agent." : "Try the visual sequence, then explain the handoff again.",
    mode: "demo",
  };
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
      if (!part || typeof part !== "object") continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") return text;
    }
  }

  return null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as { answer?: string };
  const answer = body.answer?.trim() ?? "";
  if (!answer) return NextResponse.json({ error: "Answer is required" }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json(demoEvaluation(answer));

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-sol",
        reasoning: { effort: "high" },
        input: [
          {
            role: "system",
            content: "You are Current's concise recall evaluator. Grade only these three ideas: server-side compaction runs when rendered token count crosses the configured compact_threshold; it returns an opaque item that preserves key prior state and reasoning with fewer tokens; when chaining with previous_response_id, the next request should contain only the new user message and should not manually prune the chain. Do not require claims beyond this rubric.",
          },
          {
            role: "user",
            content: `Evaluate this learner answer: ${answer}`,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "recall_evaluation",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                score: { type: "number", minimum: 0, maximum: 100 },
                verdict: { type: "string" },
                feedback: { type: "string" },
                misconception: { type: ["string", "null"] },
                nextPrompt: { type: "string" },
              },
              required: ["score", "verdict", "feedback", "misconception", "nextPrompt"],
            },
          },
        },
      }),
    });

    if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
    const result = await response.json();
    const text = outputText(result);
    if (!text) throw new Error("OpenAI response did not contain output text");
    const evaluation = JSON.parse(text) as Omit<Evaluation, "mode">;
    return NextResponse.json({ ...evaluation, mode: "live" });
  } catch (error) {
    console.error("Live evaluation failed; using deterministic fallback", error);
    return NextResponse.json(demoEvaluation(answer));
  }
}
