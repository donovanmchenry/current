# Current

Current is a learning workspace for fast-changing fields. It turns source-grounded material into a focused sequence of reading, recall, application, and reflection, then changes the next explanation when the learner gets stuck.

The Build Week MVP is a working study desk rather than a chat interface or analytics dashboard. Its first lesson follows one complete loop:

1. Read a source-grounded concept about context compaction for long-running agents.
2. Save the useful idea into a persistent notebook.
3. Reconstruct the concept from memory without the source visible.
4. Receive a focused evaluation of the missing conceptual link.
5. Switch to a visual sequence or concrete example when recall is weak.
6. Apply the concept to a real Responses API configuration.
7. Reflect on where the pattern belongs and schedule a review.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the local URL printed by the development server. The demo runs without an API key using a deterministic evaluator. To enable live answer evaluation, add an OpenAI API key to `.env.local`:

```bash
OPENAI_API_KEY=your_key_here
```

## Demo path

The seeded workspace follows **AI agent engineering** and opens directly on **Long-running agent context**:

1. Read **What compaction actually preserves** and add the source-backed note to the notebook.
2. Enter **Recall** and explain the trigger, preserved state, and next request.
3. Submit a deliberately incomplete answer to show the adaptive visual/example controls.
4. Reset, give a complete answer, and continue to **Apply**.
5. Choose the correct `context_management` configuration.
6. Enter **Reflect**, write where the pattern belongs, and schedule the next review.

The lesson remains modular and interactive throughout: concept path on the left, active work in the center, and notes or sources on the right.

To restore the seeded judging state, open the Learning Map and choose **Reset demo**. Current clears custom paths, local source artifacts, notes, reviews, and learned preferences, then returns to the Compaction lesson at Read.

## GPT-5.6 Sol

The live recall evaluator is implemented in `app/api/coach/route.ts` with the Responses API:

- Model: `gpt-5.6-sol`
- Reasoning effort: `high`
- Structured output: strict JSON schema
- Task: grade free-form recall of compaction against a narrow, source-backed rubric and identify the missing link

When `OPENAI_API_KEY` is absent or a live call fails, the same endpoint returns a deterministic rubric-based evaluation. This keeps the three-minute demo reproducible while preserving the real GPT-5.6 integration path.

Path previews, generated lessons, recall evaluations, and source-update proposals identify when GPT-5.6 Sol produced the result. Deterministic output is labeled as a demo fallback so the model-backed workflow remains inspectable during judging.

