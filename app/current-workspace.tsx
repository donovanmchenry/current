"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Code2,
  Command,
  ExternalLink,
  FileText,
  GitBranch,
  Highlighter,
  Home,
  Layers3,
  Menu,
  MessageSquareText,
  Network,
  NotebookPen,
  Play,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Timer,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { scheduleReview } from "../lib/spaced-review";

type View = "today" | "knowledge" | "review";
type SessionStep = "reading" | "check" | "recall" | "task" | "complete";

type AgentEvent = {
  actor: string;
  action: string;
  meta: string;
  done: boolean;
};

type Evaluation = {
  score: number;
  verdict: string;
  feedback: string;
  misconception: string | null;
  nextPrompt: string;
  mode: "live" | "demo";
};

const patchSource = "https://developers.openai.com/api/docs/models/gpt-5.6-sol";

const baseEvents: AgentEvent[] = [
  { actor: "Research", action: "Checked trusted model documentation", meta: "4 sources · 9:32 AM", done: true },
  { actor: "Delta", action: "Found a change in your model-selection notes", meta: "High confidence", done: true },
  { actor: "Curriculum", action: "Created a focused knowledge patch", meta: "3 concepts affected", done: true },
];

const stepEvents: Record<SessionStep, AgentEvent[]> = {
  reading: [],
  check: [{ actor: "Recall", action: "Generated a recognition check", meta: "Source grounded", done: true }],
  recall: [
    { actor: "Recall", action: "Generated an open recall prompt", meta: "No hints shown", done: true },
    { actor: "Evaluator", action: "Waiting for your explanation", meta: "GPT-5.6 Sol", done: false },
  ],
  task: [
    { actor: "Evaluator", action: "Detected an alias-versus-ID gap", meta: "Targeted practice", done: true },
    { actor: "Practice", action: "Switched to hands-on mode", meta: "Configuration task", done: true },
  ],
  complete: [
    { actor: "Mastery", action: "Updated model-selection mastery", meta: "+16 points", done: true },
    { actor: "Scheduler", action: "Scheduled the next recall", meta: "Jul 17 · 9:00 AM", done: true },
  ],
};

const navItems = [
  { id: "today" as const, label: "Today", icon: Home, count: 2 },
  { id: "knowledge" as const, label: "Knowledge", icon: Network },
  { id: "review" as const, label: "Review queue", icon: Layers3, count: 5 },
];

