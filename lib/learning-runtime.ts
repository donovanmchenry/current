import type { LearningPath } from "./learning-path";
import type { ReviewMemory } from "./spaced-review";

export type PathProgress = {
  currentConceptIndex: number;
  completedConceptIndexes: number[];
};

export type ReviewItem = {
  id: string;
  pathId: string;
  conceptIndex: number;
  dueAt: string;
  memory: ReviewMemory;
  reason: "completion" | "research";
};

export type LearningRuntimeSnapshot = {
  activePathId: string;
  activeConceptIndex: number;
  queue: string[];
  progress: Record<string, PathProgress>;
  reviews: ReviewItem[];
  customPaths: LearningPath[];
  suggestedPathAdded: boolean;
  notes: Record<string, string>;
  reflections: Record<string, string>;
};

export const defaultProgress: Record<string, PathProgress> = {
  "long-running": { currentConceptIndex: 1, completedConceptIndexes: [0] },
  "responses-api": { currentConceptIndex: 3, completedConceptIndexes: [0, 1, 2] },
  "agent-evals": { currentConceptIndex: 1, completedConceptIndexes: [0] },
};

export const defaultReviews: ReviewItem[] = [
  {
    id: "review-responses-api-1",
    pathId: "responses-api",
    conceptIndex: 1,
    dueAt: "2026-07-14T12:00:00.000Z",
    memory: { intervalDays: 3, ease: 2.5, repetitions: 2 },
    reason: "completion",
  },
  {
    id: "review-responses-api-2",
    pathId: "responses-api",
    conceptIndex: 2,
    dueAt: "2026-07-14T12:00:00.000Z",
    memory: { intervalDays: 1, ease: 2.4, repetitions: 1 },
    reason: "completion",
  },
];

export function progressForPath(path: LearningPath, saved?: PathProgress): PathProgress {
  const fallbackIndex = Math.max(0, path.concepts.findIndex((concept) => concept.title === path.next));
  const currentConceptIndex = Math.max(0, Math.min(path.concepts.length - 1, saved?.currentConceptIndex ?? fallbackIndex));
  const completedConceptIndexes = [...new Set(saved?.completedConceptIndexes ?? Array.from({ length: currentConceptIndex }, (_, index) => index))]
    .filter((index) => Number.isInteger(index) && index >= 0 && index < path.concepts.length)
    .sort((left, right) => left - right);
  return { currentConceptIndex, completedConceptIndexes };
}

export function pathWithProgress(path: LearningPath, saved?: PathProgress, reviewCount = 0, active = false): LearningPath {
  const progress = progressForPath(path, saved);
  const complete = progress.completedConceptIndexes.length === path.concepts.length;
  const nextConcept = complete ? null : path.concepts[progress.currentConceptIndex] ?? path.concepts.find((_, index) => !progress.completedConceptIndexes.includes(index));
  const percentage = Math.round((progress.completedConceptIndexes.length / path.concepts.length) * 100);
  const status = complete
    ? "Complete"
    : reviewCount > 0
      ? `${reviewCount} review${reviewCount === 1 ? "" : "s"} due`
      : active
        ? "In progress"
        : path.userCreated ? "Ready to begin" : path.status;

  return { ...path, progress: percentage, next: nextConcept?.title ?? "Complete", status };
}

export function nextIncompleteConcept(path: LearningPath, progress: PathProgress, afterIndex: number) {
  for (let index = afterIndex + 1; index < path.concepts.length; index += 1) {
    if (!progress.completedConceptIndexes.includes(index)) return index;
  }
  for (let index = 0; index < path.concepts.length; index += 1) {
    if (!progress.completedConceptIndexes.includes(index)) return index;
  }
  return null;
}

export function isDue(review: ReviewItem, now = new Date()) {
  return new Date(review.dueAt).getTime() <= now.getTime();
}

export function isStoredLearningPath(value: unknown): value is LearningPath {
  if (!value || typeof value !== "object") return false;
  const path = value as Partial<LearningPath>;
  if (!path.userCreated || typeof path.id !== "string" || !path.id.startsWith("custom-") || typeof path.title !== "string" || typeof path.description !== "string") return false;
  if (typeof path.progress !== "number" || typeof path.next !== "string" || typeof path.status !== "string" || !Array.isArray(path.concepts) || path.concepts.length < 1) return false;
  if (!path.concepts.every((concept) => concept && typeof concept.title === "string" && typeof concept.objective === "string")) return false;
  if (path.sources && (!Array.isArray(path.sources) || !path.sources.every((source) => {
    if (!source || typeof source.id !== "string" || typeof source.title !== "string" || (source.kind !== "file" && source.kind !== "link")) return false;
    if (!source.href) return true;
    try { return new URL(source.href).protocol === "https:"; } catch { return false; }
  }))) return false;
  return true;
}
