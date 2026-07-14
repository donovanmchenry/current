"use client";

import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Code2,
  ExternalLink,
  FileText,
  FolderOpen,
  Highlighter,
  ListChecks,
  Menu,
  NotebookPen,
  Play,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { scheduleReview } from "../lib/spaced-review";

type Mode = "read" | "recall" | "apply" | "reflect";
type TransitionPhase = "idle" | "leaving" | "entering";

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
    detail: "Server-side and standalone compaction",
    href: "https://developers.openai.com/api/docs/guides/compaction",
  },
  {
    title: "Conversation state",
    detail: "Responses, conversations, and chaining",
    href: "https://developers.openai.com/api/docs/guides/conversation-state",
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

const noteExcerpt = "Compaction preserves key prior state in an opaque item while using fewer tokens.";

export function CurrentWorkspace() {
  const [mode, setMode] = useState<Mode>("read");
  const [notes, setNotes] = useState("");
  const [recallAnswer, setRecallAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [supportMode, setSupportMode] = useState<"none" | "visual" | "example">("none");
  const [codeChoice, setCodeChoice] = useState<number | null>(null);
  const [codeChecked, setCodeChecked] = useState(false);
  const [recallPassed, setRecallPassed] = useState(false);
  const [reflection, setReflection] = useState("");
  const [nextReview, setNextReview] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>("idle");
  const [modeDirection, setModeDirection] = useState<"forward" | "backward">("forward");
  const hydrated = useRef(false);
  const lessonScrollRef = useRef<HTMLDivElement>(null);
  const transitionTimer = useRef<number | null>(null);

  useEffect(() => {
    const savedNotes = window.localStorage.getItem("current-notebook-v2") ?? "";
    const savedReflection = window.localStorage.getItem("current-reflection-v1") ?? "";
    const savedReview = window.localStorage.getItem("current-review-v1");
    const frame = window.requestAnimationFrame(() => {
      setNotes(savedNotes);
      setReflection(savedReflection);
      setNextReview(savedReview);
      setHighlighted(savedNotes.includes(noteExcerpt));
      hydrated.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem("current-notebook-v2", notes);
    window.localStorage.setItem("current-reflection-v1", reflection);
    if (nextReview) window.localStorage.setItem("current-review-v1", nextReview);
  }, [nextReview, notes, reflection]);

  useEffect(() => () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
  }, []);

  const modeIndex = modeItems.findIndex((item) => item.id === mode);
  const recallComplete = recallPassed || Boolean(nextReview);
  const codePassed = (codeChecked && codeChoice === 1) || Boolean(nextReview);

  const transitionToMode = (nextMode: Mode) => {
    if (nextMode === mode || transitionPhase !== "idle") return;
    const nextIndex = modeItems.findIndex((item) => item.id === nextMode);
    const direction = nextIndex > modeIndex ? "forward" : "backward";
    setModeDirection(direction);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      lessonScrollRef.current?.scrollTo({ top: 0 });
      setMode(nextMode);
      return;
    }

    setTransitionPhase("leaving");
    transitionTimer.current = window.setTimeout(() => {
      lessonScrollRef.current?.scrollTo({ top: 0 });
      setMode(nextMode);
      setTransitionPhase("entering");
      transitionTimer.current = window.setTimeout(() => {
        setTransitionPhase("idle");
        transitionTimer.current = null;
      }, 320);
    }, 140);
  };

  const addExcerptToNotes = () => {
    setNotes((value) => value.includes(noteExcerpt) ? value : value ? `${value}\n\n${noteExcerpt}` : noteExcerpt);
    setHighlighted(true);
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
      const result = (await response.json()) as Evaluation;
      setEvaluation(result);
      if (result.score >= 75) setRecallPassed(true);
    } catch {
      const result = localEvaluation(recallAnswer);
      setEvaluation(result);
      if (result.score >= 75) setRecallPassed(true);
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetRecall = () => {
    setRecallAnswer("");
    setEvaluation(null);
  };

  const checkCode = () => {
    if (codeChoice === null) return;
    setCodeChecked(true);
  };

  const finishAndSchedule = () => {
    const schedule = scheduleReview({ intervalDays: 1, ease: 2.5, repetitions: 0 }, 4);
    setNextReview(schedule.nextReview.toISOString());
  };

  return (
    <div className={`current-app ${notebookOpen ? "with-notebook" : ""}`}>
      <header className="workspace-header">
        <div className="header-left">
          <button className="icon-action mobile-only" aria-label="Open course outline" onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
          <div className="wordmark"><span className="wordmark-symbol">C</span><span>Current</span></div>
          <span className="header-separator" />
          <span className="track-context">AI agent engineering</span>
        </div>
        <div className="header-center"><span className="lesson-name">Long-running agent context</span></div>
        <div className="header-right">
          <span className="header-progress">Concept 2 of 5</span>
        </div>
      </header>

      {sidebarOpen ? <button className="overlay" aria-label="Close course outline" onClick={() => setSidebarOpen(false)} /> : null}
      <button className={`notebook-overlay ${notebookOpen ? "open" : ""}`} aria-label="Close notebook" aria-hidden={!notebookOpen} tabIndex={notebookOpen ? 0 : -1} onClick={() => setNotebookOpen(false)} />

      <aside className={`course-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-mobile-head"><span>Course outline</span><button className="icon-action" onClick={() => setSidebarOpen(false)} aria-label="Close course outline"><X size={17} /></button></div>
        <div className="track-title">
          <span className="track-icon"><FolderOpen size={16} /></span>
          <div><strong>Long-running agents</strong><small>OpenAI API · 5 concepts</small></div>
        </div>

        <ol className="concept-path">
          {concepts.map((concept, index) => (
            <li className={concept.status} key={concept.label}>
              <div className="concept-row">
                <span className="concept-state">{concept.status === "done" ? <Check size={11} /> : index + 1}</span>
                <span>{concept.label}</span>
                {concept.status === "current" ? <span className="now-label">Now</span> : null}
              </div>
            </li>
          ))}
        </ol>

        <div className="sidebar-bottom">
          <div className={`sidebar-sources-viewport ${sourcesOpen ? "open" : ""}`} aria-hidden={!sourcesOpen}>
            <div className="sidebar-sources-drawer">
              <div className="sidebar-sources">
                <div className="sidebar-sources-heading"><span>Official sources</span><small>For this concept</small></div>
                {sources.map((source) => (
                  <a href={source.href} target="_blank" rel="noreferrer" tabIndex={sourcesOpen ? 0 : -1} className="sidebar-source-item" key={source.title}>
                    <FileText size={14} />
                    <span><strong>{source.title}</strong><small>{source.detail}</small></span>
                    <ExternalLink size={12} />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <button aria-expanded={sourcesOpen} onClick={() => setSourcesOpen((value) => !value)}><FileText size={15} /><span>Sources</span><small>{sources.length}</small><ChevronDown className={sourcesOpen ? "expanded" : ""} size={14} /></button>
        </div>
      </aside>

      <main className="learning-canvas">
        <div className="lesson-toolbar">
          <span className="stage-count">Step {modeIndex + 1} of {modeItems.length}</span>
          <div className="mode-switcher" role="tablist" aria-label="Learning mode">
            {modeItems.map((item) => {
              const Icon = item.icon;
              const locked = (item.id === "apply" && !recallComplete) || (item.id === "reflect" && !codePassed);
              return (
                <button
                  role="tab"
                  aria-selected={mode === item.id}
                  disabled={locked || transitionPhase !== "idle"}
                  className={mode === item.id ? "active" : ""}
                  onClick={() => transitionToMode(item.id)}
                  aria-label={locked ? `${item.label} locked` : item.label}
                  title={item.label}
                  key={item.id}
                >
                  <Icon size={14} />{item.label}
                </button>
              );
            })}
          </div>
          <button className={`notebook-toggle ${notebookOpen ? "active" : ""}`} aria-label={notebookOpen ? "Close notebook" : "Open notebook"} aria-pressed={notebookOpen} onClick={() => setNotebookOpen((value) => !value)}><NotebookPen size={15} /><span>Notes</span></button>
        </div>

        <div className="lesson-scroll" ref={lessonScrollRef}>
          <div className={`mode-stage ${transitionPhase} ${modeDirection}`} aria-busy={transitionPhase !== "idle"}>
            {mode === "read" ? <ReadModule highlighted={highlighted} addToNotes={addExcerptToNotes} next={() => { setSupportMode("none"); transitionToMode("recall"); }} /> : null}
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
                next={() => transitionToMode("apply")}
              />
            ) : null}
            {mode === "apply" ? (
              <ApplyModule
                choice={codeChoice}
                setChoice={(choice) => { setCodeChoice(choice); setCodeChecked(false); }}
                checked={codeChecked}
                check={checkCode}
                next={() => transitionToMode("reflect")}
              />
            ) : null}
            {mode === "reflect" ? (
              <ReflectModule
                reflection={reflection}
                setReflection={setReflection}
                nextReview={nextReview}
                schedule={finishAndSchedule}
              />
            ) : null}
          </div>
        </div>
      </main>

      <aside className={`notebook-panel ${notebookOpen ? "open" : ""}`} aria-hidden={!notebookOpen}>
        <div className="notes-pane">
          <div className="note-document-title">
            <div><span>Compaction notes</span><small>Saved on this device</small></div>
          </div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            tabIndex={notebookOpen ? 0 : -1}
            placeholder={"Write while you learn…\n\nTry explaining the purpose of compaction without copying the source."}
            aria-label="Learning notes"
          />
          <div className="note-footer">
            <span>{notes.trim() ? `${notes.trim().split(/\s+/).length} words` : "0 words"}</span>
            <span>Autosaved</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ReadModule({ highlighted, addToNotes, next }: { highlighted: boolean; addToNotes: () => void; next: () => void }) {
  return (
    <article className="lesson-module read-module">
      <header className="module-header">
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
        <blockquote>Compaction reduces context size while preserving the state needed for later turns. The returned item carries forward key prior state and reasoning using fewer tokens.</blockquote>
        <button className={highlighted ? "excerpt-action added" : "excerpt-action"} disabled={highlighted} onClick={addToNotes}><Highlighter size={14} />{highlighted ? "Added to notes" : "Add to notes"}</button>
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
            <span>{props.evaluation.mode === "live" ? "Evaluated by GPT-5.6 Sol" : "Checked against the lesson"}</span>
            <h2>{props.evaluation.verdict}</h2>
            <p>{props.evaluation.feedback}</p>
            {props.evaluation.misconception ? <div className="gap-line"><strong>Missing link</strong>{props.evaluation.misconception}</div> : null}
          </div>
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

function ReflectModule({ reflection, setReflection, nextReview, schedule }: { reflection: string; setReflection: (value: string) => void; nextReview: string | null; schedule: () => void }) {
  const reviewDate = nextReview ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(nextReview)) : null;
  return (
    <article className="lesson-module reflect-module">
      <header className="module-header compact-header">
        <h1>Connect it to something you would build.</h1>
        <p>Name one situation where you would choose server-side compaction and one implementation mistake you now know to avoid.</p>
      </header>
      <label className="recall-input reflection-input"><span>Your reflection</span><textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="I would use this when…" /><small>Saved on this device.</small></label>
      <div className="session-summary">
        <div><Check size={14} /><span><strong>Read</strong>Source-backed mental model</span></div>
        <div><Check size={14} /><span><strong>Recalled</strong>Trigger, preserved state, next turn</span></div>
        <div><Check size={14} /><span><strong>Applied</strong>Correct API configuration</span></div>
      </div>
      {reviewDate ? <div className="scheduled-state"><CheckCircle2 size={18} /><div><strong>Review scheduled for {reviewDate}</strong><span>You will reconstruct the API shape without choices.</span></div></div> : null}
      <footer className="module-footer"><span>{reviewDate ? "Concept complete. The review date is saved on this device." : "Finish with one effortful review tomorrow."}</span><button className="continue-button" disabled={!reflection.trim() || Boolean(reviewDate)} onClick={schedule}>{reviewDate ? "Scheduled" : "Finish and schedule review"}<Check size={14} /></button></footer>
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
