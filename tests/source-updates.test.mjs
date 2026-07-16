import assert from "node:assert/strict";
import test from "node:test";

import {
  createSourceSnapshot,
  fallbackSourceUpdate,
  hasMeaningfulSourceChange,
} from "../lib/source-updates.ts";

const concepts = [
  {
    title: "Pressure zones",
    objective: "Balance elevation and delivery pressure across a distribution network.",
    summary: "Pressure zones keep service reliable across changing terrain.",
    checkpoints: ["Elevation changes pressure", "Zones limit pressure ranges"],
    sourceIds: ["water-guide"],
    sourceNote: "Pressure zones prevent low service pressure and excessive pipe pressure.",
  },
  {
    title: "Demand forecasting",
    objective: "Estimate peak and seasonal water use.",
    summary: "Forecasts determine network capacity.",
    checkpoints: ["Model peak demand", "Account for seasonal variation"],
  },
];

test("normalizes snapshots and ignores formatting-only changes", () => {
  const capturedAt = "2026-07-16T12:00:00.000Z";
  const previous = createSourceSnapshot("Pressure zones balance elevation and delivery pressure.", capturedAt);
  const latest = createSourceSnapshot("  Pressure zones   balance elevation and delivery pressure.  ", capturedAt);

  assert.equal(previous.fingerprint, latest.fingerprint);
  assert.equal(hasMeaningfulSourceChange(previous, latest), false);
});

test("detects new source evidence and prepares a reviewable concept patch", () => {
  const previous = createSourceSnapshot(
    "Pressure zones balance elevation and delivery pressure across a city water network.",
    "2026-07-01T12:00:00.000Z",
  );
  const latest = createSourceSnapshot(
    "Pressure zones balance elevation and delivery pressure across a city water network. Updated guidance requires transient pressure analysis before changing zone boundaries.",
    "2026-07-16T12:00:00.000Z",
  );

  assert.equal(hasMeaningfulSourceChange(previous, latest), true);
  const proposal = fallbackSourceUpdate({
    pathId: "water-systems",
    sourceId: "water-guide",
    sourceTitle: "Water planning guide",
    sourceHref: "https://example.com/water-guide",
    previous,
    latest,
    concepts,
  });

  assert.equal(proposal.status, "ready");
  assert.equal(proposal.mode, "demo");
  assert.equal(proposal.affectedConceptIndexes[0], 0);
  assert.match(proposal.afterExcerpt, /transient pressure analysis/i);
  assert.equal(proposal.patches[0].conceptIndex, 0);
  assert.match(proposal.patches[0].sourceNote, /transient pressure analysis/i);
  assert.ok(proposal.patches[0].checkpoints.includes("Explain what the refreshed source changes"));
});
