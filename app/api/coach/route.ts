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
  const mentionsAlias = normalized.includes("alias") || normalized.includes("route");
  const mentionsSol = normalized.includes("sol");
  const mentionsExplicit = normalized.includes("explicit") || normalized.includes("clear") || normalized.includes("config");
  const score = Math.min(96, 38 + Number(mentionsAlias) * 24 + Number(mentionsSol) * 18 + Number(mentionsExplicit) * 16);

  return {
    score,
    verdict: score >= 78 ? "Strong explanation" : score >= 60 ? "Mostly there" : "Partially correct",
    feedback: score >= 78
      ? "You connected the alias to Sol and explained why the explicit ID makes intent clearer in configuration."
      : mentionsAlias
        ? "You identified the routing alias. Add that gpt-5.6-sol names the tier directly and makes the selection explicit in code."
        : "The key missing relationship is that gpt-5.6 is an alias that currently routes to gpt-5.6-sol.",
    misconception: score >= 78 ? null : "Treating the family alias and explicit tier ID as unrelated model versions.",
    nextPrompt: "Apply the distinction in a model configuration.",
    mode: "demo",
  };
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
            content: "You are Current's concise recall evaluator. Grade only against this claim: gpt-5.6 is an alias that currently routes to gpt-5.6-sol; the explicit ID directly names the Sol tier and makes intent legible in configuration. Do not require claims beyond this rubric.",
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
    const result = (await response.json()) as { output_text?: string };
    if (!result.output_text) throw new Error("OpenAI response did not contain output_text");
    const evaluation = JSON.parse(result.output_text) as Omit<Evaluation, "mode">;
    return NextResponse.json({ ...evaluation, mode: "live" });
  } catch (error) {
    console.error("Live evaluation failed; using deterministic fallback", error);
    return NextResponse.json(demoEvaluation(answer));
  }
}
