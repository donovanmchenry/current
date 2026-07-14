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
  assert.match(styles, /\.sidebar-brand[^}]*border-bottom:\s*0/s);
  assert.match(styles, /\.sidebar-brand[^}]*color:\s*var\(--text\)[^}]*font-family:\s*var\(--font-geist-sans\)[^}]*font-size:\s*20px/s);
  assert.match(styles, /\.diagram-stage[^}]*border-radius:\s*4px/s);
  assert.match(styles, /\.source-excerpt[^}]*border-radius:\s*4px/s);
  assert.match(styles, /\.code-options button[^}]*border-radius:\s*4px/s);
  assert.doesNotMatch(styles, /\.(?:diagram-stage|source-excerpt|evaluation-result|support-module|code-feedback|scheduled-state)[^}]*border-left/s);
  assert.doesNotMatch(styles, /view-transition|mode-enter-(?:forward|backward)|\.mode-stage[^}]*transform/);
  assert.match(styles, /\.continue-button[^}]*background:\s*#f4f4f4/s);
  assert.match(styles, /\.concept-path::before[^}]*left:\s*17px/s);
  assert.doesNotMatch(styles, /text-transform:\s*uppercase/);
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
