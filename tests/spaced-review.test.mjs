import assert from "node:assert/strict";
import test from "node:test";
import { scheduleReview } from "../lib/spaced-review.ts";

test("successful recall expands the interval", () => {
  const schedule = scheduleReview(
    { intervalDays: 1, ease: 2.5, repetitions: 2 },
    4,
    new Date("2026-07-14T09:00:00Z"),
  );

  assert.equal(schedule.intervalDays, 3);
  assert.equal(schedule.nextReview.toISOString().slice(0, 10), "2026-07-17");
});

test("failed recall resets review to tomorrow", () => {
  const schedule = scheduleReview(
    { intervalDays: 14, ease: 2.4, repetitions: 6 },
    2,
    new Date("2026-07-14T09:00:00Z"),
  );

  assert.equal(schedule.intervalDays, 1);
  assert.equal(schedule.repetitions, 0);
  assert.equal(schedule.nextReview.toISOString().slice(0, 10), "2026-07-15");
});
