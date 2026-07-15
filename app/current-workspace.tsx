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
import { useEffect, useMemo, useRef, useState } from "react";
import { basePaths, suggestedPath } from "../lib/learning-catalog";
import type { LearningConcept, LearningPath } from "../lib/learning-path";
import {
  defaultProgress,
  defaultReviews,
  isStoredLearningPath,
  nextIncompleteConcept,
  pathWithProgress,
  progressForPath,
  type LearningRuntimeSnapshot,
  type PathProgress,
  type ReviewItem,
} from "../lib/learning-runtime";
import { scheduleReview } from "../lib/spaced-review";
import { LearningMap } from "./learning-map";

type Mode = "read" | "recall" | "apply" | "reflect";
type WorkspaceView = "lesson" | "map";
type Evaluation = {
  score: number;
  verdict: string;
  feedback: string;
  misconception: string | null;
  nextPrompt: string;
  mode: "live" | "demo";
};

const modeItems: { id: Mode; label: string; icon: typeof BookOpen }[] = [
  { id: "read", label: "Read", icon: BookOpen },
  { id: "recall", label: "Recall", icon: Brain },
  { id: "apply", label: "Apply", icon: Code2 },
  { id: "reflect", label: "Reflect", icon: NotebookPen },
];

const noteExcerpt = "Compaction preserves key prior state in an opaque item while using fewer tokens.";
const runtimeStorageKey = "current-learning-runtime-v1";

