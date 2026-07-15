import type { LearningPath, LearningSource } from "./learning-path";

export const officialSources: Record<string, LearningSource> = {
  compaction: {
    id: "compaction",
    kind: "link",
    title: "Compaction",
    detail: "Server-side and standalone compaction",
    href: "https://developers.openai.com/api/docs/guides/compaction",
  },
  conversation: {
    id: "conversation-state",
    kind: "link",
    title: "Conversation state",
    detail: "Responses, conversations, and chaining",
    href: "https://developers.openai.com/api/docs/guides/conversation-state",
  },
  responses: {
    id: "responses-api",
    kind: "link",
    title: "Responses API",
    detail: "Request, response, tools, and state primitives",
    href: "https://developers.openai.com/api/docs/guides/migrate-to-responses",
  },
  evals: {
    id: "agent-evals",
    kind: "link",
    title: "Agent evaluations",
    detail: "Evaluation design and trace grading",
    href: "https://developers.openai.com/api/docs/guides/evals",
  },
};

export const basePaths: LearningPath[] = [
  {
    id: "long-running",
    title: "Long-running agents",
    description: "Context, compaction, chaining, and recovery for agents that work across many turns.",
    progress: 20,
    concepts: [
      {
        title: "Conversation state",
        objective: "Explain which state belongs to a response, a conversation, and your application.",
        summary: "Long-running work depends on knowing where continuity lives. Responses can be chained directly, attached to a durable conversation, or carried forward by your application.",
        checkpoints: ["Response objects and output items", "Durable conversation identifiers", "Application-owned state boundaries"],
      },
      {
        title: "Compaction",
        objective: "Explain when compaction runs and what its opaque item preserves.",
        summary: "Compaction reduces accumulated context while preserving the state and reasoning needed to continue later turns.",
        checkpoints: ["Rendered-token thresholds", "Opaque compact items", "The next request after compaction"],
      },
      {
        title: "Stateless chaining",
        objective: "Choose what the next request must contain when the application does not keep a conversation object.",
        summary: "Stateless chaining keeps continuity explicit. The application either appends prior response output to the next input or carries a previous response ID forward.",
        checkpoints: ["Input-array chaining", "Using previous_response_id", "Avoiding duplicate or pruned state"],
      },
      {
        title: "Recovery patterns",
        objective: "Recover an interrupted agent without replaying unnecessary context or duplicating work.",
        summary: "Recovery starts from the last trustworthy state boundary, then resumes without repeating completed tool actions.",
        checkpoints: ["Durable checkpoints", "Idempotent tool execution", "Resuming from the last valid response"],
      },
      {
        title: "Implementation check",
        objective: "Configure, run, and verify compaction inside a working agent loop.",
        summary: "The final concept combines context policy, chaining, and recovery into one implementation that can be inspected and tested.",
        checkpoints: ["Compaction configuration", "Request-chain verification", "Failure and recovery test cases"],
      },
    ],
    next: "Compaction",
    status: "In progress",
    sources: [officialSources.compaction, officialSources.conversation],
  },
  {
    id: "responses-api",
    title: "Responses API foundations",
    description: "The request, response, tool, and state primitives behind OpenAI agent systems.",
    progress: 75,
    concepts: [
      { title: "Response objects", objective: "Read the core state carried by a response object.", summary: "Response objects hold model output, tool requests, and the identifiers used to continue work.", checkpoints: ["Output item types", "Response identifiers", "Usage and status fields"] },
      { title: "Tool calls", objective: "Connect model tool requests to application-side execution.", summary: "Tool calling is a controlled handoff between model intent and application execution.", checkpoints: ["Tool schemas", "Application execution", "Returning tool output"] },
      { title: "Structured outputs", objective: "Constrain model output to a validated schema.", summary: "Structured outputs turn an expected response shape into a contract the application can validate.", checkpoints: ["JSON schemas", "Strict validation", "Failure handling"] },
      { title: "Error recovery", objective: "Handle failed requests and tool results without losing state.", summary: "Reliable response flows distinguish retryable failures from terminal failures while preserving usable state.", checkpoints: ["Retry boundaries", "Tool-result failures", "State-preserving recovery"] },
    ],
    next: "Error recovery",
    status: "In progress",
    sources: [officialSources.responses],
  },
  {
    id: "agent-evals",
    title: "Agent evaluations",
    description: "Build repeatable evaluation sets for reasoning traces, tools, and multi-step outcomes.",
    progress: 17,
    concepts: [
      { title: "Eval design", objective: "Define an evaluation around a concrete agent behavior.", summary: "Useful evaluations begin with an observable behavior and a clear success condition.", checkpoints: ["Behavior under test", "Representative cases", "Measurable outcomes"] },
      { title: "Trace grading", objective: "Grade the decisions and tool use inside an agent trace.", summary: "Trace grading examines whether an agent took sound intermediate actions, not only whether the final answer looked correct.", checkpoints: ["Decision points", "Tool selection", "Intermediate state"] },
      { title: "Regression sets", objective: "Turn representative failures into repeatable tests.", summary: "Regression sets preserve failures as durable evidence that later changes must satisfy.", checkpoints: ["Failure capture", "Stable fixtures", "Before-and-after comparison"] },
      { title: "Failure taxonomies", objective: "Classify failures precisely enough to guide fixes.", summary: "A useful taxonomy separates symptoms from the underlying decision or system failure.", checkpoints: ["Failure categories", "Root causes", "Actionable labels"] },
      { title: "Human review", objective: "Place human judgment where automated grading is insufficient.", summary: "Human review belongs where quality depends on context, tradeoffs, or subjective judgment.", checkpoints: ["Escalation criteria", "Reviewer context", "Agreement checks"] },
      { title: "Release gates", objective: "Use evaluation results to make a release decision.", summary: "Release gates convert evaluation evidence into explicit go, hold, or rollback criteria.", checkpoints: ["Threshold selection", "Risk weighting", "Release decisions"] },
    ],
    next: "Trace grading",
    status: "In progress",
    sources: [officialSources.evals],
  },
];

export const suggestedPath: LearningPath = {
  id: "agent-reliability",
  title: "Agent reliability",
  description: "Turn tool failures, recovery patterns, and evaluations into resilient production behavior.",
  progress: 0,
  concepts: [
    { title: "Tool failure modes", objective: "Distinguish retryable tool failures from terminal ones.", summary: "Reliable agents need a failure model before they need a retry loop.", checkpoints: ["Retryable failures", "Terminal failures", "Ambiguous outcomes"] },
    { title: "Retry policy", objective: "Choose bounded retry behavior for common agent failures.", summary: "Retry policies balance recovery against cost, latency, and repeated side effects.", checkpoints: ["Attempt limits", "Backoff", "Idempotency"] },
    { title: "Human handoff", objective: "Escalate an agent task with the context a person needs.", summary: "A useful handoff preserves the goal, completed work, evidence, and the exact decision still needed.", checkpoints: ["Handoff trigger", "State summary", "Requested decision"] },
    { title: "Reliability budgets", objective: "Set measurable reliability targets for an agent workflow.", summary: "Reliability budgets turn acceptable failure rates and recovery times into operating constraints.", checkpoints: ["Success rate", "Recovery time", "Cost limits"] },
  ],
  next: "Tool failure modes",
  status: "Ready to begin",
};
