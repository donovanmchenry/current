"use client";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CirclePlus,
  Clock3,
  ExternalLink,
  FileDiff,
  FileText,
  FolderOpen,
  Link2,
  List,
  Menu,
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

import { CreatePathDialog } from "./create-path-dialog";
import type { LearningPath } from "@/lib/learning-path";

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
  planned?: boolean;
};

type LearningNode = Node<LearningNodeData, "learning">;

const basePaths: LearningPath[] = [
  {
    id: "long-running",
    title: "Long-running agents",
    description: "Context, compaction, chaining, and recovery for agents that work across many turns.",
    progress: 38,
    concepts: [
      { title: "Conversation state", objective: "Explain what state a long-running agent must carry between turns." },
      { title: "Compaction", objective: "Explain when compaction runs and what its opaque item preserves." },
      { title: "Stateless chaining", objective: "Choose the correct next request shape when using previous_response_id." },
      { title: "Recovery patterns", objective: "Recover an interrupted agent without replaying unnecessary context." },
      { title: "Implementation check", objective: "Configure and verify compaction in a working agent loop." },
    ],
    next: "Compaction",
    status: "In progress",
  },
  {
    id: "responses-api",
    title: "Responses API foundations",
    description: "The request, response, tool, and state primitives behind OpenAI agent systems.",
    progress: 64,
    concepts: [
      { title: "Response objects", objective: "Read the core state carried by a response object." },
      { title: "Tool calls", objective: "Connect model tool requests to application-side execution." },
      { title: "Structured outputs", objective: "Constrain model output to a validated schema." },
      { title: "Error recovery", objective: "Handle failed requests and tool results without losing state." },
    ],
    next: "Error recovery",
    status: "2 reviews due",
  },
  {
    id: "agent-evals",
    title: "Agent evaluations",
    description: "Build repeatable evaluation sets for reasoning traces, tools, and multi-step outcomes.",
    progress: 21,
    concepts: [
      { title: "Eval design", objective: "Define an evaluation around a concrete agent behavior." },
      { title: "Trace grading", objective: "Grade the decisions and tool use inside an agent trace." },
      { title: "Regression sets", objective: "Turn representative failures into repeatable tests." },
      { title: "Failure taxonomies", objective: "Classify failures precisely enough to guide fixes." },
      { title: "Human review", objective: "Place human judgment where automated grading is insufficient." },
      { title: "Release gates", objective: "Use evaluation results to make a release decision." },
    ],
    next: "Trace grading",
    status: "In progress",
  },
];

const suggestedPath: LearningPath = {
  id: "agent-reliability",
  title: "Agent reliability",
  description: "Turn tool failures, recovery patterns, and evaluations into resilient production behavior.",
  progress: 0,
  concepts: [
    { title: "Tool failure modes", objective: "Distinguish retryable tool failures from terminal ones." },
    { title: "Retry policy", objective: "Choose bounded retry behavior for common agent failures." },
    { title: "Human handoff", objective: "Escalate an agent task with the context a person needs." },
    { title: "Reliability budgets", objective: "Set measurable reliability targets for an agent workflow." },
  ],
  next: "Tool failure modes",
  status: "Added from suggestion",
};

const mapStorageKey = "current-learning-map-v1";
const nodeTypes = { learning: LearningGraphNode } satisfies NodeTypes;

type LearningMapProps = {
  onOpenLesson: () => void;
  onOpenSidebar: () => void;
  onApplyResearchUpdate: () => void;
};

