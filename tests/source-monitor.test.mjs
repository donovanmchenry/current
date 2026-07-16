import assert from "node:assert/strict";
import test from "node:test";

import { createSourceSnapshot } from "../lib/source-updates.ts";
import { isSourceStale, selectBackgroundSource, sourceRefreshIntervalMs } from "../lib/source-monitor.ts";

const now = new Date("2026-07-17T12:00:00.000Z").getTime();
const source = (id, capturedAt) => ({
  id,
  kind: "link",
  title: id,
  href: `https://example.com/${id}`,
  snapshot: capturedAt ? createSourceSnapshot(`${id} source content`, capturedAt) : undefined,
});
const path = (id, sources) => ({
  id,
  title: id,
  description: `${id} description`,
  progress: 0,
  next: "Concept",
  status: "Ready",
  concepts: [{ title: "Concept", objective: "Understand the concept." }],
  sources,
});

test("marks missing and expired source snapshots as stale", () => {
  assert.equal(isSourceStale(source("missing"), now), true);
  assert.equal(isSourceStale(source("fresh", "2026-07-17T11:30:00.000Z"), now), false);
  assert.equal(isSourceStale(source("old", "2026-07-15T11:30:00.000Z"), now), true);
  assert.equal(sourceRefreshIntervalMs, 86_400_000);
});

test("selects one stale source and prioritizes the active path", () => {
  const selected = selectBackgroundSource([
    path("other", [source("other-source")]),
    path("active", [source("active-source")]),
  ], [], "active", now);

  assert.equal(selected?.path.id, "active");
  assert.equal(selected?.source.id, "active-source");
});

test("pauses background research while an update awaits review", () => {
  const selected = selectBackgroundSource([
    path("active", [source("active-source")]),
  ], [{ status: "ready" }], "active", now);

  assert.equal(selected, null);
});

test("does not select a source whose snapshot is still fresh", () => {
  const selected = selectBackgroundSource([
    path("active", [source("active-source", "2026-07-17T11:30:00.000Z")]),
  ], [], "active", now);

  assert.equal(selected, null);
});