export function CurrentWorkspace() {
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("lesson");
  const [customPaths, setCustomPaths] = useState<LearningPath[]>([]);
  const [suggestedPathAdded, setSuggestedPathAdded] = useState(false);
  const [activePathId, setActivePathId] = useState("long-running");
  const [activeConceptIndex, setActiveConceptIndex] = useState(1);
  const [queue, setQueue] = useState<string[]>([]);
  const [progress, setProgress] = useState<Record<string, PathProgress>>(defaultProgress);
  const [reviews, setReviews] = useState<ReviewItem[]>(defaultReviews);
  const [notesByConcept, setNotesByConcept] = useState<Record<string, string>>({});
  const [reflectionsByConcept, setReflectionsByConcept] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<Mode>("read");
  const [recallAnswer, setRecallAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [supportMode, setSupportMode] = useState<"none" | "visual" | "example">("none");
  const [codeChoice, setCodeChoice] = useState<number | null>(null);
  const [codeChecked, setCodeChecked] = useState(false);
  const [recallPassed, setRecallPassed] = useState(false);
  const [applicationAnswer, setApplicationAnswer] = useState("");
  const [applicationChecked, setApplicationChecked] = useState(false);
  const [applicationPassed, setApplicationPassed] = useState(false);
  const [lessonFinished, setLessonFinished] = useState(false);
  const [scheduledReviewAt, setScheduledReviewAt] = useState<string | null>(null);
  const [completionNextIndex, setCompletionNextIndex] = useState<number | null>(null);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const hydrated = useRef(false);
  const lessonScrollRef = useRef<HTMLDivElement>(null);

  const rawPaths = useMemo(
    () => [...basePaths, ...(suggestedPathAdded ? [suggestedPath] : []), ...customPaths],
    [customPaths, suggestedPathAdded],
  );
  const paths = useMemo(() => rawPaths.map((path) => pathWithProgress(
    path,
    progress[path.id],
    reviews.filter((review) => review.pathId === path.id && new Date(review.dueAt).getTime() <= Date.now()).length,
    path.id === activePathId,
  )), [activePathId, progress, rawPaths, reviews]);
  const activePath = paths.find((path) => path.id === activePathId) ?? paths[0];
  const activeProgress = progressForPath(activePath, progress[activePath.id]);
  const safeConceptIndex = Math.max(0, Math.min(activeConceptIndex, activePath.concepts.length - 1));
  const activeConcept = activePath.concepts[safeConceptIndex];
  const conceptKey = `${activePath.id}:${safeConceptIndex}`;
  const notes = notesByConcept[conceptKey] ?? "";
  const reflection = reflectionsByConcept[conceptKey] ?? "";
  const activeSources = activePath.sources ?? [];
  const isCompactionLesson = activePath.id === "long-running" && safeConceptIndex === 1;
  const highlighted = isCompactionLesson && notes.includes(noteExcerpt);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(runtimeStorageKey) ?? "null") as Partial<LearningRuntimeSnapshot> | null;
        if (saved) {
          const savedCustomPaths = Array.isArray(saved.customPaths) ? saved.customPaths.filter(isStoredLearningPath).slice(0, 12) : [];
          setCustomPaths(savedCustomPaths);
          setSuggestedPathAdded(Boolean(saved.suggestedPathAdded));
          if (typeof saved.activePathId === "string") setActivePathId(saved.activePathId);
          if (Number.isInteger(saved.activeConceptIndex)) setActiveConceptIndex(saved.activeConceptIndex as number);
          if (Array.isArray(saved.queue)) setQueue(saved.queue.filter((pathId): pathId is string => typeof pathId === "string"));
          if (saved.progress && typeof saved.progress === "object") setProgress(sanitizeProgress(saved.progress));
          if (Array.isArray(saved.reviews)) setReviews(saved.reviews.filter(isStoredReview));
          if (saved.notes && typeof saved.notes === "object") setNotesByConcept(sanitizeTextRecord(saved.notes));
          if (saved.reflections && typeof saved.reflections === "object") setReflectionsByConcept(sanitizeTextRecord(saved.reflections));
        } else {
          const oldNotes = window.localStorage.getItem("current-notebook-v2") ?? "";
          const oldReflection = window.localStorage.getItem("current-reflection-v1") ?? "";
          const oldMap = JSON.parse(window.localStorage.getItem("current-learning-map-v1") ?? "null") as { customPaths?: unknown[]; plannedPathId?: unknown; suggestionStatus?: unknown } | null;
          if (oldNotes) setNotesByConcept({ "long-running:1": oldNotes });
          if (oldReflection) setReflectionsByConcept({ "long-running:1": oldReflection });
          if (Array.isArray(oldMap?.customPaths)) setCustomPaths(oldMap.customPaths.filter(isStoredLearningPath).slice(0, 12));
          if (typeof oldMap?.plannedPathId === "string") setQueue([oldMap.plannedPathId]);
          if (oldMap?.suggestionStatus === "added") setSuggestedPathAdded(true);
        }
      } catch {
        window.localStorage.removeItem(runtimeStorageKey);
      }
      hydrated.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const snapshot: LearningRuntimeSnapshot = {
      activePathId: activePath.id,
      activeConceptIndex: safeConceptIndex,
      queue,
      progress,
      reviews,
      customPaths,
      suggestedPathAdded,
      notes: notesByConcept,
      reflections: reflectionsByConcept,
    };
    window.localStorage.setItem(runtimeStorageKey, JSON.stringify(snapshot));
  }, [activePath.id, customPaths, notesByConcept, progress, queue, reflectionsByConcept, reviews, safeConceptIndex, suggestedPathAdded]);

  const modeIndex = modeItems.findIndex((item) => item.id === mode);
  const recallComplete = recallPassed || lessonFinished;
  const codePassed = (isCompactionLesson ? codeChecked && codeChoice === 1 : applicationPassed) || lessonFinished;

  const transitionToMode = (nextMode: Mode) => {
    if (nextMode === mode) return;
    lessonScrollRef.current?.scrollTo({ top: 0 });
    setMode(nextMode);
  };

  const setNotes = (value: string | ((current: string) => string)) => {
    setNotesByConcept((current) => ({
      ...current,
      [conceptKey]: typeof value === "function" ? value(current[conceptKey] ?? "") : value,
    }));
  };

  const setReflection = (value: string) => {
    setReflectionsByConcept((current) => ({ ...current, [conceptKey]: value }));
  };

  const addExcerptToNotes = () => {
    setNotes((value) => value.includes(noteExcerpt) ? value : value ? `${value}\n\n${noteExcerpt}` : noteExcerpt);
    setNotebookOpen(true);
  };

  const evaluateRecall = async () => {
    if (!recallAnswer.trim()) return;
    setIsEvaluating(true);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          answer: recallAnswer,
          concept: activeConcept.title,
          objective: activeConcept.objective,
          checkpoints: activeConcept.checkpoints ?? [],
        }),
      });
      if (!response.ok) throw new Error("Evaluation failed");
      const result = (await response.json()) as Evaluation;
      setEvaluation(result);
      if (result.score >= 75) setRecallPassed(true);
    } catch {
      const result = localEvaluation(recallAnswer, activeConcept);
      setEvaluation(result);
      if (result.score >= 75) setRecallPassed(true);
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetRecall = () => {
    setRecallAnswer("");
    setEvaluation(null);
    setRecallPassed(false);
  };

  const checkCode = () => {
    if (codeChoice === null) return;
    setCodeChecked(true);
  };

  const checkApplication = () => {
    const passed = applicationAnswer.trim().length >= 40;
    setApplicationChecked(true);
    setApplicationPassed(passed);
  };

  const finishAndSchedule = () => {
    const existingReview = reviews.find((review) => review.id === activeReviewId)
      ?? reviews.find((review) => review.pathId === activePath.id && review.conceptIndex === safeConceptIndex);
    const scheduled = scheduleReview(existingReview?.memory ?? { intervalDays: 1, ease: 2.5, repetitions: 0 }, 4);
    const review: ReviewItem = {
      id: existingReview?.id ?? `review-${activePath.id}-${safeConceptIndex}`,
      pathId: activePath.id,
      conceptIndex: safeConceptIndex,
      dueAt: scheduled.nextReview.toISOString(),
      memory: { intervalDays: scheduled.intervalDays, ease: scheduled.ease, repetitions: scheduled.repetitions },
      reason: "completion",
    };
    const currentProgress = progressForPath(activePath, progress[activePath.id]);
    const completedConceptIndexes = [...new Set([...currentProgress.completedConceptIndexes, safeConceptIndex])].sort((left, right) => left - right);
    const nextIndex = nextIncompleteConcept(activePath, { ...currentProgress, completedConceptIndexes }, safeConceptIndex);
    setProgress((current) => ({
      ...current,
      [activePath.id]: { currentConceptIndex: nextIndex ?? safeConceptIndex, completedConceptIndexes },
    }));
    setReviews((current) => [...current.filter((item) => item.id !== review.id && !(item.pathId === review.pathId && item.conceptIndex === review.conceptIndex)), review]);
    setScheduledReviewAt(review.dueAt);
    setCompletionNextIndex(nextIndex);
    setLessonFinished(true);
    setActiveReviewId(null);
  };

  const openLearningMap = () => {
    setNotebookOpen(false);
    setSourcesOpen(false);
    setSidebarOpen(false);
    setWorkspaceView("map");
  };

  const resetLessonActivity = (nextMode: Mode) => {
    setMode(nextMode);
    setRecallAnswer("");
    setEvaluation(null);
    setIsEvaluating(false);
    setSupportMode("none");
    setCodeChoice(null);
    setCodeChecked(false);
    setRecallPassed(false);
    setApplicationAnswer("");
    setApplicationChecked(false);
    setApplicationPassed(false);
    setLessonFinished(false);
    setScheduledReviewAt(null);
    setCompletionNextIndex(null);
    setActiveReviewId(null);
  };

  const openLesson = (pathId = activePath.id, conceptIndex = safeConceptIndex, nextMode: Mode = "read") => {
    const path = paths.find((candidate) => candidate.id === pathId) ?? activePath;
    const nextConceptIndex = Math.max(0, Math.min(path.concepts.length - 1, conceptIndex));
    const pathProgress = progressForPath(path, progress[path.id]);
    setActivePathId(path.id);
    setActiveConceptIndex(nextConceptIndex);
    if (!pathProgress.completedConceptIndexes.includes(nextConceptIndex)) {
      setProgress((current) => ({ ...current, [path.id]: { ...pathProgress, currentConceptIndex: nextConceptIndex } }));
    }
    setQueue((current) => current.filter((queuedPathId) => queuedPathId !== path.id));
    resetLessonActivity(nextMode);
    setSourcesOpen(false);
    setNotebookOpen(false);
    setSidebarOpen(false);
    setWorkspaceView("lesson");
    window.requestAnimationFrame(() => lessonScrollRef.current?.scrollTo({ top: 0 }));
  };

  const continueLesson = () => {
    const current = progressForPath(activePath, progress[activePath.id]);
    openLesson(activePath.id, current.currentConceptIndex);
  };

  const startReview = (review: ReviewItem) => {
    openLesson(review.pathId, review.conceptIndex, "recall");
    setActiveReviewId(review.id);
  };

  const continueAfterCompletion = () => {
    if (completionNextIndex !== null) {
      openLesson(activePath.id, completionNextIndex);
      return;
    }
    const queuedPath = paths.find((path) => path.id === queue[0]);
    if (queuedPath) {
      openLesson(queuedPath.id, progressForPath(queuedPath, progress[queuedPath.id]).currentConceptIndex);
      return;
    }
    openLearningMap();
  };

  const toggleQueue = (pathId: string) => {
    setQueue((current) => current.includes(pathId) ? current.filter((item) => item !== pathId) : [...current, pathId]);
  };

  const addCustomPath = (path: LearningPath) => {
    setCustomPaths((current) => [...current.filter((item) => item.id !== path.id), path]);
    setProgress((current) => ({ ...current, [path.id]: { currentConceptIndex: 0, completedConceptIndexes: [] } }));
  };

  const removeCustomPath = (pathId: string) => {
    setCustomPaths((current) => current.filter((path) => path.id !== pathId));
    setQueue((current) => current.filter((item) => item !== pathId));
    setReviews((current) => current.filter((review) => review.pathId !== pathId));
    setProgress((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== pathId)));
    if (activePath.id === pathId) {
      setActivePathId("long-running");
      setActiveConceptIndex(1);
    }
  };

  const addSuggestedPath = () => {
    setSuggestedPathAdded(true);
    setProgress((current) => ({ ...current, [suggestedPath.id]: progressForPath(suggestedPath) }));
  };

  const applyResearchUpdate = () => {
    const review: ReviewItem = {
      id: "review-research-long-running-1",
      pathId: "long-running",
      conceptIndex: 1,
      dueAt: new Date().toISOString(),
      memory: { intervalDays: 1, ease: 2.5, repetitions: 0 },
      reason: "research",
    };
    setReviews((current) => [...current.filter((item) => item.id !== review.id), review]);
  };

  return (
    <div className={`current-app ${workspaceView === "map" ? "map-view" : ""} ${notebookOpen ? "with-notebook" : ""}`}>
      {sidebarOpen ? <button className="overlay" aria-label="Close course outline" onClick={() => setSidebarOpen(false)} /> : null}
      <button className={`notebook-overlay ${notebookOpen ? "open" : ""}`} aria-label="Close notebook" aria-hidden={!notebookOpen} tabIndex={notebookOpen ? 0 : -1} onClick={() => setNotebookOpen(false)} />

      <aside className={`course-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <span className="sidebar-wordmark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/current-icon.svg" width="20" height="20" alt="" aria-hidden="true" />
            Current
          </span>
          <button className="icon-action mobile-only" onClick={() => setSidebarOpen(false)} aria-label="Close course outline"><X size={17} /></button>
        </div>
        <button className={`track-title ${workspaceView === "map" ? "active" : ""}`} aria-current={workspaceView === "map" ? "page" : undefined} onClick={openLearningMap}>
          <span className="track-icon"><FolderOpen size={16} /></span>
          <div><strong>{activePath.title}</strong><small>{activePath.concepts.length} concepts</small></div>
          <ChevronRight size={14} />
        </button>

        <ol className="concept-path">
          {activePath.concepts.map((concept, index) => {
            const conceptStatus = activeProgress.completedConceptIndexes.includes(index) ? "done" : index === activeProgress.currentConceptIndex ? "current" : "locked";
            return (
            <li className={`${conceptStatus} ${safeConceptIndex === index ? "selected" : ""}`} key={concept.title}>
              <button className="concept-row" aria-current={safeConceptIndex === index ? "page" : undefined} onClick={() => openLesson(activePath.id, index)}>
                <span className="concept-state">{conceptStatus === "done" ? <Check size={11} /> : index + 1}</span>
                <span>{concept.title}</span>
                {conceptStatus === "current" ? <span className="now-label">Now</span> : null}
              </button>
            </li>
          );})}
        </ol>

        <div className="sidebar-bottom">
          <div className={`sidebar-sources-viewport ${sourcesOpen ? "open" : ""}`} aria-hidden={!sourcesOpen}>
            <div className="sidebar-sources-drawer">
              <div className="sidebar-sources">
                <div className="sidebar-sources-heading"><span>Official sources</span><small>For this concept</small></div>
                {activeSources.map((source) => source.href ? (
                  <a href={source.href} target="_blank" rel="noreferrer" tabIndex={sourcesOpen ? 0 : -1} className="sidebar-source-item" key={source.id}>
                    <FileText size={14} /><span><strong>{source.title}</strong><small>{source.detail}</small></span><ExternalLink size={12} />
                  </a>
                ) : (
                  <div className="sidebar-source-item" key={source.id}><FileText size={14} /><span><strong>{source.title}</strong><small>{source.detail}</small></span></div>
                ))}
              </div>
            </div>
          </div>
          <button aria-expanded={sourcesOpen} onClick={() => setSourcesOpen((value) => !value)}><FileText size={15} /><span>Sources</span><small>{activeSources.length}</small><ChevronDown className={sourcesOpen ? "expanded" : ""} size={14} /></button>
        </div>
      </aside>

      <main className="learning-canvas">
        {workspaceView === "map" ? (
          <LearningMap
            paths={paths}
            activePathId={activePath.id}
            queue={queue}
            progress={progress}
            reviews={reviews}
            suggestedPathAdded={suggestedPathAdded}
            onContinueLesson={continueLesson}
            onOpenLesson={openLesson}
            onQueuePath={toggleQueue}
            onAddCustomPath={addCustomPath}
            onRemoveCustomPath={removeCustomPath}
            onAddSuggestedPath={addSuggestedPath}
            onStartReview={startReview}
            onApplyResearchUpdate={applyResearchUpdate}
          />
        ) : (
          <>
            <div className="lesson-toolbar">
              <div className="toolbar-start">
                <button className="icon-action mobile-only" aria-label="Open course outline" onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
                <span className="stage-count">Step {modeIndex + 1} of {modeItems.length}</span>
              </div>
              <div className={"mode-switcher mode-step-" + modeIndex} role="tablist" aria-label="Learning mode">
                  {modeItems.map((item) => {
                    const Icon = item.icon;
                    const locked = (item.id === "apply" && !recallComplete) || (item.id === "reflect" && !codePassed);
                    return (
                      <button
                        role="tab"
                        aria-selected={mode === item.id}
                        disabled={locked}
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
              <div className="mode-stage">
                {mode === "read" ? (isCompactionLesson
                  ? <ReadModule highlighted={highlighted} addToNotes={addExcerptToNotes} next={() => { setSupportMode("none"); transitionToMode("recall"); }} />
                  : <GenericReadModule concept={activeConcept} path={activePath} addToNotes={() => { setNotes((value) => value.includes(activeConcept.objective) ? value : value ? `${value}\n\n${activeConcept.objective}` : activeConcept.objective); setNotebookOpen(true); }} next={() => transitionToMode("recall")} />) : null}
                {mode === "recall" ? (
                  <RecallModule
                    concept={activeConcept}
                    compaction={isCompactionLesson}
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
                {mode === "apply" ? (isCompactionLesson ? (
                  <ApplyModule
                    choice={codeChoice}
                    setChoice={(choice) => { setCodeChoice(choice); setCodeChecked(false); }}
                    checked={codeChecked}
                    check={checkCode}
                    next={() => transitionToMode("reflect")}
                  />
                ) : (
                  <GenericApplyModule
                    concept={activeConcept}
                    answer={applicationAnswer}
                    setAnswer={(value) => { setApplicationAnswer(value); setApplicationChecked(false); setApplicationPassed(false); }}
                    checked={applicationChecked}
                    passed={applicationPassed}
                    check={checkApplication}
                    next={() => transitionToMode("reflect")}
                  />
                )) : null}
                {mode === "reflect" ? (
                  <ReflectModule
                    concept={activeConcept}
                    reflection={reflection}
                    setReflection={setReflection}
                    nextReview={scheduledReviewAt}
                    schedule={finishAndSchedule}
                    finished={lessonFinished}
                    nextLabel={completionNextIndex !== null ? `Continue to ${activePath.concepts[completionNextIndex]?.title}` : queue.length ? "Start next path" : "Return to map"}
                    continueNext={continueAfterCompletion}
                  />
                ) : null}
              </div>
            </div>
          </>
        )}
      </main>

      <aside className={`notebook-panel ${notebookOpen ? "open" : ""}`} aria-hidden={!notebookOpen}>
        <div className="notes-pane">
          <div className="note-document-title">
            <div><span>{activeConcept.title} notes</span><small>Saved on this device</small></div>
          </div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            tabIndex={notebookOpen ? 0 : -1}
            placeholder={`Write while you learn…\n\nExplain ${activeConcept.title.toLowerCase()} in your own words.`}
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

function sanitizeProgress(value: unknown): Record<string, PathProgress> {
  if (!value || typeof value !== "object") return defaultProgress;
  const entries = Object.entries(value).filter((entry): entry is [string, PathProgress] => {
    const item = entry[1] as Partial<PathProgress> | null;
    return Boolean(item && Number.isInteger(item.currentConceptIndex) && Array.isArray(item.completedConceptIndexes));
  });
  return { ...defaultProgress, ...Object.fromEntries(entries) };
}

function sanitizeTextRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

function isStoredReview(value: unknown): value is ReviewItem {
  if (!value || typeof value !== "object") return false;
  const review = value as Partial<ReviewItem>;
  return typeof review.id === "string"
    && typeof review.pathId === "string"
    && Number.isInteger(review.conceptIndex)
    && typeof review.dueAt === "string"
    && !Number.isNaN(new Date(review.dueAt).getTime())
    && (review.reason === "completion" || review.reason === "research")
    && Boolean(review.memory && typeof review.memory.intervalDays === "number" && typeof review.memory.ease === "number" && typeof review.memory.repetitions === "number");
}

function GenericReadModule({ concept, path, addToNotes, next }: { concept: LearningConcept; path: LearningPath; addToNotes: () => void; next: () => void }) {
  const checkpoints = concept.checkpoints?.length ? concept.checkpoints : [concept.objective];
  return (
    <article className="lesson-module read-module">
      <header className="module-header">
        <h1>{concept.title}</h1>
        <p>{concept.summary ?? concept.objective}</p>
      </header>
      <section className="concept-overview-objective">
        <span>Learning objective</span>
        <p>{concept.objective}</p>
      </section>
      <section className="concept-overview-checkpoints">
        <h2>Build the mental model</h2>
        <ol>
          {checkpoints.map((checkpoint, index) => <li key={checkpoint}><span>{index + 1}</span><strong>{checkpoint}</strong></li>)}
        </ol>
      </section>
      <section className="source-excerpt generic-source-note">
        <div className="excerpt-top"><span><FileText size={14} /> {path.sources?.length ? `${path.sources.length} source${path.sources.length === 1 ? "" : "s"} connected` : "Path objective"}</span></div>
        <blockquote>{concept.objective}</blockquote>
        <button className="excerpt-action" onClick={addToNotes}><Highlighter size={14} /> Add to notes</button>
      </section>
      <footer className="module-footer"><span>Next, reconstruct the idea without looking back.</span><button className="continue-button" onClick={next}>Start recall <ArrowRight size={15} /></button></footer>
    </article>
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
  concept: LearningConcept;
  compaction: boolean;
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
        <p>{props.compaction ? <>What triggers server-side compaction, what does it preserve, and what should the next request contain when using <code>previous_response_id</code>?</> : props.concept.objective}</p>
      </header>

      {props.supportMode === "visual" ? <VisualSupport concept={props.concept} compaction={props.compaction} /> : null}
      {props.supportMode === "example" ? <ExampleSupport concept={props.concept} compaction={props.compaction} /> : null}

      <label className="recall-input">
        <span>Your explanation</span>
        <textarea value={props.answer} onChange={(event) => props.setAnswer(event.target.value)} disabled={Boolean(props.evaluation)} placeholder={`Explain ${props.concept.title.toLowerCase()} without looking back…`} />
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
        {props.evaluation && !needsSupport ? <button className="continue-button" onClick={props.next}>Apply it <ArrowRight size={15} /></button> : <button className="continue-button" disabled={!props.answer.trim() || props.isEvaluating || Boolean(props.evaluation)} onClick={props.evaluate}>{props.isEvaluating ? "Checking…" : "Check understanding"}<Send size={14} /></button>}
      </footer>
    </article>
  );
}

function VisualSupport({ concept, compaction }: { concept: LearningConcept; compaction: boolean }) {
  const steps = compaction ? ["Watch token count", "Cross threshold", "Emit compact item", "Send new turn"] : concept.checkpoints?.slice(0, 4) ?? [concept.objective];
  return <div className="support-module"><span className="support-label">Visual sequence</span><div className="support-steps">{steps.map((step, index) => <div className="support-step-wrap" key={step}>{index ? <ChevronRight size={16} /> : null}<div><small>{index + 1}</small><strong>{step}</strong></div></div>)}</div><p>{compaction ? <>The compact item carries forward the useful state. With <code>previous_response_id</code>, your application adds only the new user message.</> : concept.summary ?? concept.objective}</p></div>;
}

function ExampleSupport({ concept, compaction }: { concept: LearningConcept; compaction: boolean }) {
  return <div className="support-module example-support"><span className="support-label">Concrete example</span><p>{compaction ? "Imagine a coding agent has completed 80 tool calls. The transcript crosses your token threshold. The server replaces older context with an opaque compact item, returns it in the stream, and continues. On the next turn, your app sends a new request with the previous response ID; it does not rebuild or prune the history itself." : `Imagine you need to use ${concept.title.toLowerCase()} in a real project. Start by identifying the decision described here: ${concept.objective}`}</p></div>;
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

function GenericApplyModule({ concept, answer, setAnswer, checked, passed, check, next }: { concept: LearningConcept; answer: string; setAnswer: (value: string) => void; checked: boolean; passed: boolean; check: () => void; next: () => void }) {
  return (
    <article className="lesson-module apply-module">
      <header className="module-header compact-header">
        <h1>Use {concept.title.toLowerCase()} in a concrete decision.</h1>
        <p>Describe a realistic situation, the choice you would make, and why this concept changes that choice.</p>
      </header>
      <label className="recall-input application-input"><span>Your application</span><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="In a real project, I would…" /><small>{answer.trim().length} characters</small></label>
      {checked ? <div className={passed ? "code-feedback success" : "code-feedback error"}>{passed ? <CheckCircle2 size={16} /> : <CircleHelp size={16} />}<p><strong>{passed ? "The concept is attached to a decision." : "Make the application more concrete."}</strong>{passed ? "You named enough context to revisit and challenge this choice later." : "Include the situation, your choice, and the reason behind it."}</p></div> : null}
      <footer className="module-footer"><span>Application turns recognition into usable knowledge.</span>{passed ? <button className="continue-button" onClick={next}>Reflect and schedule <ArrowRight size={15} /></button> : <button className="continue-button" disabled={!answer.trim()} onClick={check}>Check application <Play size={13} /></button>}</footer>
    </article>
  );
}

function ReflectModule({ concept, reflection, setReflection, nextReview, schedule, finished, nextLabel, continueNext }: { concept: LearningConcept; reflection: string; setReflection: (value: string) => void; nextReview: string | null; schedule: () => void; finished: boolean; nextLabel: string; continueNext: () => void }) {
  const reviewDate = nextReview ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(nextReview)) : null;
  return (
    <article className="lesson-module reflect-module">
      <header className="module-header compact-header">
        <h1>Connect it to something you would build.</h1>
        <p>What changed in your understanding of {concept.title.toLowerCase()}, and what would you watch for when using it?</p>
      </header>
      <label className="recall-input reflection-input"><span>Your reflection</span><textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="I would use this when…" /><small>Saved on this device.</small></label>
      <div className="session-summary">
        <div><Check size={14} /><span><strong>Read</strong>Source-backed mental model</span></div>
        <div><Check size={14} /><span><strong>Recalled</strong>{concept.objective}</span></div>
        <div><Check size={14} /><span><strong>Applied</strong>A concrete decision</span></div>
      </div>
      {reviewDate ? <div className="scheduled-state"><CheckCircle2 size={18} /><div><strong>Review scheduled for {reviewDate}</strong><span>You will reconstruct the idea without choices.</span></div></div> : null}
      <footer className="module-footer"><span>{reviewDate ? "Concept complete. Progress and review timing are saved." : "Finish with one effortful review tomorrow."}</span>{finished ? <button className="continue-button" onClick={continueNext}>{nextLabel}<ArrowRight size={14} /></button> : <button className="continue-button" disabled={!reflection.trim()} onClick={schedule}>Finish and schedule review<Check size={14} /></button>}</footer>
    </article>
  );
}

function localEvaluation(answer: string, concept: LearningConcept): Evaluation {
  if (concept.title !== "Compaction") return genericLocalEvaluation(answer, concept);
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

function genericLocalEvaluation(answer: string, concept: LearningConcept): Evaluation {
  const normalized = answer.toLowerCase();
  const rubric = [concept.objective, ...(concept.checkpoints ?? [])].join(" ").toLowerCase();
  const stopWords = new Set(["about", "after", "before", "between", "choose", "define", "explain", "from", "into", "that", "their", "this", "using", "what", "when", "where", "which", "while", "with", "without", "your"]);
  const rubricTerms = [...new Set(rubric.match(/[a-z][a-z0-9_-]{3,}/g) ?? [])].filter((word) => !stopWords.has(word));
  const matchedTerms = rubricTerms.filter((word) => normalized.includes(word));
  const coverage = rubricTerms.length ? matchedTerms.length / Math.min(rubricTerms.length, 8) : 0;
  const score = Math.min(94, Math.round(38 + Math.min(answer.trim().length, 160) / 5 + Math.min(coverage, 1) * 28));
  const passed = score >= 75;
  return {
    score,
    verdict: passed ? "You rebuilt the core idea" : "Add the missing relationship",
    feedback: passed ? "Your explanation connects the concept to its purpose in your own wording." : `Your answer is moving in the right direction. Explain how ${concept.title.toLowerCase()} changes a decision or outcome.`,
    misconception: passed ? null : concept.checkpoints?.find((checkpoint) => !normalized.includes(checkpoint.split(" ")[0].toLowerCase())) ?? concept.objective,
    nextPrompt: passed ? "Apply the idea to a concrete situation." : "Use the visual sequence, then try again.",
    mode: "demo",
  };
}
