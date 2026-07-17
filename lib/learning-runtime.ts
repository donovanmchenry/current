import type { LearningPath, SourceSnapshot, SourceUpdateProposal } from "./learning-path";
import type { ClassroomNavigationState, ClassroomStudentEvidence } from "./classroom-catalog";
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

export type ConceptMemory = {
  attempts: number;
  successfulRecalls: number;
  lastScore: number;
  lastMisconception: string | null;
  preferredSupport: "visual" | "example" | null;
  updatedAt: string;
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
  checkedSources?: CheckedSourceSnapshot[];
  sourceUpdates?: SourceUpdateProposal[];
  researchUpdateApplied?: boolean;
  learnerProfile?: LearnerProfile;
  conceptMemories?: Record<string, ConceptMemory>;
  classroomUpdateStatus?: "ready" | "applied" | "dismissed";
  classroomNavigation?: ClassroomNavigationState;
  classroomStudentEvidence?: Record<string, ClassroomStudentEvidence>;
};

export type CheckedSourceSnapshot = {
  pathId: string;
  sourceId: string;
  snapshot: SourceSnapshot;
};

export type LearnerProfile = {
  recallAttempts: number;
  successfulRecalls: number;
  visualSuccesses: number;
  exampleSuccesses: number;
  preferredSupport: "visual" | "example" | null;
};

export const defaultLearnerProfile: LearnerProfile = {
  recallAttempts: 0,
  successfulRecalls: 0,
  visualSuccesses: 0,
  exampleSuccesses: 0,
  preferredSupport: null,
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

export function updateConceptMemory(
  current: ConceptMemory | undefined,
  result: { score: number; misconception: string | null; supportMode: "none" | "visual" | "example" },
  updatedAt = new Date(),
): ConceptMemory {
  const passed = result.score >= 75;
  return {
    attempts: (current?.attempts ?? 0) + 1,
    successfulRecalls: (current?.successfulRecalls ?? 0) + Number(passed),
    lastScore: Math.max(0, Math.min(100, Math.round(result.score))),
    lastMisconception: passed ? null : result.misconception ?? current?.lastMisconception ?? "Rebuild this concept before the next session.",
    preferredSupport: passed && result.supportMode !== "none" ? result.supportMode : current?.preferredSupport ?? null,
    updatedAt: updatedAt.toISOString(),
  };
}

export function reviewQualityForAttempt(score: number, attemptsThisSession: number) {
  const boundedScore = Math.max(0, Math.min(100, score));
  const attempts = Math.max(1, Math.round(attemptsThisSession));
  if (boundedScore < 75) return 2;
  if (attempts > 1) return 3;
  return boundedScore >= 90 ? 5 : 4;
}

export function isStoredLearningPath(value: unknown): value is LearningPath {
  if (!value || typeof value !== "object") return false;
  const path = value as Partial<LearningPath>;
  const validId = typeof path.id === "string" && (path.id.startsWith("custom-") || path.id.startsWith("classroom-"));
  if (!path.userCreated || !validId || typeof path.title !== "string" || typeof path.description !== "string") return false;
  if (path.id.startsWith("classroom-") && typeof path.classroomStudentId !== "string") return false;
  if (typeof path.progress !== "number" || typeof path.next !== "string" || typeof path.status !== "string" || !Array.isArray(path.concepts) || path.concepts.length < 1) return false;
  if (!path.concepts.every((concept) => concept
    && typeof concept.title === "string"
    && typeof concept.objective === "string"
    && (!concept.sourceIds || (Array.isArray(concept.sourceIds) && concept.sourceIds.every((id) => typeof id === "string")))
    && (!concept.sourceNote || typeof concept.sourceNote === "string"))) return false;
  if (path.sources && (!Array.isArray(path.sources) || !path.sources.every((source) => {
    if (!source || typeof source.id !== "string" || typeof source.title !== "string" || (source.kind !== "file" && source.kind !== "link")) return false;
    if (source.snapshot && (typeof source.snapshot.content !== "string" || typeof source.snapshot.capturedAt !== "string" || typeof source.snapshot.fingerprint !== "string")) return false;
    if (source.artifactId !== undefined && (typeof source.artifactId !== "string" || !source.artifactId)) return false;
    if (!source.href) return true;
    try { return new URL(source.href).protocol === "https:"; } catch { return false; }
  }))) return false;
  return true;
}

export function isStoredSourceUpdate(value: unknown): value is SourceUpdateProposal {
  if (!value || typeof value !== "object") return false;
  const update = value as Partial<SourceUpdateProposal>;
  if (typeof update.id !== "string" || typeof update.pathId !== "string" || typeof update.sourceId !== "string" || typeof update.sourceTitle !== "string" || typeof update.sourceHref !== "string") return false;
  if (!["ready", "applied", "dismissed"].includes(update.status ?? "") || typeof update.summary !== "string" || typeof update.beforeExcerpt !== "string" || typeof update.afterExcerpt !== "string") return false;
  if (!Array.isArray(update.affectedConceptIndexes) || !update.affectedConceptIndexes.every((index) => Number.isInteger(index))) return false;
  if (!Array.isArray(update.patches) || !update.patches.every((patch) => patch && Number.isInteger(patch.conceptIndex) && typeof patch.summary === "string" && typeof patch.sourceNote === "string" && Array.isArray(patch.checkpoints))) return false;
  return Boolean(update.latestSnapshot && typeof update.latestSnapshot.content === "string" && typeof update.latestSnapshot.capturedAt === "string" && typeof update.latestSnapshot.fingerprint === "string");
}

export function isStoredCheckedSource(value: unknown): value is CheckedSourceSnapshot {
  if (!value || typeof value !== "object") return false;
  const checked = value as Partial<CheckedSourceSnapshot>;
  return Boolean(
    typeof checked.pathId === "string"
    && typeof checked.sourceId === "string"
    && checked.snapshot
    && typeof checked.snapshot.content === "string"
    && typeof checked.snapshot.capturedAt === "string"
    && typeof checked.snapshot.fingerprint === "string",
  );
}
