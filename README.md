# Current

Current is a living learning system for fast-changing fields. It watches trusted sources, detects when a learner's knowledge is stale, explains the change, turns it into active recall and hands-on practice, and schedules the next review.

The Build Week MVP follows one complete loop:

1. Detect that saved model-selection knowledge is outdated.
2. Show the old claim beside the current, cited claim.
3. Teach the difference in a short reading.
4. Test recognition and open recall before showing feedback.
5. Adapt into a hands-on configuration task.
6. Update concept mastery and schedule a spaced review.

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

The seeded workspace follows **OpenAI API** and starts with a stale note recommending GPT-5.5. From **Today**:

1. Open **GPT-5.6 Sol is now the default frontier model**.
2. Read the source-backed before/after patch and take a note.
3. Complete the multiple-choice check.
4. Explain the alias-versus-explicit-ID distinction in your own words.
5. Patch the model configuration in hands-on mode.
6. Show the mastery increase, scheduled review, and agent trail.

The **Knowledge** and **Review queue** views make the persistent learning state visible outside the session.

## GPT-5.6 Sol

The live evaluator is implemented in `app/api/coach/route.ts` with the Responses API:

- Model: `gpt-5.6-sol`
- Reasoning effort: `high`
- Structured output: strict JSON schema
- Task: grade free-form recall against a narrow, source-backed rubric and identify a misconception

When `OPENAI_API_KEY` is absent or a live call fails, the same endpoint returns a deterministic rubric-based evaluation. This keeps the three-minute demo reproducible while preserving the real GPT-5.6 integration path.

The seeded curriculum patch cites the official [GPT-5.6 Sol model guide](https://developers.openai.com/api/docs/models/gpt-5.6-sol).

## Codex build story

Current was designed and implemented in one continuous Codex task using GPT-5.6 Sol with high reasoning effort. Codex helped:

- pressure-test the crowded AI tutor market and select the curriculum-change detector wedge;
- turn the learning-science thesis into a modular, non-chat product flow;
- scaffold and implement the responsive application and API route;
- build the spaced-review calculation and deterministic demo path;
- generate sample curriculum data, interaction states, tests, metadata, and documentation;
- run build, lint, rendered-output, and endpoint verification.

The product decisions and the full architecture discussion are preserved in [`brainstorm.md`](./brainstorm.md). Build Week requirements are captured in [`details.md`](./details.md).

## Architecture

- `app/current-workspace.tsx`: cockpit, session state machine, knowledge graph, review queue, and agent trail
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