export function CurrentWorkspace() {
  const [view, setView] = useState<View>("today");
  const [sessionStep, setSessionStep] = useState<SessionStep | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(12 * 60);
  const [choice, setChoice] = useState<number | null>(null);
  const [choiceChecked, setChoiceChecked] = useState(false);
  const [recallAnswer, setRecallAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [codeChoice, setCodeChoice] = useState<number | null>(null);
  const [codeChecked, setCodeChecked] = useState(false);
  const [mastery, setMastery] = useState(62);
  const [nextReview, setNextReview] = useState("Jul 17");

  useEffect(() => {
    const saved = window.localStorage.getItem("current-session-notes");
    if (!saved) return;
    const frame = window.requestAnimationFrame(() => setNotes(saved));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("current-session-notes", notes);
  }, [notes]);

  useEffect(() => {
    if (!sessionStep || sessionStep === "complete") return;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sessionStep]);

  const events = useMemo(() => {
    if (!sessionStep) return baseEvents;
    return [...baseEvents, ...stepEvents[sessionStep]];
  }, [sessionStep]);

  const startSession = () => {
    setView("today");
    setSessionStep("reading");
    setSecondsLeft(12 * 60);
    setSidebarOpen(false);
  };

  const finishTask = () => {
    setCodeChecked(true);
    if (codeChoice === 1) {
      const schedule = scheduleReview(
        { intervalDays: 1, ease: 2.5, repetitions: 2 },
        4,
        new Date("2026-07-14T09:00:00"),
      );
      setMastery(78);
      setNextReview(schedule.nextReview.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
      window.setTimeout(() => setSessionStep("complete"), 650);
    }
  };

  const evaluateRecall = async () => {
    if (!recallAnswer.trim()) return;
    setIsEvaluating(true);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answer: recallAnswer }),
      });
      if (!response.ok) throw new Error("Evaluation failed");
      setEvaluation((await response.json()) as Evaluation);
    } catch {
      const normalized = recallAnswer.toLowerCase();
      const hasAlias = normalized.includes("alias") || normalized.includes("route");
      const hasExplicit = normalized.includes("explicit") || normalized.includes("sol");
      setEvaluation({
        score: hasAlias && hasExplicit ? 84 : 52,
        verdict: hasAlias && hasExplicit ? "Strong explanation" : "Partially correct",
        feedback: hasAlias
          ? "You identified that gpt-5.6 is an alias. Add why an explicit model ID makes the selected tier obvious in configuration."
          : "The missing idea is routing: gpt-5.6 is an alias that currently routes to the Sol tier.",
        misconception: hasAlias && hasExplicit ? null : "Treating an alias and an explicit model ID as interchangeable labels.",
        nextPrompt: "Make the model tier explicit in a configuration change.",
        mode: "demo",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const sessionProgress = sessionStep
    ? { reading: 18, check: 38, recall: 61, task: 82, complete: 100 }[sessionStep]
    : 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}>
          <Menu size={19} />
        </button>
        <button className="brand" onClick={() => { setView("today"); setSessionStep(null); }} aria-label="Current home">
          <span className="brand-mark"><Command size={16} strokeWidth={2.4} /></span>
          <span>Current</span>
        </button>
        <div className="topbar-divider" />
        <div className="workspace-name"><span className="status-dot" /> AI engineering</div>
        <label className="global-search">
          <Search size={16} />
          <input aria-label="Search your knowledge" placeholder="Search your knowledge" />
          <kbd>⌘ K</kbd>
        </label>
        <div className="topbar-actions">
          <span className="synced"><RefreshCw size={14} /> Synced 8m ago</span>
          <button className="icon-button" aria-label="Settings"><Settings size={18} /></button>
          <button className="avatar" aria-label="User profile">DM</button>
        </div>
      </header>

      {sidebarOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="mobile-sidebar-title">
          <span>Workspace</span>
          <button className="icon-button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>
        <nav className="main-nav" aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={view === item.id && !sessionStep ? "nav-item active" : "nav-item"}
                onClick={() => { setView(item.id); setSessionStep(null); setSidebarOpen(false); }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {item.count ? <span className="nav-count">{item.count}</span> : null}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-section">
          <p className="nav-label">Following</p>
          <button className="field-item active-field"><span className="field-dot green" />OpenAI API<span>3</span></button>
          <button className="field-item"><span className="field-dot coral" />AI engineering<span>1</span></button>
          <button className="field-item"><span className="field-dot blue" />Next.js<span>0</span></button>
        </div>

        <div className="sidebar-spacer" />
        <div className="focus-card">
          <div className="focus-icon"><Zap size={16} /></div>
          <div><strong>4 day streak</strong><span>42 min learned this week</span></div>
        </div>
        <button className="new-topic-button"><span>+</span> Follow a field</button>
      </aside>

      <main className={`main-workspace ${sessionStep ? "session-active" : ""}`}>
        {sessionStep ? (
          <SessionWorkspace
            step={sessionStep}
            setStep={setSessionStep}
            notes={notes}
            setNotes={setNotes}
            choice={choice}
            setChoice={setChoice}
            choiceChecked={choiceChecked}
            setChoiceChecked={setChoiceChecked}
            recallAnswer={recallAnswer}
            setRecallAnswer={setRecallAnswer}
            evaluation={evaluation}
            evaluateRecall={evaluateRecall}
            isEvaluating={isEvaluating}
            codeChoice={codeChoice}
            setCodeChoice={setCodeChoice}
            codeChecked={codeChecked}
            finishTask={finishTask}
            mastery={mastery}
            nextReview={nextReview}
            endSession={() => setSessionStep(null)}
          />
        ) : view === "today" ? (
          <TodayView startSession={startSession} mastery={mastery} />
        ) : view === "knowledge" ? (
          <KnowledgeView mastery={mastery} startSession={startSession} />
        ) : (
          <ReviewView startSession={startSession} />
        )}
      </main>

      <aside className={`context-panel ${sessionStep ? "session-context" : ""}`}>
        {sessionStep && sessionStep !== "complete" ? (
          <>
            <div className="context-tabs"><button className="active">Notes</button><button>Sources</button></div>
            <div className="notepad-header"><span><NotebookPen size={16} /> Session notes</span><span>Saved</span></div>
            <textarea
              className="notepad"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Write the difference in your own words…"
              aria-label="Session notes"
            />
            <button className="note-action"><Sparkles size={15} /> Turn note into recall prompt</button>
          </>
        ) : (
          <div className="context-heading">
            <div><span className="eyebrow">Live system</span><h2>Agent trail</h2></div>
            <span className="live-pill"><span /> Live</span>
          </div>
        )}

        <div className="agent-section">
          {sessionStep && sessionStep !== "complete" ? <p className="agent-label">Agent trail</p> : null}
          <div className="agent-timeline">
            {events.map((event, index) => (
              <div className={`agent-event ${event.done ? "done" : "working"}`} key={`${event.actor}-${index}`}>
                <span className="event-mark">{event.done ? <Check size={12} /> : <span />}</span>
                <div><strong>{event.actor}</strong><p>{event.action}</p><small>{event.meta}</small></div>
              </div>
            ))}
          </div>
        </div>

        {!sessionStep ? (
          <div className="source-health">
            <div className="source-health-title"><span>Source health</span><span>4 / 4</span></div>
            <div className="health-bar"><span /></div>
            <p>All trusted sources checked successfully.</p>
          </div>
        ) : null}
      </aside>

      {sessionStep && sessionStep !== "complete" ? (
        <footer className="session-bar">
          <div className="timer-readout"><Timer size={17} /><strong>{minutes}:{seconds}</strong><span>Focus session</span></div>
          <div className="session-progress"><span style={{ width: `${sessionProgress}%` }} /></div>
          <span className="step-readout">{Math.ceil(sessionProgress / 20)} of 5</span>
          <button className="text-button" onClick={() => setSessionStep(null)}>Exit session</button>
        </footer>
      ) : null}
    </div>
  );
}

function TodayView({ startSession, mastery }: { startSession: () => void; mastery: number }) {
  return (
    <div className="page-content dashboard-page">
      <div className="page-heading-row">
        <div><span className="eyebrow">Tuesday, July 14</span><h1>Good afternoon, Donovan.</h1><p>Your field moved. Here is what is worth learning today.</p></div>
        <button className="primary-button" onClick={startSession}><Play size={16} fill="currentColor" /> Start 12-min session</button>
      </div>

      <section className="metric-strip" aria-label="Learning summary">
        <div><span className="metric-icon coral-bg"><Sparkles size={17} /></span><p>New changes<strong>2</strong></p><small>1 high priority</small></div>
        <div><span className="metric-icon blue-bg"><Brain size={17} /></span><p>Due for review<strong>5</strong></p><small>About 9 minutes</small></div>
        <div><span className="metric-icon yellow-bg"><TrendingUp size={17} /></span><p>Weekly mastery<strong>+8%</strong></p><small>Best in tool use</small></div>
      </section>

      <section className="dashboard-section">
        <div className="section-title"><div><h2>Curriculum updates</h2><p>Changes measured against what you already know.</p></div><button className="quiet-link">View all <ArrowRight size={15} /></button></div>
        <article className="featured-patch">
          <div className="patch-accent" />
          <div className="patch-main">
            <div className="patch-meta"><span className="priority-pill">High priority</span><span>OpenAI API</span><span>Detected 8 min ago</span></div>
            <h3>GPT-5.6 Sol is now the default frontier model</h3>
            <p>Your notes still point to GPT-5.5 for complex reasoning and coding. The current model guide recommends GPT-5.6 Sol, and the unsuffixed alias now routes to it.</p>
            <div className="delta-preview">
              <div><span className="delta-label old">Your note</span><code>model: &quot;gpt-5.5&quot;</code></div>
              <ChevronRight size={18} />
              <div><span className="delta-label new">Current</span><code>model: &quot;gpt-5.6-sol&quot;</code></div>
            </div>
            <div className="patch-footer">
              <div className="concept-list"><span>Model selection</span><span>Aliases</span><span>Reasoning effort</span></div>
              <button className="secondary-button" onClick={startSession}>Learn this update <ArrowRight size={15} /></button>
            </div>
          </div>
        </article>

        <article className="compact-patch">
          <span className="source-glyph"><FileText size={18} /></span>
          <div><span className="patch-kicker">OpenAI API · Cost model</span><h3>Long-context pricing begins beyond 272K input tokens</h3><p>One saved note needs a cost-planning correction.</p></div>
          <span className="effort-pill">4 min</span>
          <button className="icon-button" aria-label="Open update"><ChevronRight size={18} /></button>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="unframed-section">
          <div className="section-title compact"><div><h2>Knowledge pulse</h2><p>Mastery across your active field.</p></div></div>
          <div className="mastery-list">
            <MasteryRow label="Responses API" value={84} color="green" />
            <MasteryRow label="Tool use" value={71} color="blue" />
            <MasteryRow label="Model selection" value={mastery} color="coral" stale />
            <MasteryRow label="Structured outputs" value={58} color="yellow" />
          </div>
        </div>
        <div className="unframed-section review-preview">
          <div className="section-title compact"><div><h2>Next reviews</h2><p>Spaced around your recall history.</p></div></div>
          <ReviewLine time="Today" title="Response state and chaining" kind="Open recall" />
          <ReviewLine time="Today" title="Tool schema constraints" kind="Spot the bug" />
          <ReviewLine time="Thu" title="Model aliases" kind="Hands-on" />
        </div>
      </section>
    </div>
  );
}

function SessionWorkspace(props: {
  step: SessionStep;
  setStep: (step: SessionStep) => void;
  notes: string;
  setNotes: (notes: string) => void;
  choice: number | null;
  setChoice: (choice: number) => void;
  choiceChecked: boolean;
  setChoiceChecked: (value: boolean) => void;
  recallAnswer: string;
  setRecallAnswer: (answer: string) => void;
  evaluation: Evaluation | null;
  evaluateRecall: () => void;
  isEvaluating: boolean;
  codeChoice: number | null;
  setCodeChoice: (choice: number) => void;
  codeChecked: boolean;
  finishTask: () => void;
  mastery: number;
  nextReview: string;
  endSession: () => void;
}) {
  const { step } = props;
  if (step === "complete") return <SessionComplete mastery={props.mastery} nextReview={props.nextReview} endSession={props.endSession} />;

  return (
    <div className="page-content session-page">
      <div className="session-topline">
        <button className="back-button" onClick={props.endSession}><ArrowLeft size={16} /> Today</button>
        <div className="lesson-path"><span>OpenAI API</span><ChevronRight size={14} /><strong>Model selection update</strong></div>
        <span className="source-backed"><CheckCircle2 size={14} /> Source backed</span>
      </div>

      {step === "reading" ? <ReadingStep onNext={() => props.setStep("check")} /> : null}
      {step === "check" ? (
        <RecognitionStep
          choice={props.choice}
          setChoice={props.setChoice}
          checked={props.choiceChecked}
          check={() => props.setChoiceChecked(true)}
          next={() => props.setStep("recall")}
        />
      ) : null}
      {step === "recall" ? (
        <RecallStep
          answer={props.recallAnswer}
          setAnswer={props.setRecallAnswer}
          evaluation={props.evaluation}
          evaluate={props.evaluateRecall}
          isEvaluating={props.isEvaluating}
          next={() => props.setStep("task")}
        />
      ) : null}
      {step === "task" ? (
        <TaskStep
          choice={props.codeChoice}
          setChoice={props.setCodeChoice}
          checked={props.codeChecked}
          check={props.finishTask}
        />
      ) : null}
    </div>
  );
}

function ReadingStep({ onNext }: { onNext: () => void }) {
  return (
    <article className="learning-module reading-module">
      <div className="module-label"><BookOpen size={15} /> Knowledge patch · 3 min</div>
      <h1>Make the model tier explicit.</h1>
      <p className="module-lede">The recommended default for complex reasoning and coding has moved from GPT-5.5 to <mark>GPT-5.6 Sol</mark>.</p>

      <div className="before-after">
        <div className="knowledge-state old-state"><span>Before · your saved note</span><p>Use GPT-5.5 when a task needs the strongest reasoning and coding performance.</p><code>model: &quot;gpt-5.5&quot;</code></div>
        <div className="knowledge-state new-state"><span>Now · official model guide</span><p>Start with GPT-5.6 Sol for complex professional work, reasoning, and coding.</p><code>model: &quot;gpt-5.6-sol&quot;</code></div>
      </div>

      <div className="reading-copy">
        <h2>There are two useful names to recognize</h2>
        <p><code>gpt-5.6-sol</code> names the Sol tier directly. <code>gpt-5.6</code> is an alias that currently routes requests to Sol. Both reach the same tier today, but the explicit ID makes the intended tier legible in code, logs, and demos.</p>
        <div className="notice"><Highlighter size={17} /><p><strong>What to notice</strong>The alias follows the family default. The explicit ID communicates your model-tier choice.</p></div>
        <p>Reasoning effort is a separate control. For this project, <code>high</code> is a strong development default; it does not change the model name itself.</p>
      </div>

      <div className="citation-row">
        <a href={patchSource} target="_blank" rel="noreferrer"><FileText size={15} /> OpenAI · GPT-5.6 Sol model guide <ExternalLink size={13} /></a>
        <span>Checked Jul 14, 2026</span>
      </div>

      <div className="module-actions"><span>Next: quick recognition check</span><button className="primary-button" onClick={onNext}>Continue <ArrowRight size={16} /></button></div>
    </article>
  );
}

function RecognitionStep({ choice, setChoice, checked, check, next }: { choice: number | null; setChoice: (choice: number) => void; checked: boolean; check: () => void; next: () => void }) {
  const options = ["gpt-5.6", "gpt-5.6-sol", "gpt-5.6-high", "gpt-sol-latest"];
  return (
    <article className="learning-module question-module">
      <div className="module-label"><CircleHelp size={15} /> Recognition check · 1 min</div>
      <span className="question-count">Question 1 of 3</span>
      <h1>Which model ID makes the Sol tier explicit?</h1>
      <p className="module-lede">Choose one answer. The explanation stays hidden until you commit.</p>
      <div className="choice-list">
        {options.map((option, index) => {
          const isCorrect = index === 1;
          const className = checked
            ? isCorrect ? "choice correct" : choice === index ? "choice incorrect" : "choice muted"
            : choice === index ? "choice selected" : "choice";
          return <button className={className} onClick={() => !checked && setChoice(index)} key={option}><span>{String.fromCharCode(65 + index)}</span><code>{option}</code>{checked && isCorrect ? <CheckCircle2 size={18} /> : null}</button>;
        })}
      </div>
      {checked ? (
        <div className={choice === 1 ? "feedback success" : "feedback correction"}>
          <CheckCircle2 size={19} />
          <div><strong>{choice === 1 ? "Correct" : "Not quite"}</strong><p><code>gpt-5.6-sol</code> directly names the tier. <code>gpt-5.6</code> is the routing alias.</p></div>
        </div>
      ) : null}
      <div className="module-actions"><span>{choice === null ? "Select an answer to continue" : checked ? "Next: explain it in your own words" : "Answer selected"}</span>{checked ? <button className="primary-button" onClick={next}>Continue <ArrowRight size={16} /></button> : <button className="primary-button" disabled={choice === null} onClick={check}>Check answer</button>}</div>
    </article>
  );
}

function RecallStep({ answer, setAnswer, evaluation, evaluate, isEvaluating, next }: { answer: string; setAnswer: (answer: string) => void; evaluation: Evaluation | null; evaluate: () => void; isEvaluating: boolean; next: () => void }) {
  return (
    <article className="learning-module recall-module">
      <div className="module-label"><MessageSquareText size={15} /> Open recall · 3 min</div>
      <span className="question-count">Question 2 of 3</span>
      <h1>Explain the difference without looking back.</h1>
      <p className="module-lede">What is the relationship between <code>gpt-5.6</code> and <code>gpt-5.6-sol</code>, and why might a team choose the explicit ID?</p>
      <label className="answer-box">
        <span>Your explanation</span>
        <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="The unsuffixed model name…" disabled={Boolean(evaluation)} />
        <small>{answer.length} characters · Recall from memory</small>
      </label>
      {evaluation ? (
        <div className={`evaluation-panel ${evaluation.score >= 75 ? "strong" : "partial"}`}>
          <div className="evaluation-score"><span>{evaluation.score}</span><small>/ 100</small></div>
          <div><span className="evaluation-model"><Sparkles size={13} /> {evaluation.mode === "live" ? "GPT-5.6 Sol evaluation" : "Demo evaluation"}</span><h3>{evaluation.verdict}</h3><p>{evaluation.feedback}</p>{evaluation.misconception ? <div className="misconception"><strong>Knowledge gap</strong>{evaluation.misconception}</div> : null}</div>
        </div>
      ) : null}
      <div className="module-actions"><span>{evaluation ? "Next: apply the update" : "Your answer is graded against the source-backed claim"}</span>{evaluation ? <button className="primary-button" onClick={next}>Try hands-on mode <Code2 size={16} /></button> : <button className="primary-button" disabled={!answer.trim() || isEvaluating} onClick={evaluate}>{isEvaluating ? <RefreshCw className="spin" size={16} /> : <Sparkles size={16} />} {isEvaluating ? "Evaluating" : "Check understanding"}</button>}</div>
    </article>
  );
}

function TaskStep({ choice, setChoice, checked, check }: { choice: number | null; setChoice: (choice: number) => void; checked: boolean; check: () => void }) {
  const snippets = [
    `const response = await client.responses.create({\n  model: "gpt-5.6",\n  reasoning: { effort: "sol" }\n});`,
    `const response = await client.responses.create({\n  model: "gpt-5.6-sol",\n  reasoning: { effort: "high" }\n});`,
    `const response = await client.responses.create({\n  model: "gpt-sol-high",\n  reasoning_effort: "5.6"\n});`,
  ];
  return (
    <article className="learning-module task-module">
      <div className="module-label"><Code2 size={15} /> Hands-on practice · 4 min</div>
      <span className="question-count">Question 3 of 3</span>
      <h1>Patch the stale configuration.</h1>
      <p className="module-lede">The project wants GPT-5.6 Sol explicitly, with high reasoning effort. Choose the configuration that communicates both decisions correctly.</p>
      <div className="code-choices">
        {snippets.map((snippet, index) => (
          <button key={snippet} onClick={() => !checked && setChoice(index)} className={`code-choice ${choice === index ? "selected" : ""} ${checked && choice !== 1 && choice === index ? "incorrect" : ""}`}>
            <span className="code-radio">{choice === index ? <span /> : null}</span><pre>{snippet}</pre>{checked && index === 1 ? <CheckCircle2 size={20} /> : null}
          </button>
        ))}
      </div>
      {checked && choice !== 1 ? <div className="feedback correction"><CircleHelp size={19} /><div><strong>Look at the two controls separately</strong><p>The model ID names Sol. Reasoning effort should be <code>high</code>.</p></div></div> : null}
      {checked && choice === 1 ? <div className="feedback success"><CheckCircle2 size={19} /><div><strong>Configuration patched</strong><p>The model and reasoning choices are both explicit.</p></div></div> : null}
      <div className="module-actions"><span>{checked && choice === 1 ? "Updating mastery and review schedule…" : "One configuration is source-aligned"}</span><button className="primary-button" disabled={choice === null || (checked && choice === 1)} onClick={check}><Play size={15} fill="currentColor" /> Apply and verify</button></div>
    </article>
  );
}

function SessionComplete({ mastery, nextReview, endSession }: { mastery: number; nextReview: string; endSession: () => void }) {
  return (
    <div className="completion-page">
      <div className="completion-mark"><Check size={28} /></div>
      <span className="eyebrow">Session complete</span>
      <h1>Your knowledge is current.</h1>
      <p>You patched one stale claim, explained the model alias, and applied the update in code.</p>
      <div className="completion-stats">
        <div><span>Mastery</span><strong>62 <ArrowRight size={18} /> {mastery}</strong><small>Model selection</small></div>
        <div><span>Next review</span><strong>{nextReview}</strong><small>9:00 AM · Open recall</small></div>
        <div><span>Session</span><strong>8m 41s</strong><small>3 practice modes</small></div>
      </div>
      <div className="knowledge-change">
        <div className="change-icon"><GitBranch size={19} /></div>
        <div><span>Knowledge graph updated</span><h3>GPT-5.6 Sol</h3><p>Linked to model aliases, reasoning effort, and API configuration.</p></div>
        <span className="mastery-change">+16 mastery</span>
      </div>
      <div className="completion-actions"><button className="secondary-button" onClick={endSession}>Back to Today</button><button className="primary-button" onClick={endSession}>Review another update <ArrowRight size={16} /></button></div>
    </div>
  );
}

function KnowledgeView({ mastery, startSession }: { mastery: number; startSession: () => void }) {
  return (
    <div className="page-content knowledge-page">
      <div className="page-heading-row"><div><span className="eyebrow">Living curriculum</span><h1>Your knowledge map</h1><p>What you know, what changed, and where recall is fading.</p></div><button className="secondary-button" onClick={startSession}><Play size={15} /> Practice weakest concept</button></div>
      <div className="graph-toolbar"><span><span className="legend-dot mastered" />Mastered</span><span><span className="legend-dot learning" />Learning</span><span><span className="legend-dot stale" />Stale</span><button><RefreshCw size={14} /> Updated 8m ago</button></div>
      <div className="knowledge-graph" role="img" aria-label="Concept graph showing OpenAI API knowledge relationships">
        <div className="graph-line line-a" /><div className="graph-line line-b" /><div className="graph-line line-c" /><div className="graph-line line-d" /><div className="graph-line line-e" />
        <GraphNode className="node-root" label="OpenAI API" value={78} state="mastered" icon={<Command size={18} />} />
        <GraphNode className="node-responses" label="Responses API" value={84} state="mastered" icon={<Layers3 size={18} />} />
        <GraphNode className="node-tools" label="Tool use" value={71} state="learning" icon={<Settings size={18} />} />
        <GraphNode className="node-model" label="Model selection" value={mastery} state={mastery > 70 ? "mastered" : "stale"} icon={<Brain size={18} />} />
        <GraphNode className="node-structured" label="Structured output" value={58} state="learning" icon={<Code2 size={18} />} />
        <GraphNode className="node-alias" label="Model aliases" value={44} state="stale" icon={<GitBranch size={18} />} />
      </div>
      <div className="graph-insight"><Sparkles size={17} /><p><strong>Current found one dependency worth fixing.</strong> Your model-alias knowledge affects how confidently you configure model selection.</p><button onClick={startSession}>Practice now <ArrowRight size={14} /></button></div>
    </div>
  );
}

function ReviewView({ startSession }: { startSession: () => void }) {
  return (
    <div className="page-content review-page">
      <div className="page-heading-row"><div><span className="eyebrow">Spaced repetition</span><h1>Review queue</h1><p>Five ideas are ready to be recalled, not reread.</p></div><button className="primary-button" onClick={startSession}><Play size={15} fill="currentColor" /> Start queue · 9 min</button></div>
      <div className="review-day"><div><span>Today</span><strong>3 items · 6 min</strong></div></div>
      <div className="review-table">
        <ReviewItem icon={<MessageSquareText size={17} />} title="Response state and chaining" field="Responses API" mode="Open recall" due="Due now" strength={46} />
        <ReviewItem icon={<Code2 size={17} />} title="Tool schema constraints" field="Tool use" mode="Spot the bug" due="Due now" strength={61} />
        <ReviewItem icon={<GitBranch size={17} />} title="Model aliases" field="Model selection" mode="Hands-on" due="In 2 hours" strength={38} />
      </div>
      <div className="review-day later"><div><span>Thursday</span><strong>2 items · 3 min</strong></div></div>
      <div className="review-table">
        <ReviewItem icon={<BookOpen size={17} />} title="Structured output guarantees" field="Structured output" mode="True or false" due="Jul 16" strength={72} />
        <ReviewItem icon={<CircleHelp size={17} />} title="Reasoning effort tradeoffs" field="Model selection" mode="Multiple choice" due="Jul 16" strength={67} />
      </div>
    </div>
  );
}

function MasteryRow({ label, value, color, stale }: { label: string; value: number; color: string; stale?: boolean }) {
  return <div className="mastery-row"><div><span className={`concept-indicator ${color}`} />{label}{stale ? <span className="stale-tag">Changed</span> : null}</div><div className="mastery-track"><span className={color} style={{ width: `${value}%` }} /></div><strong>{value}%</strong></div>;
}

function ReviewLine({ time, title, kind }: { time: string; title: string; kind: string }) {
  return <div className="review-line"><span className="review-time">{time}</span><div><strong>{title}</strong><small>{kind}</small></div><ChevronRight size={16} /></div>;
}

function GraphNode({ className, label, value, state, icon }: { className: string; label: string; value: number; state: string; icon: React.ReactNode }) {
  return <button className={`graph-node ${className} ${state}`}><span className="node-icon">{icon}</span><span><strong>{label}</strong><small>{value}% mastery</small></span></button>;
}

function ReviewItem({ icon, title, field, mode, due, strength }: { icon: React.ReactNode; title: string; field: string; mode: string; due: string; strength: number }) {
  return <button className="review-item"><span className="review-kind-icon">{icon}</span><div className="review-title"><strong>{title}</strong><small>{field}</small></div><span className="mode-label">{mode}</span><div className="strength"><span><i style={{ width: `${strength}%` }} /></span><small>{strength}% strength</small></div><span className="due-label">{due}</span><ChevronRight size={17} /></button>;
}
