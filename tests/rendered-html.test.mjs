import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Current product shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Current · Keep your knowledge current<\/title>/i);
  assert.match(html, /<link[^>]+rel="icon"[^>]+href="[^"]*\/current-icon\.svg"[^>]*>/i);
  assert.match(html, /Long-running agents/);
  assert.match(html, /What compaction actually preserves/);
  assert.match(html, /Recall/);
  assert.match(html, /Sources/);
  assert.doesNotMatch(html, /Official guide|Active recall|No source visible|Hands-on|1 minute|Learning path/i);
  assert.doesNotMatch(html, /Good afternoon|day streak|Agent trail|New learning track|Make recall prompt|Change the practice|How this track adapts/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps sources in the course sidebar and the notebook notes-only", async () => {
  const source = await readFile(new URL("../app/current-workspace.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /sidebar-sources-viewport \$\{sourcesOpen \? "open"/);
  assert.match(source, /course-sidebar[\s\S]*sidebar-brand[\s\S]*Current/);
  assert.match(source, /sidebar-wordmark[\s\S]*src="\/current-icon\.svg"/);
  assert.doesNotMatch(source, /workspace-header|AI agent engineering|Long-running agent context|Concept 2 of 5/);
  assert.match(source, /aria-pressed=\{notebookOpen\}/);
  assert.match(source, /notebook-panel \$\{notebookOpen \? "open".*aria-hidden=\{!notebookOpen\}/s);
  assert.match(source, /className="mode-stage"/);
  assert.match(source, /transitionToMode\("recall"\).*transitionToMode\("apply"\).*transitionToMode\("reflect"\)/s);
  assert.doesNotMatch(source, /startViewTransition|flushSync|transitionPhase|modeDirection/);
  assert.doesNotMatch(source, /RightTab|rightTab|sources-pane|notebook-tabs|notebook-heading|PanelLeftClose|className="close-notebook"/);
  assert.match(styles, /--background:.*--foreground:.*--primary:.*--ring:.*--radius:/s);
  assert.match(styles, /--primary:\s*211 90% 58%/);
  assert.doesNotMatch(styles, /16,163,127|45,212,191|--primary:\s*(?:160|174)/);
  assert.match(styles, /:focus-visible.*outline: 2px solid hsl\(var\(--ring\)\)/s);
  assert.match(styles, /\.mode-switcher[^}]*border-radius:\s*999px/s);
  assert.match(styles, /\.mode-switcher::before[^}]*transition:\s*transform/s);
  assert.match(styles, /\.lesson-toolbar[^}]*background:\s*hsl\(var\(--background\) \/ \.58\)[^}]*backdrop-filter:\s*blur\(18px\) saturate\(140%\)/s);
  assert.match(styles, /\.lesson-scroll[^}]*inset:\s*0[^}]*padding-top:\s*54px/s);
  assert.match(styles, /\.lesson-toolbar[^}]*border-bottom:\s*0/s);
  assert.match(styles, /\.module-header[^}]*margin-bottom:\s*32px[^}]*padding-bottom:\s*0[^}]*border-bottom:\s*0/s);
  assert.match(styles, /\.reading-section[^}]*padding:\s*0[^}]*border-bottom:\s*0/s);
  assert.match(styles, /\.sidebar-source-item[^}]*border-top:\s*0/s);
  assert.match(styles, /\.notes-pane textarea[^}]*border-top:\s*0/s);
  assert.match(styles, /\.session-summary[^}]*gap:\s*6px[^}]*background:\s*transparent/s);
  assert.match(styles, /\.sidebar-brand[^}]*border-bottom:\s*0/s);
  assert.match(styles, /@font-face[^}]*font-family:\s*"OpenAI Sans"[^}]*OpenAISans-Semibold\.woff2[^}]*font-weight:\s*600/s);
  assert.match(styles, /\.sidebar-brand[^}]*color:\s*var\(--text\)[^}]*font-family:\s*"OpenAI Sans"[^}]*font-size:\s*20px[^}]*font-weight:\s*600/s);
  assert.match(styles, /\.sidebar-wordmark[^}]*gap:\s*8px/s);
  assert.match(styles, /\.sidebar-wordmark img[^}]*width:\s*20px[^}]*height:\s*20px/s);
  assert.match(styles, /\.reading-section h2[^}]*font-size:\s*17px/s);
  assert.match(styles, /\.reading-section > p[^}]*font-size:\s*14px[^}]*line-height:\s*1\.7/s);
  assert.match(styles, /\.source-excerpt \+ \.reading-section[^}]*margin-top:\s*32px/s);
  assert.match(styles, /\.recall-input[^}]*margin-top:\s*0/s);
  assert.match(styles, /\.sidebar-source-item small[^}]*font-size:\s*11px/s);
  assert.match(styles, /\.diagram-stage[^}]*border-radius:\s*8px/s);
  assert.match(styles, /\.diagram-stage[^}]*box-shadow:\s*inset 0 0 0 1px hsl\(var\(--foreground\) \/ \.07\)/s);
  assert.match(styles, /\.diagram-stage strong[^}]*border-radius:\s*6px/s);
  assert.match(styles, /\.diagram-stage\.result[^}]*background:\s*#0d0d0d/s);
  assert.doesNotMatch(styles, /\.diagram-stage\.result[^}]*var\(--primary\)/s);
  assert.match(styles, /\.diagram-stage\.result strong:first-of-type[^}]*background:\s*#2b2b2b[^}]*box-shadow:\s*none/s);
  assert.match(styles, /\.source-excerpt[^}]*border-radius:\s*4px/s);
  assert.match(styles, /\.source-excerpt[^}]*box-shadow:\s*inset 0 0 0 1px hsl\(var\(--foreground\) \/ \.07\)/s);
  assert.match(styles, /\.comparison-row > div[^}]*box-shadow:\s*inset 0 0 0 1px hsl\(var\(--foreground\) \/ \.07\)/s);
  assert.match(styles, /\.code-options button[^}]*border-radius:\s*4px/s);
  assert.doesNotMatch(styles, /\.(?:diagram-stage|source-excerpt|evaluation-result|support-module|code-feedback|scheduled-state)[^}]*border-left/s);
  assert.doesNotMatch(styles, /view-transition|mode-enter-(?:forward|backward)|\.mode-stage[^}]*transform/);
  assert.match(styles, /\.continue-button[^}]*background:\s*#f4f4f4/s);
  assert.match(styles, /\.concept-path::before[^}]*left:\s*17px/s);
  assert.doesNotMatch(styles, /text-transform:\s*uppercase/);
});

