export type ReviewMemory = {
  intervalDays: number;
  ease: number;
  repetitions: number;
};

export type ReviewSchedule = ReviewMemory & {
  nextReview: Date;
};

export function scheduleReview(
  memory: ReviewMemory,
  quality: number,
  reviewedAt = new Date(),
): ReviewSchedule {
  const boundedQuality = Math.max(0, Math.min(5, Math.round(quality)));

  if (boundedQuality < 3) {
    const nextReview = new Date(reviewedAt);
    nextReview.setDate(nextReview.getDate() + 1);
    return {
      intervalDays: 1,
      ease: Math.max(1.3, memory.ease - 0.2),
      repetitions: 0,
      nextReview,
    };
  }

  const repetitions = memory.repetitions + 1;
  const easeDelta =
    0.1 - (5 - boundedQuality) * (0.08 + (5 - boundedQuality) * 0.02);
  const ease = Math.max(1.3, Number((memory.ease + easeDelta).toFixed(2)));
  const intervalDays =
    repetitions === 1
      ? 1
      : repetitions === 2
        ? 3
        : Math.max(1, Math.round(memory.intervalDays * ease));

  const nextReview = new Date(reviewedAt);
  nextReview.setDate(nextReview.getDate() + intervalDays);

  return { intervalDays, ease, repetitions, nextReview };
}
