"use client";

import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarClock,
  Check,
  CirclePlus,
  Clock3,
  ExternalLink,
  FileDiff,
  FileText,
  FolderOpen,
  Link2,
  List,
  Network,
  NotebookPen,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
  useReactFlow,
} from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { suggestedPath } from "@/lib/learning-catalog";
import type { LearningPath } from "@/lib/learning-path";
import { isDue, progressForPath, type LearnerProfile, type PathProgress, type ReviewItem } from "@/lib/learning-runtime";
import { CreatePathDialog } from "./create-path-dialog";

type MapMode = "map" | "list" | "updates" | "notes";
type MapTransitionDirection = "forward" | "backward";
type ProposalStatus = "ready" | "applied" | "dismissed";
type SuggestionStatus = "ready" | "added" | "dismissed";

type LearningNodeData = Record<string, unknown> & {
  title: string;
  detail: string;
  pathId: string;
  progress?: number;
  current?: boolean;
  changed?: boolean;
  changeLabel?: "Added" | "Created" | "Updated";
  queuePosition?: number;
};

type LearningNode = Node<LearningNodeData, "learning">;

const mapUiStorageKey = "current-learning-map-ui-v2";
const mapModeOrder: MapMode[] = ["map", "list", "updates", "notes"];
const nodeTypes = { learning: LearningGraphNode } satisfies NodeTypes;

type LearningMapProps = {
  paths: LearningPath[];
  activePathId: string;
  queue: string[];
  progress: Record<string, PathProgress>;
  reviews: ReviewItem[];
  notesByConcept: Record<string, string>;
  learnerProfile: LearnerProfile;
  suggestedPathAdded: boolean;
  researchUpdateApplied: boolean;
  onOpenLesson: (pathId: string, conceptIndex: number) => void;
  onQueuePath: (pathId: string) => void;
  onAddCustomPath: (path: LearningPath) => void;
  onRemoveCustomPath: (pathId: string) => void;
  onAddSuggestedPath: () => void;
  onStartReview: (review: ReviewItem) => void;
  onApplyResearchUpdate: () => void;
};