The lesson cites the official [compaction](https://developers.openai.com/api/docs/guides/compaction) and [conversation state](https://developers.openai.com/api/docs/guides/conversation-state) guides.

## Learning science

Current is an evidence-informed prototype, not a validated learning intervention. The research below motivates specific product decisions; measuring whether Current improves durable learning is a separate evaluation step.

| Method | Evidence | Current interaction |
| --- | --- | --- |
| Retrieval practice | [Roediger and Karpicke (2006)](https://doi.org/10.1111/j.1467-9280.2006.01693.x) found that retrieval testing improved delayed retention compared with repeated study. | Recall hides the source and asks the learner to reconstruct the concept in their own words. |
| Corrective feedback | [Butler, Karpicke, and Roediger (2007)](https://doi.org/10.1037/1076-898X.13.4.273) found that feedback containing the correct response improved later recall from multiple-choice tests. | The evaluator identifies the missing conceptual relationship and supports a retry instead of returning only a score. |
| Spaced practice | [Cepeda et al. (2006)](https://doi.org/10.1037/0033-2909.132.3.354) synthesized 317 experiments and found a robust spacing effect whose useful interval depends on the desired retention period. | Completing a lesson schedules a future review; concepts that required retries return sooner than clean first-pass recalls. |
| Interleaving | [Rohrer and Taylor (2007)](https://doi.org/10.1007/s11251-007-9015-8) found that shuffled mathematics practice improved delayed test performance. | The review queue can mix due concepts from different paths instead of keeping every session blocked by topic. |
| Self-explanation | [Chi et al. (1989)](https://doi.org/10.1207/s15516709cog1302_1) connected learners' spontaneous explanations of worked examples with stronger understanding. | Reflect asks the learner to explain where the idea belongs in their own work after applying it. |
| Worked examples | [Sweller and Cooper (1985)](https://doi.org/10.1207/s1532690xci0201_3) showed benefits from worked examples during early algebra schema acquisition. | A learner who struggles can switch from an abstract explanation to a concrete example or visual sequence before retrying. |
| Mastery before progression | [Kulik, Kulik, and Bangert-Drowns (1990)](https://doi.org/10.3102/00346543060002265) reported positive achievement effects across 108 controlled evaluations of mastery-learning programs, with tradeoffs including more time on task. | Apply unlocks after successful Recall, and Reflect unlocks after successful Apply; Current does not treat exposure as mastery. |
| Personal relevance | [Hulleman and Harackiewicz (2009)](https://doi.org/10.1126/science.1177067) found that connecting science material to students' lives increased interest and performance, especially for students with low success expectations. | New paths begin with the learner's subject, goal, and chosen sources. Deeper interest-based personalization remains on the roadmap. |

Current deliberately does not classify learners as visual, auditory, or kinesthetic types. [Pashler et al. (2008)](https://doi.org/10.1111/j.1539-6053.2009.01038.x) found inadequate evidence for matching instruction to fixed learning-style categories. Visual sequences, concrete examples, and other supports are selectable strategies that Current can adapt from observed outcomes and learner choice, not identity labels.

## Adaptive concept memory

Recall results are stored by concept rather than only as a global score. When an answer misses a relationship, Current preserves the evaluator's specific misconception, marks that concept as needing attention on the Learning Map, and shows the gap beside the next lesson action. A successful retry clears the gap and remembers whether a visual sequence or concrete example helped; answers that required retries receive a shorter spaced-review interval than clean first-pass recall.

Uploaded source files are retained in device-local browser storage after path generation. Original text material and PDFs can be reopened in Current through the source viewer and download action; extracted text remains available as a fallback if the browser artifact is lost. Removing a custom path also removes its stored file artifacts.

## Codex build story

Current was designed and implemented in one continuous Codex task using GPT-5.6 Sol with high reasoning effort. Codex helped:

- pressure-test the crowded AI tutor market and select the lifelong-learning wedge;
- turn the learning-science thesis into a modular, non-chat workspace;
- rebuild the first version after critiquing its generic dashboard framing;
- implement a responsive ChatGPT-inspired dark workbench and API route;
- build the spaced-review calculation and deterministic demo path;
- generate the source-backed lesson, interaction states, tests, metadata, and documentation;
- run build, lint, rendered-output, and endpoint verification.

The product decisions and the full architecture discussion are preserved in [`brainstorm.md`](./brainstorm.md). The phased product plan is tracked in [`ROADMAP.md`](./ROADMAP.md), Build Week requirements are captured in [`details.md`](./details.md), and the recording plan is in [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md).

## Architecture

- `app/current-workspace.tsx`: learning modes, adaptive supports, notebook, source panel, and session state
- `app/learning-map.tsx`: path navigation, concept memory, review queue, and research updates
- `app/api/coach/route.ts`: GPT-5.6 Sol recall evaluation with deterministic fallback
- `lib/learning-runtime.ts`: persisted path progress, misconception memory, and review quality
- `lib/source-artifacts.ts`: device-local storage for reopenable uploaded sources
- `lib/spaced-review.ts`: SM-2-inspired review scheduling
- `tests/`: rendered product, endpoint, and scheduler verification
- `.openai/hosting.json`: OpenAI Sites deployment configuration

## Verify

```bash
npm run build
npm run lint
npm test
```

## License

MIT. See [`LICENSE`](./LICENSE).