export function LearningMap({ onOpenLesson, onOpenSidebar, onApplyResearchUpdate }: LearningMapProps) {
  const [mapMode, setMapMode] = useState<MapMode>("map");
  const [selectedPathId, setSelectedPathId] = useState("long-running");
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus>("ready");
  const [suggestionStatus, setSuggestionStatus] = useState<SuggestionStatus>("ready");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [plannedPathId, setPlannedPathId] = useState<string | null>(null);
  const [compactGraph, setCompactGraph] = useState(false);
  const [customPaths, setCustomPaths] = useState<LearningPath[]>([]);
  const [createPathOpen, setCreatePathOpen] = useState(false);
  const [removePathId, setRemovePathId] = useState<string | null>(null);
  const mapBodyRef = useRef<HTMLDivElement>(null);
  const storageHydratedRef = useRef(false);

  const paths = useMemo(
    () => [...basePaths, ...(suggestionStatus === "added" ? [suggestedPath] : []), ...customPaths],
    [customPaths, suggestionStatus],
  );
  const selectedPath = paths.find((path) => path.id === selectedPathId) ?? paths[0];
  const plannedPath = paths.find((path) => path.id === plannedPathId);
  const pendingUpdates = Number(proposalStatus === "ready") + Number(suggestionStatus === "ready");
  const nodes = useMemo(
    () => createNodes(proposalStatus === "applied", paths, plannedPathId, compactGraph),
    [compactGraph, paths, plannedPathId, proposalStatus],
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
        const saved = JSON.parse(window.localStorage.getItem(mapStorageKey) ?? "null") as {
          proposalStatus?: ProposalStatus;
          suggestionStatus?: SuggestionStatus;
          plannedPathId?: string | null;
          customPaths?: LearningPath[];
        } | null;
        if (saved?.proposalStatus && ["ready", "applied", "dismissed"].includes(saved.proposalStatus)) {
          setProposalStatus(saved.proposalStatus);
        }
        if (saved?.suggestionStatus && ["ready", "added", "dismissed"].includes(saved.suggestionStatus)) {
          setSuggestionStatus(saved.suggestionStatus);
        }
        if (typeof saved?.plannedPathId === "string" || saved?.plannedPathId === null) {
          setPlannedPathId(saved.plannedPathId);
        }
        if (Array.isArray(saved?.customPaths)) {
          setCustomPaths(saved.customPaths.filter(isStoredLearningPath).slice(0, 12));
        }
      } catch {
        window.localStorage.removeItem(mapStorageKey);
      } finally {
        storageHydratedRef.current = true;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!storageHydratedRef.current) return;
    window.localStorage.setItem(mapStorageKey, JSON.stringify({ proposalStatus, suggestionStatus, plannedPathId, customPaths }));
  }, [customPaths, plannedPathId, proposalStatus, suggestionStatus]);

  const selectPath = (pathId: string) => {
    setSelectedPathId(pathId);
  };

  const addSuggestedPath = () => {
    setSuggestionStatus("added");
    setSelectedPathId(suggestedPath.id);
  };

  const dismissSuggestion = () => {
    setSuggestionStatus("dismissed");
    if (selectedPathId === suggestedPath.id) setSelectedPathId("long-running");
  };

  const applyProposal = () => {
    setProposalStatus("applied");
    setReviewOpen(false);
    setSelectedPathId("long-running");
    onApplyResearchUpdate();
  };

  const addCustomPath = (path: LearningPath) => {
    setCustomPaths((current) => [...current, path]);
    setSelectedPathId(path.id);
    setMapMode("map");
    setCreatePathOpen(false);
  };

  const removeCustomPath = (pathId: string) => {
    setCustomPaths((current) => current.filter((path) => path.id !== pathId));
    setSelectedPathId("long-running");
    setPlannedPathId((current) => current === pathId ? null : current);
    setRemovePathId(null);
  };

  return (
    <section className="learning-map-shell" aria-label="Learning map">
      <div className="map-toolbar">
        <div className="map-toolbar-start">
          <button className="icon-action mobile-only" aria-label="Open course outline" onClick={onOpenSidebar}><Menu size={18} /></button>
          <Network size={15} />
          <span>Learning map</span>
        </div>
        <div className="map-view-switcher" role="tablist" aria-label="Learning map view">
          <button role="tab" aria-selected={mapMode === "map"} className={mapMode === "map" ? "active" : ""} onClick={() => setMapMode("map")}><Network size={14} /> Map</button>
          <button role="tab" aria-selected={mapMode === "list"} className={mapMode === "list" ? "active" : ""} onClick={() => setMapMode("list")}><List size={14} /> List</button>
        </div>
        <div className="map-toolbar-actions">
          <button className="create-path-button" aria-label="New path" onClick={() => setCreatePathOpen(true)}><Plus size={14} /><span>New path</span></button>
          <button className="map-return-button" aria-label="Continue lesson" onClick={onOpenLesson}><ArrowLeft size={14} /><span>Continue lesson</span></button>
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
              {paths.map((path) => (
                <li key={path.id}>
                  <button className={selectedPath.id === path.id ? "selected" : ""} onClick={() => selectPath(path.id)}>
                    <span className="path-list-icon"><FolderOpen size={17} /></span>
                    <span className="path-list-copy"><strong>{path.title}{plannedPathId === path.id ? <em>Next</em> : null}</strong><small>{path.description}</small></span>
                    <span className="path-list-progress"><span><i style={{ width: `${path.progress}%` }} /></span><small>{path.progress}% · {path.concepts.length} concepts</small></span>
                    <ArrowRight size={15} />
                  </button>
                </li>
              ))}
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
            {selectedPath.userCreated ? (
              <div className="selected-path-outline">
                <span>Concepts</span>
                <ol>
                  {selectedPath.concepts.map((concept, index) => (
                    <li key={`${selectedPath.id}-${concept.title}`}><span>{index + 1}</span><div><strong>{concept.title}</strong><p>{concept.objective}</p></div></li>
                  ))}
                </ol>
              </div>
            ) : null}
            {selectedPath.userCreated && selectedPath.sources?.length ? (
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
            {selectedPath.id === "long-running" ? (
              <button className="rail-primary-action" onClick={onOpenLesson}><BookOpen size={14} /> Continue Compaction</button>
            ) : (
              <button className="rail-primary-action" onClick={() => setPlannedPathId((current) => current === selectedPath.id ? null : selectedPath.id)}><Clock3 size={14} />{plannedPathId === selectedPath.id ? "Remove from queue" : "Set as next"}</button>
            )}
            {selectedPath.userCreated ? (
              removePathId === selectedPath.id ? (
                <div className="remove-path-confirm"><span>Remove this path?</span><div><button onClick={() => removeCustomPath(selectedPath.id)}>Remove</button><button onClick={() => setRemovePathId(null)}>Cancel</button></div></div>
              ) : (
                <button className="remove-path-button" onClick={() => setRemovePathId(selectedPath.id)}><Trash2 size={13} /> Remove path</button>
              )
            ) : null}
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

            <article className={`agent-activity-item ${suggestionStatus}`}>
              <span className="activity-icon">{suggestionStatus === "added" ? <Check size={15} /> : suggestionStatus === "dismissed" ? <X size={15} /> : <Sparkles size={15} />}</span>
              <div className="activity-content">
                <strong>{suggestionStatus === "added" ? "Agent reliability added" : suggestionStatus === "dismissed" ? "Suggestion dismissed" : "Suggested learning path"}</strong>
                <p>{suggestionStatus === "added" ? "The new path is connected to recovery and evaluations." : suggestionStatus === "dismissed" ? "The path can be restored later." : "Agent reliability shares four concepts with your current paths."}</p>
                {suggestionStatus === "ready" ? <div className="suggestion-actions"><button onClick={addSuggestedPath}><CirclePlus size={12} /> Add path</button><button onClick={dismissSuggestion}>Dismiss</button></div> : null}
                {suggestionStatus === "dismissed" ? <button className="activity-action" onClick={() => setSuggestionStatus("ready")}><RotateCcw size={12} /> Restore</button> : null}
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
    data.planned ? "planned" : "",
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
      {data.planned ? <span className="node-plan-label"><Clock3 size={10} /> Next</span> : null}
      <Handle id="right" type="source" position={Position.Right} className="learning-node-handle" />
      <Handle id="bottom" type="source" position={Position.Bottom} className="learning-node-handle" />
    </div>
  );
}

function createNodes(updateApplied: boolean, paths: LearningPath[], plannedPathId: string | null, compact: boolean): LearningNode[] {
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
      : path.id === "long-running"
        ? isUpdated ? `Review added · ${path.concepts.length} concepts` : `Current path · ${path.concepts.length} concepts`
        : isSuggested ? `Added from suggestion · ${path.concepts.length} concepts` : `${path.progress}% mastered · ${path.concepts.length} concepts`;

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
        current: path.id === "long-running",
        changed: isUpdated || isSuggested || Boolean(path.userCreated),
        changeLabel: path.userCreated ? "Created" : isSuggested ? "Added" : isUpdated ? "Updated" : undefined,
        planned: plannedPathId === path.id,
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

function isStoredLearningPath(value: unknown): value is LearningPath {
  if (!value || typeof value !== "object") return false;
  const path = value as Partial<LearningPath>;
  if (!path.userCreated || typeof path.id !== "string" || !path.id.startsWith("custom-") || typeof path.title !== "string" || typeof path.description !== "string") return false;
  if (typeof path.progress !== "number" || typeof path.next !== "string" || typeof path.status !== "string" || !Array.isArray(path.concepts) || path.concepts.length < 1) return false;
  if (!path.concepts.every((concept) => concept && typeof concept.title === "string" && typeof concept.objective === "string")) return false;
  if (path.sources && (!Array.isArray(path.sources) || !path.sources.every((source) => {
    if (!source || typeof source.id !== "string" || typeof source.title !== "string" || (source.kind !== "file" && source.kind !== "link")) return false;
    if (!source.href) return true;
    try { return new URL(source.href).protocol === "https:"; } catch { return false; }
  }))) return false;
  return true;
}
