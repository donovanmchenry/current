"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Code2,
  Command,
  ExternalLink,
  FileText,
  FolderOpen,
  Highlighter,
  History,
  Library,
  ListChecks,
  Menu,
  MoreHorizontal,
  NotebookPen,
  PanelLeftClose,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings2,
  Sparkles,
  Timer,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type Mode = "read" | "recall" | "apply" | "reflect";
type RightTab = "notes" | "sources";

type Evaluation = {
  score: number;
  verdict: string;
  feedback: string;
  misconception: string | null;
  nextPrompt: string;
  mode: "live" | "demo";
};

const sources = [
  {
    title: "Compaction",
    domain: "OpenAI API docs",
    detail: "Server-side and standalone compaction",
    href: "https://developers.openai.com/api/docs/guides/compaction",
  },
  {
    title: "Conversation state",
    domain: "OpenAI API docs",
    detail: "Responses, conversations, and chaining",
    href: "https://developers.openai.com/api/docs/guides/conversation-state",
  },
  {
    title: "GPT-5.6 Sol",
    domain: "OpenAI model docs",
    detail: "Context window and supported tools",
    href: "https://developers.openai.com/api/docs/models/gpt-5.6-sol",
  },
];

const concepts = [
  { label: "Conversation state", status: "done" },
  { label: "Compaction", status: "current" },
  { label: "Stateless chaining", status: "next" },
  { label: "Recovery patterns", status: "locked" },
  { label: "Implementation check", status: "locked" },
];

const modeItems: { id: Mode; label: string; icon: typeof BookOpen }[] = [
  { id: "read", label: "Read", icon: BookOpen },
  { id: "recall", label: "Recall", icon: Brain },
  { id: "apply", label: "Apply", icon: Code2 },
  { id: "reflect", label: "Reflect", icon: NotebookPen },
];