test("connects the lesson shell to a functional learning map", async () => {
  const workspace = await readFile(new URL("../app/current-workspace.tsx", import.meta.url), "utf8");
  const map = await readFile(new URL("../app/learning-map.tsx", import.meta.url), "utf8");
  const createPath = await readFile(new URL("../app/create-path-dialog.tsx", import.meta.url), "utf8");
  const runtime = await readFile(new URL("../lib/learning-runtime.ts", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(workspace, /track-title[\s\S]*onClick=\{openLearningMap\}/);
  assert.match(workspace, /setWorkspaceView\("map"\)/);
  assert.match(workspace, /<LearningMap[\s\S]*paths=\{paths\}[\s\S]*queue=\{queue\}[\s\S]*onOpenLesson=\{openLesson\}/);
  assert.match(workspace, /onStartReview=\{startReview\}/);
  assert.match(workspace, /onApplyResearchUpdate=\{applyResearchUpdate\}/);
  assert.match(workspace, /setResearchUpdateApplied\(true\)/);
  assert.match(workspace, /const finishReview = \(\) =>/);
  assert.match(workspace, /scheduleReview\(existingReview\.memory, quality\)/);
  assert.match(workspace, /learnerProfile=\{learnerProfile\}/);
  assert.match(workspace, /activeSources\.length \? <div className="sidebar-bottom">/);
  assert.match(workspace, /workspaceView === "map" \? "map-view"/);
  assert.match(workspace, /className="concept-row"[\s\S]*onClick=\{\(\) => openLesson\(activePath\.id, index\)\}/);
  assert.match(workspace, /<GenericReadModule concept=\{activeConcept\}/);
  assert.match(workspace, /<GenericApplyModule[\s\S]*concept=\{activeConcept\}/);
  assert.match(workspace, /activeSources\.map\(\(source\)/);
  assert.match(workspace, /setProgress[\s\S]*completedConceptIndexes[\s\S]*setReviews/s);
  assert.match(workspace, /nextIncompleteConcept\(activePath/);
  assert.match(workspace, /current-learning-runtime-v1/);
  assert.match(workspace, /setQueue\(\(current\) => current\.includes\(pathId\)/);
  assert.match(map, /<ReactFlow[\s\S]*nodes=\{nodes\}[\s\S]*edges=\{edges\}/);
  assert.match(map, /role="tablist" aria-label="Learning map view"/);
  assert.match(map, /const switchMapMode = \(nextMode: MapMode\) =>/);
  assert.match(map, /map-transition-\$\{mapTransitionDirection\}/);
  assert.match(map, /type MapMode = "map" \| "list" \| "updates" \| "notes"/);
  assert.match(map, /aria-selected=\{mapMode === "updates"\}[\s\S]*Updates/);
  assert.match(map, /className="agent-updates-view map-view-enter"/);
  assert.match(map, /className="notes-index-view map-view-enter"/);
  assert.match(map, /aria-label="Search notes"/);
  assert.match(map, /openUpdatedPath\("long-running", 1\)/);
  assert.match(map, /setProposalStatus\("applied"\)/);
  assert.match(map, /onApplyResearchUpdate\(\)/);
  assert.match(map, /setSuggestionStatus\("added"\)/);
  assert.match(map, /Set as next/);
  assert.match(map, /Remove from queue/);
  assert.match(map, /New path/);
  assert.match(map, /<CreatePathDialog/);
  assert.doesNotMatch(map, /map-return-button|Continue lesson/);
  assert.doesNotMatch(map, /const \[customPaths|const \[plannedPathId/);
  assert.match(map, /mapBodyRef\.current\?\.scrollTo\(\{ top: 0 \}\)/);
  assert.match(map, /setSelectedConceptIndex\(index\)/);
  assert.match(map, /aria-pressed=\{inspectedConceptIndex === index\}/);
  assert.match(map, /onOpenLesson\(selectedPath\.id, inspectedConceptIndex\)/);
  assert.match(map, /inspectedConceptState === "current" && selectedPathIsActive \? "Continue" : "Start"/);
  assert.match(map, /className="review-queue"[\s\S]*onStartReview\(review\)/);
  const researchRail = map.match(/<aside className="research-rail map-rail-enter">[\s\S]*?<\/aside>/)?.[0] ?? "";
  assert.match(researchRail, /Review queue/);
  assert.doesNotMatch(researchRail, /Agent updates|agent-update-row|research-activity/);
  assert.match(runtime, /export const defaultReviews/);
  assert.match(runtime, /export function nextIncompleteConcept/);
  assert.match(runtime, /export function pathWithProgress/);
  assert.match(runtime, /export type LearnerProfile/);
  assert.match(createPath, /submittedLinks\.forEach\(\(link\) => form\.append\("links", link\)\)/);
  assert.doesNotMatch(map, /Checking official sources|Running now|3 agents|Research active|id: "concept-/);
  assert.match(styles, /\.current-app\.map-view \.course-sidebar[^}]*display:\s*none/s);
  assert.match(styles, /\.concept-row[^}]*cursor:\s*pointer/s);
  assert.match(styles, /\.learning-map-shell[^}]*grid-template-columns:\s*minmax\(0, 1fr\) var\(--map-rail\)/s);
  assert.match(styles, /\.map-toolbar[^}]*grid-column:\s*1[^}]*grid-row:\s*1/s);
  assert.match(styles, /\.research-rail[^}]*grid-column:\s*2[^}]*grid-row:\s*1 \/ span 2/s);
  assert.match(styles, /\.map-view-switcher[^}]*grid-template-columns:\s*repeat\(4,/s);
  assert.match(styles, /\.map-view-switcher::before[^}]*transition:\s*transform \.36s cubic-bezier\(\.22, 1, \.36, 1\)/s);
  assert.match(styles, /@keyframes map-view-forward-in/);
  assert.match(styles, /\.agent-updates-view[^}]*width:\s*min\(760px,/s);
  assert.match(styles, /\.learning-graph-node[^}]*border-radius:\s*8px/s);
  assert.match(styles, /\.review-queue-item[^}]*cursor:\s*pointer/s);
  assert.match(styles, /@media \(max-width:\s*720px\)[\s\S]*\.learning-map-body[^}]*display:\s*block[^}]*overflow-y:\s*auto/s);
});

