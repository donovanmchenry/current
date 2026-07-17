<p align="center">
  <img src="./public/current-icon.png" width="76" alt="Current logo" />
</p>

<h1 align="center">Current</h1>

<p align="center"><strong>Your field changed this morning. Your course did not.</strong></p>

<p align="center">
  <a href="https://current-learning-lab.vanzm.chatgpt.site">Open Current</a> ·
  <a href="./DEMO_SCRIPT.md">Demo script</a> ·
  <a href="./ROADMAP.md">Roadmap</a>
</p>

Current turns papers, documentation, and links into a learning system that can keep up with the subject it teaches.

Most AI education products optimize for getting an answer. Current optimizes for building a mental model. It makes the learner read the evidence, retrieve the idea without the source, use it in context, and reflect on where it belongs. When the learner misses, Current changes the next activity and remembers the exact gap. When a source changes, Current proposes a cited curriculum patch instead of silently rewriting the course.

This is not a chat wrapper. It is a working learning loop.

## The bet

We now have effectively infinite explanations. The scarce resource is durable understanding.

Chat is excellent at removing friction, including the productive friction that makes learning stick. Static courses have the opposite problem: they preserve structure, but decay as the field changes. Current sits between them.

```text
your sources -> learning path -> Read -> Recall -> Apply -> Reflect
                    ^                         |                |
                    |                  adaptive support        v
              research updates <--------- concept memory <- review
```

The learner stays in control. Sources remain visible. Model decisions are labeled. Research updates require approval. Progress means demonstrating the idea, not scrolling past it.

## What works today

- **Source-grounded path creation.** Describe a subject and goal, then attach public links, PDFs, Markdown, text, CSV, or JSON.
- **Complete generated lessons.** Every concept becomes a Read, Recall, Apply, Reflect session with a rubric and source references.
- **Adaptive recall.** Weak answers preserve the specific missing relationship and unlock a visual sequence or concrete example before retrying.
- **Concept-level memory.** Current remembers misconceptions, successful support modes, attempts, progress, notes, and reflections by concept.
- **Spaced review.** Clean recall earns a longer interval; concepts that needed help return sooner.
- **Living curricula.** A research agent compares stored and current source evidence, shows the diff, identifies affected concepts, and waits for approval.
- **Reopenable sources.** Uploaded artifacts persist locally and can be viewed or downloaded from the workspace.
- **A real reset button.** Judges can restore the seeded state in one click. Demo reliability is a product feature too.

## GPT-5.6 is a system, not a sticker

Using the largest model for every request would be easy. It would also be slow, expensive, and unserious.

Current routes work by task shape. The policy lives in [`lib/model-routing.ts`](./lib/model-routing.ts), and every live response returns its model ID for visible provenance.

| Workload | Route | Design decision |
| --- | --- | --- |
| Learning-path architecture | `gpt-5.6-sol`, high | Quality-first reasoning for prerequisites, sequence, objectives, and source coverage. |
| Research-source updates | `gpt-5.6-sol`, high | Curriculum changes deserve the strongest judgment and still require human approval. |
| Lesson authoring | `gpt-5.6-terra`, medium | Strong generation with a better cost profile for one lesson per concept. |
| Recall and application coaching | `gpt-5.6-luna`, low | Fast structured evaluation for the highest-volume interaction in the product. |

The routing follows OpenAI's [GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/latest-model): Sol for flagship capability, Terra for balanced intelligence and cost, and Luna for efficient high-volume work. All four routes use the Responses API and strict structured outputs.

No API key? Current falls back to deterministic, task-specific evaluators and labels the result accordingly. The live integration is real; the demo is still reproducible.

## The 90-second proof

The seeded path teaches **context compaction for long-running agents** from OpenAI's official [compaction](https://developers.openai.com/api/docs/guides/compaction) and [conversation state](https://developers.openai.com/api/docs/guides/conversation-state) documentation.

1. Open **AI agent engineering -> Long-running agent context -> Compaction**.
2. Read the source-backed mental model and save the useful claim.
3. Submit an incomplete recall answer. Current records the missing link and offers another representation.
4. Retry successfully, then choose the documented `context_management` configuration.
5. Reflect, schedule review, and return to the Learning Map.
6. Open **Updates** to inspect a source delta, apply the curriculum patch, and create a new review.

Choose **Reset demo** from the Learning Map at any time to clear custom paths, notes, reviews, source artifacts, and learned preferences.

## Architecture

```text
Next.js 16 + React 19
├── learning workspace      modular lesson state and adaptive supports
├── learning map            paths, concept memory, reviews, and updates
├── Responses API routes    planning, authoring, coaching, and research
├── local-first runtime     progress, notes, source artifacts, and memory
└── OpenAI Sites            production deployment and runtime secrets
```

The important boundaries are deliberately small:

- [`app/current-workspace.tsx`](./app/current-workspace.tsx) owns the learning loop.
- [`app/learning-map.tsx`](./app/learning-map.tsx) owns navigation, review, and research updates.
- [`app/api`](./app/api) contains the four GPT-5.6 workflows and deterministic fallbacks.
- [`lib/model-routing.ts`](./lib/model-routing.ts) is the model policy, not four scattered strings.
- [`lib/learning-runtime.ts`](./lib/learning-runtime.ts) stores progress and misconception memory.
- [`lib/spaced-review.ts`](./lib/spaced-review.ts) schedules the next retrieval attempt.
- [`lib/source-artifacts.ts`](./lib/source-artifacts.ts) preserves uploaded source files locally.
- [`tests`](./tests) verifies rendered product behavior, API fallbacks, source updates, memory, and scheduling.

## Built with Codex

Current was designed and shipped in one continuous Codex task using GPT-5.6 Sol at high reasoning effort.

The useful part was not raw code generation. Codex stayed inside the product loop:

- challenged the first broad "AI tutor" framing and found the sharper lifelong-learning wedge;
- helped kill the first generic dashboard build instead of polishing the wrong product;
- translated the learning-science thesis into a modular, non-chat interaction model;
- implemented the UI, four API workflows, persistence, research updates, source handling, reset path, and tests;
- used browser feedback to repeatedly remove dead controls, visual noise, broken transitions, and incomplete flows;
- verified local and hosted GPT-5.6 behavior before each milestone shipped.

The full reasoning trail is preserved in [`brainstorm.md`](./brainstorm.md). That history includes the bad ideas and rebuilds, not just the clean ending.

## Learning science, applied

Current is evidence-informed software, not a claim that an MVP has already proven learning outcomes. Each cited method maps to a shipped interaction:

| Finding | Product consequence |
| --- | --- |
| [Retrieval practice](https://doi.org/10.1111/j.1467-9280.2006.01693.x) improves delayed retention over repeated study. | Recall hides the source and requires reconstruction. |
| [Corrective feedback](https://doi.org/10.1037/1076-898X.13.4.273) improves later recall. | Feedback names the missing relationship and supports a retry. |
| [Spaced practice](https://doi.org/10.1037/0033-2909.132.3.354) produces robust retention benefits. | Performance and retries determine the next review interval. |
| [Interleaving](https://doi.org/10.1007/s11251-007-9015-8) can improve delayed discrimination and performance. | The review queue can mix due concepts across paths. |
| [Self-explanation](https://doi.org/10.1207/s15516709cog1302_1) is associated with stronger understanding. | Reflect connects the concept to the learner's own work. |
| [Worked examples](https://doi.org/10.1207/s1532690xci0201_3) can support early schema acquisition. | A stuck learner can switch to a concrete example or visual sequence. |
| [Mastery learning](https://doi.org/10.3102/00346543060002265) shows positive achievement effects with real time tradeoffs. | Recall gates Apply; Apply gates Reflect. Exposure is not completion. |
| [Personal relevance](https://doi.org/10.1126/science.1177067) can improve interest and performance. | Paths begin with the learner's subject, goal, and selected sources. |

Current does **not** label people as visual, auditory, or kinesthetic learners. The evidence does not support matching instruction to fixed learning-style categories ([Pashler et al.](https://doi.org/10.1111/j.1539-6053.2009.01038.x)). Supports are strategies selected from task fit, observed outcomes, and learner choice.

## Why education

AI should make it easier for students to go deeper into what they care about, not just finish the worksheet faster.

The individual learning workspace is the wedge. The longer-term product is **Current for Education**: teacher-approved living curricula, shared learning objectives with interest-aware examples, group misconception signals, and research updates that educators can inspect before they reach a class. The teacher remains the decision-maker; Current makes differentiation and curriculum maintenance tractable.

That roadmap is intentionally outside the Build Week MVP. The current submission proves the smaller prerequisite: one source-grounded learning loop that adapts, persists, and stays current end to end.

## Run locally

Requires Node.js 22.13 or newer.

```bash
git clone https://github.com/donovanmchenry/current.git
cd current
npm install
cp .env.example .env.local
npm run dev
```

Current runs without credentials using deterministic fallbacks. For live GPT-5.6 routing, add:

```bash
OPENAI_API_KEY=your_key_here
```

Then open the local URL printed by the development server. The seeded AI agent engineering path is the sample data; no setup flow is required.

## Verify

```bash
npm run lint
npm test
```

The current suite contains 23 passing tests. `npm test` builds the production application before running endpoint, scheduler, persistence, and rendered-behavior checks.

## Status

Build Week MVP: complete. Hosted product: [current-learning-lab.vanzm.chatgpt.site](https://current-learning-lab.vanzm.chatgpt.site).

Next: profiles and learner setup, deeper interest-aware adaptation, durable cloud sync, and the educator management layer. See [`ROADMAP.md`](./ROADMAP.md).

## License

MIT. See [`LICENSE`](./LICENSE).
