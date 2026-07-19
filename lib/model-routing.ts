export const currentModelRoutes = {
  pathPlanner: {
    model: "gpt-5.6-sol",
    label: "GPT-5.6 Sol",
    reasoningEffort: "medium",
    purpose: "Design a coherent, source-grounded curriculum without making path creation wait on maximum deliberation.",
  },
  lessonAuthor: {
    model: "gpt-5.6-terra",
    label: "GPT-5.6 Terra",
    reasoningEffort: "medium",
    purpose: "Turn one concept into a balanced, source-grounded lesson.",
  },
  learningCoach: {
    model: "gpt-5.6-luna",
    label: "GPT-5.6 Luna",
    reasoningEffort: "low",
    purpose: "Evaluate frequent recall and application attempts with low latency.",
  },
  sourceResearch: {
    model: "gpt-5.6-sol",
    label: "GPT-5.6 Sol",
    reasoningEffort: "high",
    purpose: "Judge whether new source evidence should change the curriculum.",
  },
} as const;

export type CurrentModelRoute = keyof typeof currentModelRoutes;
export type CurrentModelId = (typeof currentModelRoutes)[CurrentModelRoute]["model"];

export function currentModelLabel(model?: CurrentModelId) {
  const route = Object.values(currentModelRoutes).find((candidate) => candidate.model === model);
  return route?.label ?? "GPT-5.6";
}