test("generates a source-derived learning path without an API key", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-path-api`);
  const { default: worker } = await import(workerUrl.href);
  const form = new FormData();
  form.set("subject", "Urban water systems");
  form.set("goal", "Map the technical decisions involved in planning resilient city infrastructure.");
  form.append("files", new File([
    "# Get started\n# Suggested\n# Search the API docs\n# Core concepts\n# Pressure zones\nBalance elevation and delivery pressure across a distribution network.\n\n# Demand forecasting\nEstimate peak and seasonal water use.\n\n# Storage and redundancy\n",
  ], "water-notes.md", { type: "text/markdown" }));

  const response = await worker.fetch(
    new Request("http://localhost/api/paths/generate", { method: "POST", body: form }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  const path = await response.json();
  assert.equal(path.mode, "demo");
  assert.equal(path.title, "Urban water systems");
  assert.ok(path.concepts.length >= 5);
  assert.ok(path.concepts.some((concept) => /Pressure zones/i.test(concept.title)));
  assert.ok(path.concepts.every((concept) => !/^(?:Get started|Suggested|Search the API docs|Core concepts)$/i.test(concept.title)));
  assert.ok(path.concepts.every((concept) => concept.objective.length > 10));
  assert.ok(path.concepts.some((concept) => concept.sourceIds?.includes("file-0-water-notes.md")));
  assert.ok(path.concepts.some((concept) => concept.sourceNote?.length > 20));
});

test("rejects private learning-path source URLs", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-private-path-source`);
  const { default: worker } = await import(workerUrl.href);
  const form = new FormData();
  form.set("subject", "Network architecture");
  form.set("goal", "Understand how service boundaries affect reliability and deployment decisions.");
  form.append("links", "https://127.0.0.1/internal-notes");

  const response = await worker.fetch(
    new Request("http://localhost/api/paths/generate", { method: "POST", body: form }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /public HTTPS source/i);
});