export function LearningMap({
  paths,
  activePathId,
  queue,
  progress,
  reviews,
  notesByConcept,
  learnerProfile,
  suggestedPathAdded,
  researchUpdateApplied,
  onOpenLesson,
  onQueuePath,
  onAddCustomPath,
  onRemoveCustomPath,
  onAddSuggestedPath,
  onStartReview,
  onApplyResearchUpdate,
}: LearningMapProps) {
  const [mapMode, setMapMode] = useState<MapMode>("map");
  const [mapTransitionDirection, setMapTransitionDirection] = useState<MapTransitionDirection>("forward");
  const [selectedPathId, setSelectedPathId] = useState(activePathId);
  const [selectedConceptIndex, setSelectedConceptIndex] = useState(() => {
    const path = paths.find((candidate) => candidate.id === activePathId) ?? paths[0];
    return progressForPath(path, progress[path.id]).currentConceptIndex;
  });
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus>(researchUpdateApplied ? "applied" : "ready");
  const [suggestionStatus, setSuggestionStatus] = useState<SuggestionStatus>(suggestedPathAdded ? "added" : "ready");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [compactGraph, setCompactGraph] = useState(false);
  const [createPathOpen, setCreatePathOpen] = useState(false);
  const [noteQuery, setNoteQuery] = useState("");
  const [removePathId, setRemovePathId] = useState<string | null>(null);
  const storageHydratedRef = useRef(false);

  const selectedPath = paths.find((path) => path.id === selectedPathId) ?? paths.find((path) => path.id === activePathId) ?? paths[0];
  const effectiveSuggestionStatus: SuggestionStatus = suggestedPathAdded ? "added" : suggestionStatus;
  const effectiveProposalStatus: ProposalStatus = researchUpdateApplied ? "applied" : proposalStatus;
  const selectedProgress = progressForPath(selectedPath, progress[selectedPath.id]);
  const inspectedConceptIndex = Math.max(0, Math.min(selectedConceptIndex, selectedPath.concepts.length - 1));
  const inspectedConcept = selectedPath.concepts[inspectedConceptIndex];
  const inspectedSources = (selectedPath.sources ?? []).filter((source) => inspectedConcept.sourceIds === undefined || inspectedConcept.sourceIds.includes(source.id));
  const inspectedConceptState = selectedProgress.completedConceptIndexes.includes(inspectedConceptIndex)
    ? "done"
    : inspectedConceptIndex === selectedProgress.currentConceptIndex ? "current" : "upcoming";
  const selectedPathIsActive = selectedPath.id === activePathId;
  const inspectedConceptLabel = inspectedConceptState === "done" ? "Completed" : inspectedConceptState === "current" ? (selectedPathIsActive ? "Current" : "Next") : "Upcoming";
  const plannedPath = paths.find((path) => path.id === queue[0]);
  const dueReviews = reviews.filter((review) => isDue(review) && paths.some((path) => path.id === review.pathId));
  const pendingUpdates = Number(effectiveProposalStatus === "ready") + Number(effectiveSuggestionStatus === "ready");
  const fullViewActive = mapMode === "updates" || mapMode === "notes";
  const noteEntries = useMemo(() => paths.flatMap((path) => path.concepts.flatMap((concept, conceptIndex) => {
    const text = notesByConcept[`${path.id}:${conceptIndex}`]?.trim();
    return text ? [{ path, concept, conceptIndex, text }] : [];
  })), [notesByConcept, paths]);
  const filteredNotes = useMemo(() => {
    const query = noteQuery.trim().toLowerCase();
    return query ? noteEntries.filter((entry) => `${entry.path.title} ${entry.concept.title} ${entry.text}`.toLowerCase().includes(query)) : noteEntries;
  }, [noteEntries, noteQuery]);
  const nodes = useMemo(
    () => createNodes(effectiveProposalStatus === "applied", paths, activePathId, queue, compactGraph),
    [activePathId, compactGraph, effectiveProposalStatus, paths, queue],
  );
  const edges = useMemo(() => createEdges(paths), [paths]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const syncGraphLayout = () => setCompactGraph(media.matches);
    syncGraphLayout();
    media.addEventListener("change", syncGraphLayout);
    return () => media.removeEventListener("change", syncGraphLayout);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(mapUiStorageKey) ?? "null") as {
          proposalStatus?: ProposalStatus;
          suggestionStatus?: SuggestionStatus;
        } | null;
        if (saved?.proposalStatus && ["ready", "applied", "dismissed"].includes(saved.proposalStatus)) setProposalStatus(saved.proposalStatus);
        if (!suggestedPathAdded && saved?.suggestionStatus && ["ready", "dismissed"].includes(saved.suggestionStatus)) setSuggestionStatus(saved.suggestionStatus);
      } catch {
        window.localStorage.removeItem(mapUiStorageKey);
      } finally {
        storageHydratedRef.current = true;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [suggestedPathAdded]);

  useEffect(() => {
    if (!storageHydratedRef.current) return;
    window.localStorage.setItem(mapUiStorageKey, JSON.stringify({ proposalStatus, suggestionStatus }));
  }, [proposalStatus, suggestionStatus]);

  const selectPath = (pathId: string) => {
    setSelectedPathId(pathId);
    const path = paths.find((item) => item.id === pathId);
    if (path) setSelectedConceptIndex(progressForPath(path, progress[path.id]).currentConceptIndex);
  };

  const switchMapMode = (nextMode: MapMode) => {
    if (nextMode === mapMode) return;
    setMapTransitionDirection(mapModeOrder.indexOf(nextMode) > mapModeOrder.indexOf(mapMode) ? "forward" : "backward");
    setMapMode(nextMode);
  };

  const addSuggestedPath = () => {
    onAddSuggestedPath();
    setSuggestionStatus("added");
    setSelectedPathId(suggestedPath.id);
    setSelectedConceptIndex(0);
    switchMapMode("map");
  };

  const dismissSuggestion = () => {
    setSuggestionStatus("dismissed");
    if (selectedPathId === suggestedPath.id) selectPath(activePathId);
  };

  const applyProposal = () => {
    setProposalStatus("applied");
    setReviewOpen(false);
    setSelectedPathId("long-running");
    setSelectedConceptIndex(1);
    onApplyResearchUpdate();
    switchMapMode("map");
  };

  const openUpdatedPath = (pathId: string, conceptIndex: number) => {
    setSelectedPathId(pathId);
    setSelectedConceptIndex(conceptIndex);
    switchMapMode("map");
  };

  const addCustomPath = (path: LearningPath) => {
    onAddCustomPath(path);
    setSelectedPathId(path.id);
    setSelectedConceptIndex(0);
    switchMapMode("map");
    setCreatePathOpen(false);
  };

  const removeCustomPath = (pathId: string) => {
    onRemoveCustomPath(pathId);
    setSelectedPathId(activePathId === pathId ? "long-running" : activePathId);
    setSelectedConceptIndex(activePathId === pathId ? 1 : 0);
    setRemovePathId(null);
  };

  return (
    <section className="learning-map-shell" aria-label="Learning map">
      <div className="map-toolbar">
        <div className="map-toolbar-start">
          <span className="map-wordmark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/current-icon.png" width="18" height="18" alt="" aria-hidden="true" />
            <strong>Current</strong>
          </span>
          <span className="map-toolbar-divider" aria-hidden="true" />
          <span className="map-toolbar-title"><Network size={15} /><span>Learning map</span></span>
        </div>
        <div className={`map-view-switcher mode-${mapMode}`} role="tablist" aria-label="Learning map view">
          <button role="tab" aria-selected={mapMode === "map"} className={mapMode === "map" ? "active" : ""} onClick={() => switchMapMode("map")}><Network size={14} /> Map</button>
          <button role="tab" aria-selected={mapMode === "list"} className={mapMode === "list" ? "active" : ""} onClick={() => switchMapMode("list")}><List size={14} /> List</button>
          <button role="tab" aria-label={pendingUpdates ? `Updates, ${pendingUpdates} pending` : "Updates"} aria-selected={mapMode === "updates"} className={[mapMode === "updates" ? "active" : "", pendingUpdates ? "updates-pending" : ""].filter(Boolean).join(" ")} onClick={() => switchMapMode("updates")}><Activity size={14} aria-hidden="true" /> Updates</button>
          <button role="tab" aria-selected={mapMode === "notes"} className={mapMode === "notes" ? "active" : ""} onClick={() => switchMapMode("notes")}><NotebookPen size={14} /> Notes{noteEntries.length ? <span className="updates-tab-count">{noteEntries.length}</span> : null}</button>
        </div>
        <div className="map-toolbar-actions">
          <button className="create-path-button" aria-label="New path" onClick={() => setCreatePathOpen(true)}><Plus size={14} /><span>New path</span></button>
        </div>
      </div>

      <div className={`learning-map-body map-transition-${mapTransitionDirection} ${fullViewActive ? "map-full-mode" : ""}`}>
        <div className={`map-full-view ${fullViewActive ? "active" : ""}`} aria-hidden={!fullViewActive}>
        {mapMode === "updates" ? (
          <section className="agent-updates-view map-view-enter" aria-label="Agent updates">
            <header className="agent-updates-header">
              <div><h1>Agent updates</h1><p>Source changes and path suggestions awaiting your decision.</p></div>
              <span>{pendingUpdates ? `${pendingUpdates} pending` : "Up to date"}</span>
            </header>

            <div className="agent-updates-feed">
              <article className={`agent-update-row ${effectiveProposalStatus}`}>
                <span className="agent-update-row-icon">{effectiveProposalStatus === "applied" ? <Check size={17} /> : effectiveProposalStatus === "dismissed" ? <X size={17} /> : <FileDiff size={17} />}</span>
                <div className="agent-update-row-content">
                  <small>Source change</small>
                  <h2>{effectiveProposalStatus === "applied" ? "Compaction path updated" : effectiveProposalStatus === "dismissed" ? "Update dismissed" : "Compaction source changed"}</h2>
                  <p>{effectiveProposalStatus === "applied" ? "The Compaction evidence and recall checkpoints now reflect the clarification." : effectiveProposalStatus === "dismissed" ? "The existing path was left unchanged." : "The official guide now makes one detail more precise."}</p>
                  {effectiveProposalStatus === "ready" && !reviewOpen ? <button className="activity-action" onClick={() => setReviewOpen(true)}>Review update <ArrowRight size={12} /></button> : null}
                  {effectiveProposalStatus === "applied" ? <button className="activity-action" onClick={() => openUpdatedPath("long-running", 1)}>View Compaction <ArrowRight size={12} /></button> : null}
                  {effectiveProposalStatus === "dismissed" ? <button className="activity-action" onClick={() => setProposalStatus("ready")}><RotateCcw size={12} /> Restore</button> : null}
                  {reviewOpen && effectiveProposalStatus === "ready" ? (
                    <div className="proposal-review agent-update-review">
                      <span>Proposed clarification</span>
                      <p>The compact item carries opaque model context, not a summary intended for people to read or edit.</p>
                      <a href="https://developers.openai.com/api/docs/guides/compaction" target="_blank" rel="noreferrer">Official source <ExternalLink size={11} /></a>
                      <div><button onClick={applyProposal}><Check size={12} /> Apply update</button><button onClick={() => { setProposalStatus("dismissed"); setReviewOpen(false); }}>Dismiss</button></div>
                    </div>
                  ) : null}
                </div>
              </article>

              <article className={`agent-update-row ${effectiveSuggestionStatus}`}>
                <span className="agent-update-row-icon">{effectiveSuggestionStatus === "added" ? <Check size={17} /> : effectiveSuggestionStatus === "dismissed" ? <X size={17} /> : <Sparkles size={17} />}</span>
                <div className="agent-update-row-content">
                  <small>Path suggestion</small>
                  <h2>{effectiveSuggestionStatus === "added" ? "Agent reliability added" : effectiveSuggestionStatus === "dismissed" ? "Suggestion dismissed" : "Agent reliability"}</h2>
                  <p>{effectiveSuggestionStatus === "added" ? "The path is connected to recovery patterns and agent evaluations." : effectiveSuggestionStatus === "dismissed" ? "The path can be restored later." : "Four concepts connect tool failures, retries, handoffs, and reliability budgets."}</p>
                  {effectiveSuggestionStatus === "ready" ? <div className="suggestion-actions"><button onClick={addSuggestedPath}><CirclePlus size={12} /> Add path</button><button onClick={dismissSuggestion}>Dismiss</button></div> : null}
                  {effectiveSuggestionStatus === "added" ? <button className="activity-action" onClick={() => openUpdatedPath(suggestedPath.id, 0)}>View path <ArrowRight size={12} /></button> : null}
                  {effectiveSuggestionStatus === "dismissed" ? <button className="activity-action" onClick={() => setSuggestionStatus("ready")}><RotateCcw size={12} /> Restore</button> : null}
                </div>
              </article>
            </div>
          </section>
        ) : mapMode === "notes" ? (
          <section className="notes-index-view map-view-enter" aria-label="Learning notes">
            <header className="notes-index-header">
              <div><h1>Notes</h1><p>Ideas captured across every learning path.</p></div>
              <span>{noteEntries.length} note{noteEntries.length === 1 ? "" : "s"} · {learnerProfile.recallAttempts} recall{learnerProfile.recallAttempts === 1 ? "" : "s"}</span>
            </header>
            <label className="notes-search"><Search size={15} /><input value={noteQuery} onChange={(event) => setNoteQuery(event.target.value)} placeholder="Search notes" aria-label="Search notes" /></label>
            <div className="notes-index-list">
              {filteredNotes.length ? filteredNotes.map((entry) => (
                <article className="notes-index-row" key={`${entry.path.id}-${entry.conceptIndex}`}>
                  <span className="notes-index-icon"><NotebookPen size={16} /></span>
                  <div><small>{entry.path.title}</small><h2>{entry.concept.title}</h2><p>{entry.text}</p><button className="activity-action" onClick={() => onOpenLesson(entry.path.id, entry.conceptIndex)}>Open lesson <ArrowRight size={12} /></button></div>
                </article>
              )) : <div className="notes-index-empty"><NotebookPen size={18} /><strong>{noteQuery ? "No matching notes" : "No notes yet"}</strong><p>{noteQuery ? "Try another search." : "Add a note from any lesson and it will appear here."}</p></div>}
            </div>
          </section>
        ) : null}
        </div>

        <div className={`map-primary ${fullViewActive ? "workspace-hidden" : "workspace-active"}`}>
            <div className={`graph-canvas map-surface ${mapMode === "map" ? "active" : ""}`} aria-hidden={mapMode !== "map"}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable
                fitView
                fitViewOptions={{ padding: 0.15, maxZoom: 1.05 }}
                minZoom={0.32}
                maxZoom={1.35}
                onNodeClick={(_, node) => selectPath(node.data.pathId)}
                aria-label="Connected learning paths"
              >
                <FitGraph version={`${effectiveProposalStatus}-${paths.map((path) => path.id).join(":")}-${compactGraph ? "compact" : "wide"}`} />
                <Background color="#242424" gap={28} size={1} />
                <Controls showInteractive={false} />
              </ReactFlow>
              <div className="graph-status"><span>{paths.length} paths</span><span>{paths.reduce((total, path) => total + path.concepts.length, 0)} concepts</span>{plannedPath ? <span>Next: {plannedPath.title}</span> : null}</div>
            </div>
            <ul className={`learning-path-list map-surface ${mapMode === "list" ? "active" : ""}`} aria-hidden={mapMode !== "list"} aria-label="Learning paths">
              {paths.map((path) => {
                const queuePosition = queue.indexOf(path.id);
                return (
                  <li key={path.id}>
                    <button className={selectedPath.id === path.id ? "selected" : ""} onClick={() => selectPath(path.id)}>
                      <span className="path-list-icon"><FolderOpen size={17} /></span>
                      <span className="path-list-copy"><strong>{path.title}{queuePosition >= 0 ? <em>{queuePosition === 0 ? "Next" : `Queued ${queuePosition + 1}`}</em> : null}</strong><small>{path.description}</small></span>
                      <span className="path-list-progress"><span><i style={{ width: `${path.progress}%` }} /></span><small>{path.progress}% · {path.concepts.length} concepts</small></span>
                      <ArrowRight size={15} />
                    </button>
                  </li>
                );
              })}
            </ul>
        </div>

        <aside className={`research-rail map-rail-enter ${fullViewActive ? "workspace-hidden" : "workspace-active"}`}>
          <section className="selected-path-panel">
            <span className="rail-label">Selected path</span>
            <div className="selected-path-title"><FolderOpen size={16} /><div><strong>{selectedPath.title}</strong><small>{selectedPath.status}</small></div></div>
            <p>{selectedPath.description}</p>
            <div className="selected-path-progress"><span><i style={{ width: `${selectedPath.progress}%` }} /></span><small>{selectedPath.progress}% mastered</small></div>
            <div className="selected-path-next"><Clock3 size={13} /><span>Next</span><strong>{selectedPath.next}</strong></div>
            <div className="selected-path-outline">
              <div className="selected-path-outline-heading"><span>Concepts</span><small>{inspectedConceptIndex + 1} of {selectedPath.concepts.length}</small></div>
              <ol>
                {selectedPath.concepts.map((concept, index) => {
                  const conceptState = selectedProgress.completedConceptIndexes.includes(index) ? "done" : index === selectedProgress.currentConceptIndex ? "current" : "upcoming";
                  const conceptLabel = conceptState === "done" ? "Completed" : conceptState === "current" ? (selectedPathIsActive ? "Current" : "Next") : "Upcoming";
                  return (
                    <li className={`${conceptState} ${inspectedConceptIndex === index ? "selected" : ""}`} key={`${selectedPath.id}-${concept.title}`}>
                      <button aria-pressed={inspectedConceptIndex === index} onClick={() => setSelectedConceptIndex(index)}>
                        <span>{conceptState === "done" ? <Check size={10} /> : index + 1}</span>
                        <div><strong>{concept.title}</strong><small>{conceptLabel}</small></div>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="selected-concept-detail">
                <span>{inspectedConceptLabel}</span>
                <strong>{inspectedConcept.title}</strong>
                <p>{inspectedConcept.objective}</p>
              </div>
            </div>
            {inspectedSources.length ? (
              <div className="selected-path-sources">
                <span>Sources</span>
                <ul>
                  {inspectedSources.map((source) => (
                    <li key={source.id}>
                      {source.kind === "link" ? <Link2 size={12} /> : <FileText size={12} />}
                      {source.href ? <a href={source.href} target="_blank" rel="noreferrer"><strong>{source.title}</strong><small>{source.detail}</small></a> : <div><strong>{source.title}</strong><small>{source.detail}</small></div>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <button className="rail-primary-action" onClick={() => onOpenLesson(selectedPath.id, inspectedConceptIndex)}><BookOpen size={14} /> {inspectedConceptState === "done" ? "Review" : inspectedConceptState === "current" && selectedPathIsActive ? "Continue" : "Start"} {inspectedConcept.title}</button>
            {selectedPath.id !== activePathId ? (
              <button className="rail-queue-action" onClick={() => onQueuePath(selectedPath.id)}><Clock3 size={13} />{queue.includes(selectedPath.id) ? "Remove from queue" : "Set as next"}</button>
            ) : null}
            {selectedPath.userCreated ? (
              removePathId === selectedPath.id ? (
                <div className="remove-path-confirm"><span>Remove this path?</span><div><button onClick={() => removeCustomPath(selectedPath.id)}>Remove</button><button onClick={() => setRemovePathId(null)}>Cancel</button></div></div>
              ) : (
                <button className="remove-path-button" onClick={() => setRemovePathId(selectedPath.id)}><Trash2 size={13} /> Remove path</button>
              )
            ) : null}
          </section>

          <section className="review-queue" aria-label="Review queue">
            <div className="research-heading"><div><CalendarClock size={15} /><span>Review queue</span></div><small>{dueReviews.length} due</small></div>
            {dueReviews.length ? dueReviews.map((review) => {
              const path = paths.find((candidate) => candidate.id === review.pathId);
              const concept = path?.concepts[review.conceptIndex];
              if (!path || !concept) return null;
              return (
                <button className="review-queue-item" onClick={() => onStartReview(review)} key={review.id}>
                  <span><strong>{concept.title}</strong><small>{path.title}{review.reason === "research" ? " · Source updated" : ""}</small></span>
                  <ArrowRight size={13} />
                </button>
              );
            }) : <p className="review-queue-empty">Nothing due. Completed concepts will return here.</p>}
          </section>

        </aside>
      </div>
      <CreatePathDialog open={createPathOpen} onClose={() => setCreatePathOpen(false)} onCreate={addCustomPath} />
    </section>
  );
}

function FitGraph({ version }: { version: string }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    let frame = 0;
    const refit = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        void fitView({ padding: 0.15, maxZoom: 1.05, duration: 240 });
      });
    };

    refit();
    window.addEventListener("resize", refit);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", refit);
    };
  }, [fitView, version]);

  return null;
}

function LearningGraphNode({ data, selected }: NodeProps<LearningNode>) {
  const className = [
    "learning-graph-node",
    "path",
    selected ? "selected" : "",
    data.current ? "current" : "",
    data.changed ? "changed" : "",
    data.queuePosition ? "planned" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={className}>
      <Handle id="left" type="target" position={Position.Left} className="learning-node-handle" />
      <Handle id="top" type="target" position={Position.Top} className="learning-node-handle" />
      <div className="graph-node-heading">
        <span><FolderOpen size={14} /></span>
        <strong>{data.title}</strong>
      </div>
      <small>{data.detail}</small>
      {typeof data.progress === "number" ? <div className="graph-node-progress"><i style={{ width: `${data.progress}%` }} /></div> : null}
      {data.changed ? <span className="node-change-label"><Sparkles size={10} /> {data.changeLabel ?? "Updated"}</span> : null}
      {data.queuePosition ? <span className="node-plan-label"><Clock3 size={10} /> {data.queuePosition === 1 ? "Next" : `Queue ${data.queuePosition}`}</span> : null}
      <Handle id="right" type="source" position={Position.Right} className="learning-node-handle" />
      <Handle id="bottom" type="source" position={Position.Bottom} className="learning-node-handle" />
    </div>
  );
}

function createNodes(updateApplied: boolean, paths: LearningPath[], activePathId: string, queue: string[], compact: boolean): LearningNode[] {
  const order = new Map([["responses-api", 0], ["long-running", 1], ["agent-evals", 2], ["agent-reliability", 3]]);
  const orderedPaths = [...paths].sort((left, right) => (order.get(left.id) ?? 10) - (order.get(right.id) ?? 10));

  return orderedPaths.map((path, index) => {
    const position = compact
      ? { x: index % 2 === 0 ? 25 : 125, y: 20 + index * 140 }
      : { x: index % 2 === 0 ? 30 : 275, y: 80 + index * 180 };
    const isUpdated = path.id === "long-running" && updateApplied;
    const isSuggested = path.id === "agent-reliability";
    const sourceCount = path.sources?.length ?? 0;
    const detail = path.userCreated
      ? `${sourceCount ? `${sourceCount} source${sourceCount === 1 ? "" : "s"} · ` : ""}${path.concepts.length} concepts`
      : path.id === activePathId
        ? `Current path · ${path.concepts.length} concepts`
        : `${path.progress}% mastered · ${path.concepts.length} concepts`;
    const queueIndex = queue.indexOf(path.id);

    return {
      id: `path-${path.id}`,
      type: "learning",
      position,
      ariaLabel: `${path.title} learning path`,
      data: {
        title: path.title,
        detail,
        pathId: path.id,
        progress: path.progress,
        current: path.id === activePathId,
        changed: isUpdated || isSuggested || Boolean(path.userCreated),
        changeLabel: path.userCreated ? "Created" : isSuggested ? "Added" : isUpdated ? "Updated" : undefined,
        queuePosition: queueIndex >= 0 ? queueIndex + 1 : undefined,
      },
    } satisfies LearningNode;
  });
}

function createEdges(paths: LearningPath[]): Edge[] {
  const pathIds = new Set(paths.map((path) => path.id));
  const edges: Edge[] = [
    { id: "responses-long", source: "path-responses-api", sourceHandle: "right", target: "path-long-running", targetHandle: "left", label: "foundation", type: "smoothstep", className: "learning-edge" },
    { id: "long-evals", source: "path-long-running", sourceHandle: "bottom", target: "path-agent-evals", targetHandle: "top", label: "shared state", type: "smoothstep", className: "learning-edge" },
  ];

  if (pathIds.has("agent-reliability")) edges.push({ id: "long-reliability", source: "path-long-running", sourceHandle: "bottom", target: "path-agent-reliability", targetHandle: "top", label: "recommended", type: "smoothstep", className: "learning-edge suggested" });
  for (const path of paths.filter((candidate) => candidate.userCreated && candidate.relatedPathId && pathIds.has(candidate.relatedPathId))) {
    edges.push({ id: `related-${path.id}`, source: `path-${path.relatedPathId}`, sourceHandle: "bottom", target: `path-${path.id}`, targetHandle: "top", label: "related", type: "smoothstep", className: "learning-edge suggested" });
  }
  return edges;
}