export function CurrentWorkspace() {
  const [mode, setMode] = useState<Mode>("read");
  const [rightTab, setRightTab] = useState<RightTab>("notes");
  const [notes, setNotes] = useState("");
  const [recallAnswer, setRecallAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [supportMode, setSupportMode] = useState<"none" | "visual" | "example">("none");
  const [codeChoice, setCodeChoice] = useState<number | null>(null);
  const [codeChecked, setCodeChecked] = useState(false);
  const [reflection, setReflection] = useState("");
  const [reviewScheduled, setReviewScheduled] = useState(false);
  const [highlighted, setHighlighted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(18 * 60 + 24);

  useEffect(() => {
    const saved = window.localStorage.getItem("current-notebook-v2");
    if (!saved) return;
    const frame = window.requestAnimationFrame(() => setNotes(saved));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("current-notebook-v2", notes);
  }, [notes]);

  useEffect(() => {
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const addExcerptToNotes = () => {
    const excerpt = "Compaction preserves key prior state in an opaque item while using fewer tokens.";
    setNotes((value) => value ? `${value}\n\n${excerpt}` : excerpt);
    setHighlighted(true);
    setRightTab("notes");
    setNotebookOpen(true);
  };

  const evaluateRecall = async () => {
    if (!recallAnswer.trim()) return;
    setIsEvaluating(true);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answer: recallAnswer, lesson: "compaction" }),
      });
      if (!response.ok) throw new Error("Evaluation failed");
      setEvaluation((await response.json()) as Evaluation);
    } catch {
      setEvaluation(localEvaluation(recallAnswer));
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetRecall = () => {
    setRecallAnswer("");
    setEvaluation(null);
    setSupportMode("none");
  };

  const checkCode = () => {
    if (codeChoice === null) return;
    setCodeChecked(true);
  };

  return (
    <div className={`current-app ${notebookOpen ? "with-notebook" : ""}`}>
      <header className="workspace-header">
        <div className="header-left">
          <button className="icon-action mobile-only" aria-label="Open course outline" onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
          <button className="wordmark" aria-label="Current home"><span className="wordmark-symbol"><Command size={15} /></span><span>Current</span></button>
          <span className="header-separator" />
          <button className="track-switcher">AI agent engineering <ChevronDown size={14} /></button>
        </div>
        <div className="header-center">
          <span className="lesson-name">Long-running agent context</span>
          <span className="save-state"><Check size={12} /> Saved</span>
        </div>
        <div className="header-right">
          <span className="focus-timer"><Timer size={14} /><strong>{minutes}:{seconds}</strong></span>
          <button className="icon-action" aria-label="Search"><Search size={17} /></button>
          <button className="icon-action" aria-label="More options"><MoreHorizontal size={18} /></button>
          <button className="user-avatar" aria-label="Profile">D</button>
        </div>
      </header>

      {sidebarOpen ? <button className="overlay" aria-label="Close course outline" onClick={() => setSidebarOpen(false)} /> : null}

      <aside className={`course-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-mobile-head"><span>Course outline</span><button className="icon-action" onClick={() => setSidebarOpen(false)} aria-label="Close course outline"><X size={17} /></button></div>
        <button className="new-track"><Plus size={16} /> New learning track</button>
        <nav className="utility-nav" aria-label="Workspace">
          <button><Search size={16} /> Search</button>
          <button><Library size={16} /> Library</button>
          <button><History size={16} /> Review</button>
        </nav>

        <div className="outline-heading">
          <span>Current track</span>
          <button aria-label="Track settings"><Settings2 size={15} /></button>
        </div>
        <div className="track-title">
          <span className="track-icon"><FolderOpen size={16} /></span>
          <div><strong>Long-running agents</strong><small>OpenAI API · 5 concepts</small></div>
        </div>
        <div className="track-progress"><span /></div>

        <ol className="concept-path">
          {concepts.map((concept, index) => (
            <li className={concept.status} key={concept.label}>
              <button disabled={concept.status === "locked"} onClick={() => concept.status !== "locked" && index === 1 && setMode("read")}>
                <span className="concept-state">{concept.status === "done" ? <Check size={11} /> : index + 1}</span>
                <span>{concept.label}</span>
                {concept.status === "current" ? <span className="now-label">Now</span> : null}
              </button>
            </li>
          ))}
        </ol>

        <div className="sidebar-bottom">
          <button onClick={() => { setRightTab("sources"); setNotebookOpen(true); }}><FileText size={15} /><span>Sources</span><small>3</small></button>
          <button><CircleHelp size={15} /><span>How this track adapts</span></button>
        </div>
      </aside>

      <main className="learning-canvas">
        <div className="lesson-toolbar">
          <button className="back-control"><ArrowLeft size={15} /><span>Concepts</span></button>
          <div className="mode-switcher" role="tablist" aria-label="Learning mode">
            {modeItems.map((item) => {
              const Icon = item.icon;
              const locked = item.id === "reflect" && !(codeChecked && codeChoice === 1);
              return (
                <button
                  role="tab"
                  aria-selected={mode === item.id}
                  disabled={locked}
                  className={mode === item.id ? "active" : ""}
                  onClick={() => setMode(item.id)}
                  key={item.id}
                >
                  <Icon size={14} />{item.label}
                </button>
              );
            })}
          </div>
          <button className="icon-action notebook-toggle" aria-label={notebookOpen ? "Close notebook" : "Open notebook"} onClick={() => setNotebookOpen((value) => !value)}><NotebookPen size={17} /></button>
        </div>

        <div className="lesson-scroll">
          {mode === "read" ? <ReadModule highlighted={highlighted} addToNotes={addExcerptToNotes} next={() => setMode("recall")} /> : null}
          {mode === "recall" ? (
            <RecallModule
              answer={recallAnswer}
              setAnswer={setRecallAnswer}
              evaluation={evaluation}
              evaluate={evaluateRecall}
              isEvaluating={isEvaluating}
              supportMode={supportMode}
              setSupportMode={setSupportMode}
              reset={resetRecall}
              next={() => setMode("apply")}
            />
          ) : null}
          {mode === "apply" ? (
            <ApplyModule
              choice={codeChoice}
              setChoice={(choice) => { setCodeChoice(choice); setCodeChecked(false); }}
              checked={codeChecked}
              check={checkCode}
              next={() => setMode("reflect")}
            />
          ) : null}
          {mode === "reflect" ? (
            <ReflectModule
              reflection={reflection}
              setReflection={setReflection}
              scheduled={reviewScheduled}
              schedule={() => setReviewScheduled(true)}
            />
          ) : null}
        </div>
      </main>

      <aside className={`notebook-panel ${notebookOpen ? "open" : ""}`}>
        <div className="notebook-tabs" role="tablist">
          <button role="tab" aria-selected={rightTab === "notes"} className={rightTab === "notes" ? "active" : ""} onClick={() => setRightTab("notes")}><NotebookPen size={14} /> Notes</button>
          <button role="tab" aria-selected={rightTab === "sources"} className={rightTab === "sources" ? "active" : ""} onClick={() => setRightTab("sources")}><FileText size={14} /> Sources <span>3</span></button>
          <button className="close-notebook" aria-label="Close notebook" onClick={() => setNotebookOpen(false)}><PanelLeftClose size={16} /></button>
        </div>

        {rightTab === "notes" ? (
          <div className="notes-pane">
            <div className="note-document-title">
              <div><span>Compaction</span><small>Private working note</small></div>
              <button aria-label="Note options"><MoreHorizontal size={17} /></button>
            </div>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={"Write while you learn…\n\nTry explaining the purpose of compaction without copying the source."}
              aria-label="Learning notes"
            />
            <div className="note-footer">
              <span>{notes.trim() ? `${notes.trim().split(/\s+/).length} words` : "0 words"}</span>
              <button disabled={!notes.trim()}><Sparkles size={14} /> Make recall prompt</button>
            </div>
          </div>
        ) : (
          <div className="sources-pane">
            <div className="source-pane-heading"><span>Grounding this concept</span><small>Official sources only</small></div>
            {sources.map((source, index) => (
              <a href={source.href} target="_blank" rel="noreferrer" className="source-item" key={source.title}>
                <span className="source-number">0{index + 1}</span>
                <div><strong>{source.title}</strong><span>{source.domain}</span><small>{source.detail}</small></div>
                <ExternalLink size={13} />
              </a>
            ))}
            <div className="source-rule"><CheckCircle2 size={15} /><p><strong>Source rule</strong>Current will not update this concept from community posts unless you approve them.</p></div>
          </div>
        )}
      </aside>

      <div className="command-dock">
        <div className="dock-inner">
          <Command size={15} />
          <span>Change the practice:</span>
          <button onClick={() => { setMode("recall"); setSupportMode("visual"); }}>show a visual</button>
          <button onClick={() => { setMode("recall"); setSupportMode("example"); }}>use an example</button>
          <button onClick={() => setMode("apply")}>give me code</button>
          <span className="dock-spacer" />
          <kbd>⌘ ↵</kbd>
        </div>
      </div>
    </div>
  );
}

function ReadModule({ highlighted, addToNotes, next }: { highlighted: boolean; addToNotes: () => void; next: () => void }) {
  return (
    <article className="lesson-module read-module">
      <header className="module-header">
        <div className="module-kicker"><span>Concept 2</span><span>6 min</span><span>Updated from source</span></div>
        <h1>What compaction actually preserves</h1>
        <p>Long-running agents eventually accumulate more context than is useful to carry turn by turn. Compaction reduces that context without forcing the agent to begin again.</p>
      </header>

      <section className="reading-section">
        <h2>Start with the mental model</h2>
        <p>A Responses request can watch its rendered token count. When that count crosses a threshold you choose, the server produces an <strong>opaque compaction item</strong>. That item carries forward the prior state and reasoning needed for the next turn using fewer tokens.</p>
        <div className="concept-diagram" aria-label="Compaction flow">
          <div className="diagram-stage"><span>Growing context</span><strong>messages</strong><strong>tool calls</strong><strong>reasoning</strong></div>
          <div className="diagram-arrow"><span>threshold crossed</span><ArrowRight size={18} /></div>
          <div className="diagram-stage result"><span>Next window</span><strong>opaque compact item</strong><strong>recent turns</strong></div>
        </div>
        <p>The compact item is intentionally not human-readable. Treat it as model context, not as a summary to display or edit.</p>
      </section>

      <section className="source-excerpt">
        <div className="excerpt-top"><span><FileText size={14} /> Source-backed note</span><a href="https://developers.openai.com/api/docs/guides/compaction" target="_blank" rel="noreferrer">Open source <ExternalLink size={12} /></a></div>
        <blockquote className={highlighted ? "highlighted" : ""}>Compaction reduces context size while preserving the state needed for later turns. The returned item carries forward key prior state and reasoning using fewer tokens.</blockquote>
        <button className={highlighted ? "excerpt-action added" : "excerpt-action"} onClick={addToNotes}><Highlighter size={14} />{highlighted ? "Added to notes" : "Add the idea to notes"}</button>
      </section>

      <section className="reading-section">
        <h2>Chaining changes what you send next</h2>
        <div className="comparison-row">
          <div><span>Input-array chaining</span><p>Append response output, including compaction items, to the next input. You may drop items before the latest compaction item.</p></div>
          <div><span><code>previous_response_id</code></span><p>Send only the new user message and carry the response ID forward. Do not manually prune the chain.</p></div>
        </div>
      </section>

      <footer className="module-footer"><span>Next, recall the idea without the source.</span><button className="continue-button" onClick={next}>Start recall <ArrowRight size={15} /></button></footer>
    </article>
  );
}

function RecallModule(props: {
  answer: string;
  setAnswer: (value: string) => void;
  evaluation: Evaluation | null;
  evaluate: () => void;
  isEvaluating: boolean;
  supportMode: "none" | "visual" | "example";
  setSupportMode: (mode: "visual" | "example") => void;
  reset: () => void;
  next: () => void;
}) {
  const needsSupport = Boolean(props.evaluation && props.evaluation.score < 75);
  return (
    <article className="lesson-module recall-module">
      <header className="module-header compact-header">
        <div className="module-kicker"><span>Active recall</span><span>No source visible</span></div>
        <h1>Rebuild the idea from memory.</h1>
        <p>What triggers server-side compaction, what does it preserve, and what should the next request contain when using <code>previous_response_id</code>?</p>
      </header>

      {props.supportMode === "visual" ? <VisualSupport /> : null}
      {props.supportMode === "example" ? <ExampleSupport /> : null}

      <label className="recall-input">
        <span>Your explanation</span>
        <textarea value={props.answer} onChange={(event) => props.setAnswer(event.target.value)} disabled={Boolean(props.evaluation)} placeholder="Compaction happens when…" />
        <small>{props.answer.length} characters</small>
      </label>

      {props.evaluation ? (
        <div className={`evaluation-result ${needsSupport ? "partial" : "strong"}`}>
          <div className="result-mark">{needsSupport ? <CircleHelp size={18} /> : <Check size={18} />}</div>
          <div>
            <span>{props.evaluation.mode === "live" ? "Evaluated by GPT-5.6 Sol" : "Demo evaluator"}</span>
            <h2>{props.evaluation.verdict}</h2>
            <p>{props.evaluation.feedback}</p>
            {props.evaluation.misconception ? <div className="gap-line"><strong>Missing link</strong>{props.evaluation.misconception}</div> : null}
          </div>
          <strong className="result-score">{props.evaluation.score}</strong>
        </div>
      ) : null}

      {needsSupport && props.supportMode === "none" ? (
        <div className="adapt-row"><span>Try the idea another way</span><button onClick={() => props.setSupportMode("visual")}><ListChecks size={14} /> Visual sequence</button><button onClick={() => props.setSupportMode("example")}><Play size={13} /> Concrete example</button></div>
      ) : null}

      <footer className="module-footer">
        {props.evaluation ? <button className="subtle-button" onClick={props.reset}><RotateCcw size={14} /> Try again</button> : <span>Current checks the concept, not exact wording.</span>}
        {props.evaluation && !needsSupport ? <button className="continue-button" onClick={props.next}>Apply it in code <ArrowRight size={15} /></button> : <button className="continue-button" disabled={!props.answer.trim() || props.isEvaluating || Boolean(props.evaluation)} onClick={props.evaluate}>{props.isEvaluating ? "Checking…" : "Check understanding"}<Send size={14} /></button>}
      </footer>
    </article>
  );
}

function VisualSupport() {
  return <div className="support-module"><span className="support-label">Visual sequence</span><div className="support-steps"><div><small>1</small><strong>Watch token count</strong></div><ChevronRight size={16} /><div><small>2</small><strong>Cross threshold</strong></div><ChevronRight size={16} /><div><small>3</small><strong>Emit compact item</strong></div><ChevronRight size={16} /><div><small>4</small><strong>Send new turn</strong></div></div><p>The compact item carries forward the useful state. With <code>previous_response_id</code>, your application adds only the new user message.</p></div>;
}

function ExampleSupport() {
  return <div className="support-module example-support"><span className="support-label">Concrete example</span><p>Imagine a coding agent has completed 80 tool calls. The transcript crosses your token threshold. The server replaces older context with an opaque compact item, returns it in the stream, and continues. On the next turn, your app sends “Now add tests” with the previous response ID; it does not rebuild or prune the history itself.</p></div>;
}

function ApplyModule({ choice, setChoice, checked, check, next }: { choice: number | null; setChoice: (choice: number) => void; checked: boolean; check: () => void; next: () => void }) {
  const choices = [
    `context_management: {\n  compact: true,\n  summarize: "automatic"\n}`,
    `context_management: [{\n  type: "compaction",\n  compact_threshold: 200000\n}]`,
    `previous_response_id: "compact",\nprune_before: 200000`,
  ];
  const correct = checked && choice === 1;
  return (
    <article className="lesson-module apply-module">
      <header className="module-header compact-header">
        <div className="module-kicker"><span>Hands-on</span><span>Responses API</span></div>
        <h1>Enable server-side compaction.</h1>
        <p>Choose the configuration that triggers compaction after the rendered context crosses 200,000 tokens.</p>
      </header>
      <div className="code-context"><span>client.responses.create</span><pre>{`const response = await client.responses.create({\n  model: "gpt-5.6-sol",\n  input: conversation,\n  store: false,\n  // Choose the correct block below\n});`}</pre></div>
      <div className="code-options">
        {choices.map((item, index) => (
          <button className={`${choice === index ? "selected" : ""} ${checked && choice === index && index !== 1 ? "wrong" : ""} ${checked && index === 1 ? "right" : ""}`} onClick={() => !correct && setChoice(index)} key={item}>
            <span className="option-index">{String.fromCharCode(65 + index)}</span><pre>{item}</pre>{checked && index === 1 ? <CheckCircle2 size={17} /> : null}
          </button>
        ))}
      </div>
      {checked ? <div className={correct ? "code-feedback success" : "code-feedback error"}>{correct ? <CheckCircle2 size={16} /> : <CircleHelp size={16} />}<p><strong>{correct ? "That is the documented shape." : "That option invents parameters."}</strong>{correct ? "The server watches the rendered token count and emits the compact item when the threshold is crossed." : "Look for context_management as an array with a compaction type and compact_threshold."}</p></div> : null}
      <footer className="module-footer"><span>{correct ? "The final step turns this into durable memory." : "Use the exact API shape from the source."}</span>{correct ? <button className="continue-button" onClick={next}>Reflect and schedule <ArrowRight size={15} /></button> : <button className="continue-button" disabled={choice === null} onClick={check}>Run check <Play size={13} /></button>}</footer>
    </article>
  );
}

function ReflectModule({ reflection, setReflection, scheduled, schedule }: { reflection: string; setReflection: (value: string) => void; scheduled: boolean; schedule: () => void }) {
  return (
    <article className="lesson-module reflect-module">
      <header className="module-header compact-header">
        <div className="module-kicker"><span>Reflection</span><span>1 minute</span></div>
        <h1>Connect it to something you would build.</h1>
        <p>Name one situation where you would choose server-side compaction and one implementation mistake you now know to avoid.</p>
      </header>
      <label className="recall-input reflection-input"><span>Commit the idea to memory</span><textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="I would use this when…" /><small>This reflection becomes part of your concept history.</small></label>
      <div className="session-summary">
        <div><Check size={14} /><span><strong>Read</strong>Source-backed mental model</span></div>
        <div><Check size={14} /><span><strong>Recalled</strong>Trigger, preserved state, next turn</span></div>
        <div><Check size={14} /><span><strong>Applied</strong>Correct API configuration</span></div>
      </div>
      {scheduled ? <div className="scheduled-state"><CheckCircle2 size={18} /><div><strong>Review scheduled for tomorrow</strong><span>The next prompt will ask you to reconstruct the API shape without choices.</span></div></div> : null}
      <footer className="module-footer"><span>{scheduled ? "Concept 2 complete. Stateless chaining is ready next." : "Shorter intervals follow effortful first recall."}</span><button className="continue-button" disabled={!reflection.trim() || scheduled} onClick={schedule}>{scheduled ? "Scheduled" : "Finish and schedule review"}<Check size={14} /></button></footer>
    </article>
  );
}

function localEvaluation(answer: string): Evaluation {
  const normalized = answer.toLowerCase();
  const threshold = normalized.includes("threshold") || normalized.includes("token");
  const preserves = normalized.includes("preserv") || normalized.includes("state") || normalized.includes("reasoning");
  const nextTurn = normalized.includes("new user") || normalized.includes("new message") || normalized.includes("only the new") || normalized.includes("previous_response_id");
  const score = Math.min(96, 34 + Number(threshold) * 21 + Number(preserves) * 22 + Number(nextTurn) * 19);
  return {
    score,
    verdict: score >= 75 ? "You have the operating model" : "One link is still missing",
    feedback: score >= 75 ? "You connected the threshold, preserved state, and next-turn behavior. The wording is yours, but the mechanism is intact." : "Your answer has part of the mechanism. Reconstruct the full sequence: trigger, compact item, then the next request.",
    misconception: score >= 75 ? null : !threshold ? "Compaction is triggered by a configured rendered-token threshold." : !preserves ? "The opaque item preserves key prior state and reasoning; it is not merely deleted history." : "With previous_response_id, send only the new user message and do not manually prune.",
    nextPrompt: score >= 75 ? "Apply the documented request shape." : "Try the concept as a visual sequence.",
    mode: "demo",
  };
}