test("keeps source-free fallback paths specific and progressive", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-fallback-path-quality`);
  const { default: worker } = await import(workerUrl.href);
  const form = new FormData();
  form.set("subject", "Distributed systems");
  form.set("goal", "Understand consistency, replication, and failure recovery well enough to evaluate a basic architecture.");

  const response = await worker.fetch(
    new Request("http://localhost/api/paths/generate", { method: "POST", body: form }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  const path = await response.json();
  assert.equal(path.concepts.length, 6);
  assert.ok(path.concepts.some((concept) => concept.title === "Replication and consistency"));
  assert.equal(path.concepts.at(-1).title, "Distributed systems in practice");
  assert.ok(path.concepts.every((concept) => !/\bwell\b/i.test(concept.title)));
  assert.ok(path.concepts.every((concept) => !/^Build an accurate working understanding/i.test(concept.objective)));
  assert.ok(path.concepts.every((concept) => concept.summary && concept.checkpoints?.length >= 2));
});

test("returns a deterministic evaluation when no API key is configured", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-api`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/api/coach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        answer: "Crossing the configured token threshold creates an opaque compaction item that preserves key state and reasoning. With previous_response_id, the next request sends only the new user message.",
      }),
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  const evaluation = await response.json();
  assert.ok(evaluation.score >= 75);
  assert.equal(evaluation.mode, "demo");
});

test("identifies the missing link in an incomplete recall answer", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-adaptive-api`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/api/coach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answer: "Compaction starts when the token threshold is crossed." }),
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  const evaluation = await response.json();
  assert.ok(evaluation.score < 75);
  assert.match(evaluation.misconception, /opaque item|next chained request/i);
  assert.equal(evaluation.mode, "demo");
});

test("evaluates recall against a non-compaction concept rubric", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-generic-coach`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/api/coach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        concept: "Trace grading",
        objective: "Grade the decisions and tool use inside an agent trace.",
        checkpoints: ["Decision points", "Tool selection", "Intermediate state"],
        answer: "Trace grading checks decision points, tool selection, and intermediate state so a final success does not hide a poor agent decision.",
      }),
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  const evaluation = await response.json();
  assert.ok(evaluation.score >= 75);
  assert.equal(evaluation.mode, "demo");
});
