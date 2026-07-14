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

## GPT-5.6 Sol

The live recall evaluator is implemented in `app/api/coach/route.ts` with the Responses API:

- Model: `gpt-5.6-sol`
- Reasoning effort: `high`
- Structured output: strict JSON schema
- Task: grade free-form recall of compaction against a narrow, source-backed rubric and identify the missing link

When `OPENAI_API_KEY` is absent or a live call fails, the same endpoint returns a deterministic rubric-based evaluation. This keeps the three-minute demo reproducible while preserving the real GPT-5.6 integration path.

The lesson cites the official [compaction](https://developers.openai.com/api/docs/guides/compaction) and [conversation state](https://developers.openai.com/api/docs/guides/conversation-state) guides.

## Codex build story

Current was designed and implemented in one continuous Codex task using GPT-5.6 Sol with high reasoning effort. Codex helped:

- pressure-test the crowded AI tutor market and select the lifelong-learning wedge;
- turn the learning-science thesis into a modular, non-chat workspace;
- rebuild the first version after critiquing its generic dashboard framing;
- implement a responsive ChatGPT-inspired dark workbench and API route;
- build the spaced-review calculation and deterministic demo path;
- generate the source-backed lesson, interaction states, tests, metadata, and documentation;
- run build, lint, rendered-output, and endpoint verification.

The product decisions and the full architecture discussion are preserved in [`brainstorm.md`](./brainstorm.md). Build Week requirements are captured in [`details.md`](./details.md).

## Architecture

- `app/current-workspace.tsx`: learning modes, adaptive supports, notebook, source panel, and session state
- `app/api/coach/route.ts`: GPT-5.6 Sol recall evaluation with deterministic fallback
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
