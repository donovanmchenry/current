"use client";

import {
  Activity,
  ArrowLeft,
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
  Plus,
  RotateCcw,
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
import { isDue, progressForPath, type PathProgress, type ReviewItem } from "@/lib/learning-runtime";
import { CreatePathDialog } from "./create-path-dialog";

type MapMode = "map" | "list";
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
const nodeTypes = { learning: LearningGraphNode } satisfies NodeTypes;

type LearningMapProps = {
  paths: LearningPath[];
  activePathId: string;
  queue: string[];
  progress: Record<string, PathProgress>;
  reviews: ReviewItem[];
  suggestedPathAdded: boolean;
  onContinueLesson: () => void;
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
  suggestedPathAdded,
  onContinueLesson,
  onOpenLesson,
  onQueuePath,
  onAddCustomPath,
  onRemoveCustomPath,
  onAddSuggestedPath,
  onStartReview,
  onApplyResearchUpdate,
}: LearningMapProps) {
  const [mapMode, setMapMode] = useState<MapMode>("map");
  const [selectedPathId, setSelectedPathId] = useState(activePathId);
  const [selectedConceptIndex, setSelectedConceptIndex] = useState(() => {
    const path = paths.find((candidate) => candidate.id === activePathId) ?? paths[0];
    return progressForPath(path, progress[path.id]).currentConceptIndex;
  });
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus>("ready");
  const [suggestionStatus, setSuggestionStatus] = useState<SuggestionStatus>(suggestedPathAdded ? "added" : "ready");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [compactGraph, setCompactGraph] = useState(false);
  const [createPathOpen, setCreatePathOpen] = useState(false);
  const [removePathId, setRemovePathId] = useState<string | null>(null);
  const mapBodyRef = useRef<HTMLDivElement>(null);
  const storageHydratedRef = useRef(false);

  const selectedPath = paths.find((path) => path.id === selectedPathId) ?? paths.find((path) => path.id === activePathId) ?? paths[0];
  const effectiveSuggestionStatus: SuggestionStatus = suggestedPathAdded ? "added" : suggestionStatus;
  const selectedProgress = progressForPath(selectedPath, progress[selectedPath.id]);
  const inspectedConceptIndex = Math.max(0, Math.min(selectedConceptIndex, selectedPath.concepts.length - 1));
  const inspectedConcept = selectedPath.concepts[inspectedConceptIndex];
  const inspectedConceptState = selectedProgress.completedConceptIndexes.includes(inspectedConceptIndex)
    ? "done"
    : inspectedConceptIndex === selectedProgress.currentConceptIndex ? "current" : "upcoming";
  const selectedPathIsActive = selectedPath.id === activePathId;
  const inspectedConceptLabel = inspectedConceptState === "done" ? "Completed" : inspectedConceptState === "current" ? (selectedPathIsActive ? "Current" : "Next") : "Upcoming";
  const plannedPath = paths.find((path) => path.id === queue[0]);
  const dueReviews = reviews.filter((review) => isDue(review) && paths.some((path) => path.id === review.pathId));
  const pendingUpdates = Number(proposalStatus === "ready") + Number(effectiveSuggestionStatus === "ready");
  const nodes = useMemo(
    () => createNodes(proposalStatus === "applied", paths, activePathId, queue, compactGraph),
    [activePathId, compactGraph, paths, proposalStatus, queue],
  );
  const edges = useMemo(() => createEdges(paths), [paths]);

  useEffect(() => {
    mapBodyRef.current?.scrollTo({ top: 0 });
  }, [mapMode]);

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

  const addSuggestedPath = () => {
    onAddSuggestedPath();
    setSuggestionStatus("added");
    setSelectedPathId(suggestedPath.id);
    setSelectedConceptIndex(0);
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
  };

  const addCustomPath = (path: LearningPath) => {
    onAddCustomPath(path);
    setSelectedPathId(path.id);
    setSelectedConceptIndex(0);
    setMapMode("map");
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
            <img src="/current-icon.svg" width="18" height="18" alt="" aria-hidden="true" />
            <strong>Current</strong>
          </span>
          <span className="map-toolbar-divider" aria-hidden="true" />
          <span className="map-toolbar-title"><Network size={15} /><span>Learning map</span></span>
        </div>
        <div className="map-view-switcher" role="tablist" aria-label="Learning map view">
          <button role="tab" aria-selected={mapMode === "map"} className={mapMode === "map" ? "active" : ""} onClick={() => setMapMode("map")}><Network size={14} /> Map</button>
          <button role="tab" aria-selected={mapMode === "list"} className={mapMode === "list" ? "active" : ""} onClick={() => setMapMode("list")}><List size={14} /> List</button>
        </div>
        <div className="map-toolbar-actions">
          <button className="create-path-button" aria-label="New path" onClick={() => setCreatePathOpen(true)}><Plus size={14} /><span>New path</span></button>
          <button className="map-return-button" aria-label="Continue lesson" onClick={onContinueLesson}><ArrowLeft size={14} /><span>Continue lesson</span></button>
        </div>
      </div>

      <div className="learning-map-body" ref={mapBodyRef}>
        <div className="map-primary">
          {mapMode === "map" ? (
            <div className="graph-canvas">
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
                <FitGraph version={`${proposalStatus}-${paths.map((path) => path.id).join(":")}-${compactGraph ? "compact" : "wide"}`} />
                <Background color="#242424" gap={28} size={1} />
                <Controls showInteractive={false} />
              </ReactFlow>
              <div className="graph-status"><span>{paths.length} paths</span><span>{paths.reduce((total, path) => total + path.concepts.length, 0)} concepts</span>{plannedPath ? <span>Next: {plannedPath.title}</span> : null}</div>
            </div>
          ) : (
            <ul className="learning-path-list" aria-label="Learning paths">
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
          )}
        </div>

        <aside className="research-rail">
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
            {selectedPath.sources?.length ? (
              <div className="selected-path-sources">
                <span>Sources</span>
                <ul>
                  {selectedPath.sources.map((source) => (
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

          <section className="research-activity">
            <div className="research-heading"><div><Activity size={15} /><span>Agent updates</span></div><small>{pendingUpdates ? `${pendingUpdates} pending` : "Up to date"}</small></div>

            <article className={`agent-activity-item ${proposalStatus}`}>
              <span className="activity-icon">{proposalStatus === "applied" ? <Check size={15} /> : proposalStatus === "dismissed" ? <X size={15} /> : <FileDiff size={15} />}</span>
              <div className="activity-content">
                <strong>{proposalStatus === "applied" ? "Compaction path updated" : proposalStatus === "dismissed" ? "Update dismissed" : "Compaction source changed"}</strong>
                <p>{proposalStatus === "applied" ? "A targeted recall review was added." : proposalStatus === "dismissed" ? "The existing path was left unchanged." : "One explanation can be made more precise."}</p>
                {proposalStatus === "ready" && !reviewOpen ? <button className="activity-action" onClick={() => setReviewOpen(true)}>Review update <ArrowRight size={12} /></button> : null}
                {proposalStatus === "dismissed" ? <button className="activity-action" onClick={() => setProposalStatus("ready")}><RotateCcw size={12} /> Restore</button> : null}
                {reviewOpen && proposalStatus === "ready" ? (
                  <div className="proposal-review">
                    <span>Proposed clarification</span>
                    <p>The compact item carries opaque model context, not a summary intended for people to read or edit.</p>
                    <a href="https://developers.openai.com/api/docs/guides/compaction" target="_blank" rel="noreferrer">Official source <ExternalLink size={11} /></a>
                    <div><button onClick={applyProposal}><Check size={12} /> Apply update</button><button onClick={() => { setProposalStatus("dismissed"); setReviewOpen(false); }}>Dismiss</button></div>
                  </div>
                ) : null}
              </div>
            </article>

            <article className={`agent-activity-item ${effectiveSuggestionStatus}`}>
              <span className="activity-icon">{effectiveSuggestionStatus === "added" ? <Check size={15} /> : effectiveSuggestionStatus === "dismissed" ? <X size={15} /> : <Sparkles size={15} />}</span>
              <div className="activity-content">
                <strong>{effectiveSuggestionStatus === "added" ? "Agent reliability added" : effectiveSuggestionStatus === "dismissed" ? "Suggestion dismissed" : "Suggested learning path"}</strong>
                <p>{effectiveSuggestionStatus === "added" ? "The new path is connected to recovery and evaluations." : effectiveSuggestionStatus === "dismissed" ? "The path can be restored later." : "Agent reliability shares four concepts with your current paths."}</p>
                {effectiveSuggestionStatus === "ready" ? <div className="suggestion-actions"><button onClick={addSuggestedPath}><CirclePlus size={12} /> Add path</button><button onClick={dismissSuggestion}>Dismiss</button></div> : null}
                {effectiveSuggestionStatus === "dismissed" ? <button className="activity-action" onClick={() => setSuggestionStatus("ready")}><RotateCcw size={12} /> Restore</button> : null}
              </div>
            </article>
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
