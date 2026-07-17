import { NextResponse } from "next/server";

import type { GeneratedLesson, LearningConcept, LearningSource, LessonPracticeType } from "@/lib/learning-path";
import { currentModelRoutes } from "@/lib/model-routing";

type LessonRequest = {
  pathTitle?: string;
  pathDescription?: string;
  concept?: LearningConcept;
  conceptIndex?: number;
  sources?: LearningSource[];
  practiceType?: LessonPracticeType;
};

function cleanText(value: string, limit = 700) {
  return value.replace(/\s+/g, " ").trim().slice(0, limit);
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

function requestedPracticeType(index: number, requested?: LessonPracticeType): LessonPracticeType {
  if (requested === "multiple_choice" || requested === "true_false" || requested === "open_response") return requested;
  return (["multiple_choice", "open_response", "true_false"] as const)[Math.abs(index) % 3];
}

function deterministicLesson(pathTitle: string, concept: LearningConcept, conceptIndex: number, practiceType: LessonPracticeType): GeneratedLesson {
  const checkpoints = concept.checkpoints?.filter(Boolean).slice(0, 4) ?? [];
  const keyPoints = checkpoints.length >= 2 ? checkpoints : [concept.objective, concept.summary ?? concept.objective];
  const evidence = concept.sourceNote ?? concept.summary ?? concept.objective;
  const application = practiceType === "multiple_choice" ? {
    type: practiceType,
    prompt: `Which response best shows ${concept.title.toLowerCase()} changing a real decision?`,
    options: [
      `Use ${concept.title.toLowerCase()} to decide how to ${concept.objective.replace(/^[A-Z]/, (letter) => letter.toLowerCase())}`,
      `Repeat the definition of ${concept.title.toLowerCase()} without changing the plan`,
      "Choose the most familiar option without checking the underlying relationship",
      "Delay the decision until every possible detail is known",
    ],
    correctIndex: 0,
    rubric: keyPoints.slice(0, 4),
    explanation: `The first response connects ${concept.title.toLowerCase()} to the decision described by the learning objective.`,
  } : practiceType === "true_false" ? {
    type: practiceType,
    prompt: `${concept.title} is useful only as a definition and should not alter a concrete decision.`,
    options: ["True", "False"],
    correctIndex: 1,
    rubric: keyPoints.slice(0, 4),
    explanation: `False. The concept matters because it changes how the learner acts on this objective: ${concept.objective}`,
  } : {
    type: practiceType,
    prompt: `Describe a realistic situation where ${concept.title.toLowerCase()} changes your choice. Name the situation, the choice, and the reason.`,
    options: [],
    correctIndex: -1,
    rubric: keyPoints.slice(0, 4),
    explanation: `A strong response connects the situation and choice to the operating idea behind ${concept.title.toLowerCase()}.`,
  };

  return {
    title: concept.title,
    overview: concept.summary ?? concept.objective,
    reading: [
      evidence,
      `${concept.title} belongs in ${pathTitle} because it supports this outcome: ${concept.objective}`,
      `The useful test is whether you can connect ${keyPoints.slice(0, 3).join(", ")} without relying on the source wording.`,
    ],
    keyPoints: keyPoints.slice(0, 4),
    recallPrompt: `Without looking back, explain ${concept.title.toLowerCase()} and connect ${keyPoints.slice(0, 3).join(", ")}.`,
    recallRubric: keyPoints.slice(0, 4),
    visualSteps: keyPoints.slice(0, 4),
    example: `Imagine you are working toward ${pathTitle.toLowerCase()}. A decision depends on ${concept.title.toLowerCase()}. You identify the relevant relationship, compare it with the goal, and use it to choose the next action rather than merely repeating a definition.`,
    application,
    reflectionPrompt: `What changed in your understanding of ${concept.title.toLowerCase()}, and what will you watch for when you use it?`,
    sourceIds: concept.sourceIds?.slice(0, 4) ?? [],
    mode: "demo",
  };
}

function validateLesson(value: unknown, practiceType: LessonPracticeType): Omit<GeneratedLesson, "mode"> | null {
  if (!value || typeof value !== "object") return null;
  const lesson = value as Partial<GeneratedLesson>;
  const application = lesson.application;
  if (typeof lesson.title !== "string" || typeof lesson.overview !== "string" || !Array.isArray(lesson.reading) || !Array.isArray(lesson.keyPoints)) return null;
  if (typeof lesson.recallPrompt !== "string" || !Array.isArray(lesson.recallRubric) || !Array.isArray(lesson.visualSteps) || typeof lesson.example !== "string") return null;
  if (typeof lesson.reflectionPrompt !== "string" || !Array.isArray(lesson.sourceIds) || !application || application.type !== practiceType) return null;
  if (typeof application.prompt !== "string" || !Array.isArray(application.options) || typeof application.correctIndex !== "number" || !Array.isArray(application.rubric) || typeof application.explanation !== "string") return null;
  const strings = (items: unknown[], limit: number, itemLimit: number) => items.filter((item): item is string => typeof item === "string").map((item) => cleanText(item, itemLimit)).filter(Boolean).slice(0, limit);
  const reading = strings(lesson.reading, 4, 700);
  const keyPoints = strings(lesson.keyPoints, 5, 160);
  const recallRubric = strings(lesson.recallRubric, 5, 160);
  const visualSteps = strings(lesson.visualSteps, 5, 120);
  const options = strings(application.options, 4, 220);
  const rubric = strings(application.rubric, 5, 160);
  if (reading.length < 2 || keyPoints.length < 2 || recallRubric.length < 2 || visualSteps.length < 2 || rubric.length < 2) return null;
  if (practiceType === "multiple_choice" && (options.length < 3 || application.correctIndex < 0 || application.correctIndex >= options.length)) return null;
  if (practiceType === "true_false" && (options.length !== 2 || application.correctIndex < 0 || application.correctIndex > 1)) return null;
  if (practiceType === "open_response" && application.correctIndex !== -1) return null;
  return {
    title: cleanText(lesson.title, 100),
    overview: cleanText(lesson.overview, 500),
    reading,
    keyPoints,
    recallPrompt: cleanText(lesson.recallPrompt, 500),
    recallRubric,
    visualSteps,
    example: cleanText(lesson.example, 700),
    application: {
      type: practiceType,
      prompt: cleanText(application.prompt, 500),
      options,
      correctIndex: application.correctIndex,
      rubric,
      explanation: cleanText(application.explanation, 600),
    },
    reflectionPrompt: cleanText(lesson.reflectionPrompt, 500),
    sourceIds: strings(lesson.sourceIds, 4, 180),
  };
}

export async function POST(request: Request) {
  const body = await request.json() as LessonRequest;
  const concept = body.concept;
  if (!concept || typeof concept.title !== "string" || typeof concept.objective !== "string") {
    return NextResponse.json({ error: "A concept title and objective are required." }, { status: 400 });
  }
  const pathTitle = cleanText(body.pathTitle ?? "this learning path", 120);
  const pathDescription = cleanText(body.pathDescription ?? "", 500);
  const conceptIndex = Number.isInteger(body.conceptIndex) ? Math.max(0, body.conceptIndex as number) : 0;
  const practiceType = requestedPracticeType(conceptIndex, body.practiceType);
  const fallback = deterministicLesson(pathTitle, concept, conceptIndex, practiceType);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json(fallback);

  try {
    const route = currentModelRoutes.lessonAuthor;
    const sourceContext = (body.sources ?? []).slice(0, 6).map((source) => ({ id: source.id, title: source.title, detail: source.detail, href: source.href }));
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: route.model,
        reasoning: { effort: route.reasoningEffort },
        store: false,
        max_output_tokens: 3200,
        input: [
          {
            role: "system",
            content: `You create one source-grounded lesson for Current. Teach the supplied concept through a concise reading, effortful recall, one ${practiceType.replace("_", " ")} application, and reflection. Use the supplied source note as evidence; never invent source claims. Make every section specific to the concept and learner goal. Recall rubrics must describe relationships worth remembering. Visual steps must form a causal or procedural sequence. Application distractors must be plausible and test the operating idea, not wording.`,
          },
          {
            role: "user",
            content: JSON.stringify({ pathTitle, pathDescription, concept, sourceContext, requiredPracticeType: practiceType }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "current_lesson",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                overview: { type: "string" },
                reading: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } },
                keyPoints: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
                recallPrompt: { type: "string" },
                recallRubric: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
                visualSteps: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
                example: { type: "string" },
                application: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    type: { type: "string", enum: [practiceType] },
                    prompt: { type: "string" },
                    options: { type: "array", maxItems: 4, items: { type: "string" } },
                    correctIndex: { type: "number", minimum: -1, maximum: 3 },
                    rubric: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
                    explanation: { type: "string" },
                  },
                  required: ["type", "prompt", "options", "correctIndex", "rubric", "explanation"],
                },
                reflectionPrompt: { type: "string" },
                sourceIds: { type: "array", maxItems: 4, items: { type: "string" } },
              },
              required: ["title", "overview", "reading", "keyPoints", "recallPrompt", "recallRubric", "visualSteps", "example", "application", "reflectionPrompt", "sourceIds"],
            },
          },
        },
      }),
    });
    if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
    const text = outputText(await response.json());
    if (!text) throw new Error("OpenAI response did not contain output text");
    const lesson = validateLesson(JSON.parse(text), practiceType);
    if (!lesson) throw new Error("OpenAI response did not match the lesson contract");
    return NextResponse.json({ ...lesson, mode: "live" as const, model: route.model });
  } catch (error) {
    console.error("Live lesson generation failed; using deterministic fallback", error);
    return NextResponse.json(fallback);
  }
}
