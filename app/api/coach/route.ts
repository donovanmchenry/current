import { NextResponse } from "next/server";

import { currentModelRoutes, type CurrentModelId } from "@/lib/model-routing";

type Evaluation = {
  score: number;
  verdict: string;
  feedback: string;
  misconception: string | null;
  nextPrompt: string;
  mode: "live" | "demo";
  model?: CurrentModelId;
};

type RecallRubric = {
  concept: string;
  objective: string;
  checkpoints: string[];
};

type EvaluationPhase = "recall" | "application";

function compactionEvaluation(answer: string): Evaluation {
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

function genericEvaluation(answer: string, rubric: RecallRubric): Evaluation {
  const normalized = answer.toLowerCase();
  const rubricText = [rubric.objective, ...rubric.checkpoints].join(" ").toLowerCase();
  const stopWords = new Set(["about", "after", "before", "between", "choose", "define", "explain", "from", "into", "that", "their", "this", "using", "what", "when", "where", "which", "while", "with", "without", "your"]);
  const rubricTerms = [...new Set(rubricText.match(/[a-z][a-z0-9_-]{3,}/g) ?? [])].filter((word) => !stopWords.has(word));
  const matchedTerms = rubricTerms.filter((word) => normalized.includes(word));
  const coverage = rubricTerms.length ? matchedTerms.length / Math.min(rubricTerms.length, 8) : 0;
  const score = Math.min(94, Math.round(38 + Math.min(answer.length, 160) / 5 + Math.min(coverage, 1) * 28));
  const passed = score >= 75;
  const missingCheckpoint = rubric.checkpoints.find((checkpoint) => {
    const firstUsefulWord = checkpoint.toLowerCase().match(/[a-z][a-z0-9_-]{3,}/)?.[0];
    return firstUsefulWord ? !normalized.includes(firstUsefulWord) : false;
  });

  return {
    score,
    verdict: passed ? "You rebuilt the core idea" : "Add the missing relationship",
    feedback: passed
      ? "Your explanation connects the concept to its purpose in your own wording."
      : `Explain how ${rubric.concept.toLowerCase()} changes a decision or outcome, not only what it is called.`,
    misconception: passed ? null : missingCheckpoint ?? rubric.objective,
    nextPrompt: passed ? "Apply the idea to a concrete situation." : "Use the visual sequence, then try again.",
    mode: "demo",
  };
}

function applicationEvaluation(answer: string, rubric: RecallRubric): Evaluation {
  const normalized = answer.toLowerCase();
  const rubricText = [rubric.objective, ...rubric.checkpoints].join(" ").toLowerCase();
  const stopWords = new Set(["about", "after", "before", "between", "choose", "define", "explain", "from", "into", "that", "their", "this", "using", "what", "when", "where", "which", "while", "with", "without", "your"]);
  const rubricTerms = [...new Set(rubricText.match(/[a-z][a-z0-9_-]{3,}/g) ?? [])].filter((word) => !stopWords.has(word));
  const matchedTerms = rubricTerms.filter((word) => normalized.includes(word));
  const coverage = rubricTerms.length ? matchedTerms.length / Math.min(rubricTerms.length, 8) : 0;
  const namesSituation = /\b(?:if|when|project|case|scenario|situation|need|team|system)\b/.test(normalized);
  const namesChoice = /\b(?:would|choose|decide|select|change|implement|use|avoid|prioritize)\b/.test(normalized);
  const givesReason = /\b(?:because|therefore|since|so that|which means|in order to|reason)\b/.test(normalized);
  const score = Math.min(96, Math.round(18 + Number(namesSituation) * 16 + Number(namesChoice) * 22 + Number(givesReason) * 20 + Math.min(coverage, 1) * 28));
  const passed = score >= 75;
  const missing = !namesSituation ? "name the concrete situation" : !namesChoice ? "state the choice you would make" : !givesReason ? "explain why the concept changes that choice" : "connect the reasoning more directly to the lesson";

  return {
    score,
    verdict: passed ? "The concept changes the decision" : "Make the application concrete",
    feedback: passed ? "You named a situation, made a choice, and connected the reason to the lesson’s operating idea." : `Your response needs one more move: ${missing}.`,
    misconception: passed ? null : missing,
    nextPrompt: passed ? "Reflect on when you will recognize this situation again." : "Rewrite the response as situation, choice, then reason.",
    mode: "demo",
  };
}

function demoEvaluation(answer: string, rubric: RecallRubric, phase: EvaluationPhase) {
  if (phase === "application") return applicationEvaluation(answer, rubric);
  return rubric.concept.toLowerCase() === "compaction" ? compactionEvaluation(answer) : genericEvaluation(answer, rubric);
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
  const body = (await request.json()) as { answer?: string; concept?: string; objective?: string; checkpoints?: unknown; phase?: EvaluationPhase };
  const answer = body.answer?.trim() ?? "";
  if (!answer) return NextResponse.json({ error: "Answer is required" }, { status: 400 });
  const phase: EvaluationPhase = body.phase === "application" ? "application" : "recall";
  const rubric: RecallRubric = {
    concept: body.concept?.trim().slice(0, 120) || "Compaction",
    objective: body.objective?.trim().slice(0, 500) || "Explain when compaction runs, what its opaque item preserves, and what the next chained request contains.",
    checkpoints: Array.isArray(body.checkpoints) ? body.checkpoints.filter((item): item is string => typeof item === "string").map((item) => item.slice(0, 240)).slice(0, 8) : [],
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json(demoEvaluation(answer, rubric, phase));

  try {
    const route = currentModelRoutes.learningCoach;
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: route.model,
        reasoning: { effort: route.reasoningEffort },
        input: [
          {
            role: "system",
            content: phase === "application"
              ? "You are Current's concise application evaluator. Grade only against the supplied concept, prompt, and rubric. A passing response names a concrete situation, makes a choice, and explains why the lesson's operating idea changes that choice. Do not reward length or terminology alone. A score of 75 means the learner can use the idea in context."
              : "You are Current's concise active-recall evaluator. Grade the learner only against the supplied concept, objective, and checkpoints. Reward accurate relationships expressed in the learner's own words. Do not require facts outside the rubric. A score of 75 means the learner has the operating idea and can move to application.",
          },
          {
            role: "user",
            content: JSON.stringify({ rubric, learnerAnswer: answer.slice(0, 4000) }),
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
    return NextResponse.json({ ...evaluation, mode: "live", model: route.model });
  } catch (error) {
    console.error("Live evaluation failed; using deterministic fallback", error);
    return NextResponse.json(demoEvaluation(answer, rubric, phase));
  }
}
