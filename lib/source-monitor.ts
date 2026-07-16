import type { LearningPath, LearningSource, SourceUpdateProposal } from "./learning-path";

export const sourceRefreshIntervalMs = 24 * 60 * 60 * 1000;

export type BackgroundSourceCheck = {
  path: LearningPath;
  source: LearningSource & { href: string };
};

export function isSourceStale(source: LearningSource, now = Date.now(), intervalMs = sourceRefreshIntervalMs) {
  if (!source.snapshot) return true;
  const capturedAt = new Date(source.snapshot.capturedAt).getTime();
  return !Number.isFinite(capturedAt) || now - capturedAt >= intervalMs;
}

export function selectBackgroundSource(
  paths: LearningPath[],
  updates: SourceUpdateProposal[],
  activePathId: string,
  now = Date.now(),
): BackgroundSourceCheck | null {
  if (updates.some((update) => update.status === "ready")) return null;

  const candidates = paths.flatMap((path) => (path.sources ?? [])
    .filter((source): source is LearningSource & { href: string } => (
      source.kind === "link"
      && typeof source.href === "string"
      && isSourceStale(source, now)
    ))
    .map((source) => ({ path, source })));

  candidates.sort((left, right) => {
    const activeDifference = Number(right.path.id === activePathId) - Number(left.path.id === activePathId);
    if (activeDifference) return activeDifference;
    const leftTime = left.source.snapshot ? new Date(left.source.snapshot.capturedAt).getTime() : 0;
    const rightTime = right.source.snapshot ? new Date(right.source.snapshot.capturedAt).getTime() : 0;
    return leftTime - rightTime;
  });

  return candidates[0] ?? null;
}
