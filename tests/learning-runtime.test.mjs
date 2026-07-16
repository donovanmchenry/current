import assert from "node:assert/strict";
import test from "node:test";

import { reviewQualityForAttempt, updateConceptMemory } from "../lib/learning-runtime.ts";

test("stores an unresolved recall gap by concept", () => {
  const memory = updateConceptMemory(undefined, {
    score: 52,
    misconception: "The answer omits what the compact item preserves.",
    supportMode: "none",
  }, new Date("2026-07-16T12:00:00.000Z"));

  assert.equal(memory.attempts, 1);
  assert.equal(memory.successfulRecalls, 0);
  assert.match(memory.lastMisconception ?? "", /compact item preserves/);
  assert.equal(memory.preferredSupport, null);
});

test("clears a resolved gap and remembers the support that worked", () => {
  const failed = updateConceptMemory(undefined, {
    score: 52,
    misconception: "The answer omits the preserved state.",
    supportMode: "visual",
  });
  const recovered = updateConceptMemory(failed, {
    score: 88,
    misconception: null,
    supportMode: "visual",
  });

  assert.equal(recovered.attempts, 2);
  assert.equal(recovered.successfulRecalls, 1);
  assert.equal(recovered.lastMisconception, null);
  assert.equal(recovered.preferredSupport, "visual");
});

test("uses recall retries to shorten the next review interval", () => {
  assert.equal(reviewQualityForAttempt(94, 1), 5);
  assert.equal(reviewQualityForAttempt(84, 1), 4);
  assert.equal(reviewQualityForAttempt(94, 2), 3);
  assert.equal(reviewQualityForAttempt(68, 1), 2);
});
