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
  FolderOpen,
  List,
  Menu,
  Network,
  RotateCcw,
  Sparkles,
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

type MapMode = "map" | "list";
type ProposalStatus = "ready" | "applied" | "dismissed";
type SuggestionStatus = "ready" | "added" | "dismissed";

type LearningPath = {
  id: string;
  title: string;
  description: string;
  progress: number;
  concepts: string[];
  next: string;
  status: string;
};

type LearningNodeData = Record<string, unknown> & {
  title: string;
  detail: string;
  pathId: string;
  progress?: number;
  current?: boolean;
  changed?: boolean;
  changeLabel?: "Added" | "Updated";
  planned?: boolean;
};

type LearningNode = Node<LearningNodeData, "learning">;

const basePaths: LearningPath[] = [
  {
    id: "long-running",
    title: "Long-running agents",
    description: "Context, compaction, chaining, and recovery for agents that work across many turns.",
    progress: 38,
    concepts: ["Conversation state", "Compaction", "Stateless chaining", "Recovery patterns", "Implementation check"],
    next: "Compaction",
    status: "In progress",
  },
  {
    id: "responses-api",
    title: "Responses API foundations",
    description: "The request, response, tool, and state primitives behind OpenAI agent systems.",
    progress: 64,
    concepts: ["Response objects", "Tool calls", "Structured outputs", "Error recovery"],
    next: "Error recovery",
    status: "2 reviews due",
  },
  {
    id: "agent-evals",
    title: "Agent evaluations",
    description: "Build repeatable evaluation sets for reasoning traces, tools, and multi-step outcomes.",
    progress: 21,
    concepts: ["Eval design", "Trace grading", "Regression sets", "Failure taxonomies", "Human review", "Release gates"],
    next: "Trace grading",
    status: "In progress",
  },
];

const suggestedPath: LearningPath = {
  id: "agent-reliability",
  title: "Agent reliability",
  description: "Turn tool failures, recovery patterns, and evaluations into resilient production behavior.",
  progress: 0,
  concepts: ["Tool failure modes", "Retry policy", "Human handoff", "Reliability budgets"],
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
  const mapBodyRef = useRef<HTMLDivElement>(null);
  const storageHydratedRef = useRef(false);

  const paths = useMemo(
    () => suggestionStatus === "added" ? [...basePaths, suggestedPath] : basePaths,
    [suggestionStatus],
  );
  const selectedPath = paths.find((path) => path.id === selectedPathId) ?? paths[0];
  const plannedPath = paths.find((path) => path.id === plannedPathId);
  const pendingUpdates = Number(proposalStatus === "ready") + Number(suggestionStatus === "ready");
  const nodes = useMemo(
    () => createNodes(proposalStatus === "applied", suggestionStatus === "added", plannedPathId, compactGraph),
    [compactGraph, plannedPathId, proposalStatus, suggestionStatus],
  );
  const edges = useMemo(() => createEdges(suggestionStatus === "added"), [suggestionStatus]);

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
    window.localStorage.setItem(mapStorageKey, JSON.stringify({ proposalStatus, suggestionStatus, plannedPathId }));
  }, [plannedPathId, proposalStatus, suggestionStatus]);

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
        <button className="map-return-button" aria-label="Continue lesson" onClick={onOpenLesson}><ArrowLeft size={14} /><span>Continue lesson</span></button>
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
                <FitGraph version={`${proposalStatus}-${suggestionStatus}-${compactGraph ? "compact" : "wide"}`} />
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
            {selectedPath.id === "long-running" ? (
              <button className="rail-primary-action" onClick={onOpenLesson}><BookOpen size={14} /> Continue Compaction</button>
            ) : (
              <button className="rail-primary-action" onClick={() => setPlannedPathId((current) => current === selectedPath.id ? null : selectedPath.id)}><Clock3 size={14} />{plannedPathId === selectedPath.id ? "Remove from queue" : "Set as next"}</button>
            )}
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

function createNodes(updateApplied: boolean, suggestionAdded: boolean, plannedPathId: string | null, compact: boolean): LearningNode[] {
  const positions = compact ? {
    responses: { x: 25, y: 20 },
    current: { x: 125, y: 160 },
    evals: { x: 25, y: 300 },
    reliability: { x: 125, y: 440 },
  } : {
    responses: { x: 30, y: 80 },
    current: { x: 275, y: 260 },
    evals: { x: 30, y: 460 },
    reliability: { x: 275, y: 500 },
  };

  const nodes: LearningNode[] = [
    {
      id: "path-responses",
      type: "learning",
      position: positions.responses,
      ariaLabel: "Responses API foundations learning path",
      data: { title: "Responses API foundations", detail: "64% mastered · 4 concepts", pathId: "responses-api", progress: 64, planned: plannedPathId === "responses-api" },
    },
    {
      id: "path-long-running",
      type: "learning",
      position: positions.current,
      ariaLabel: "Long-running agents learning path",
      data: { title: "Long-running agents", detail: updateApplied ? "Review added · 5 concepts" : "Current path · 5 concepts", pathId: "long-running", progress: 38, current: true, changed: updateApplied, changeLabel: updateApplied ? "Updated" : undefined },
    },
    {
      id: "path-evals",
      type: "learning",
      position: positions.evals,
      ariaLabel: "Agent evaluations learning path",
      data: { title: "Agent evaluations", detail: "21% mastered · 6 concepts", pathId: "agent-evals", progress: 21, planned: plannedPathId === "agent-evals" },
    },
  ];

  if (suggestionAdded) {
    nodes.push({
      id: "path-reliability",
      type: "learning",
      position: positions.reliability,
      ariaLabel: "Agent reliability learning path",
      data: { title: "Agent reliability", detail: "Added from suggestion · 4 concepts", pathId: "agent-reliability", progress: 0, changed: true, changeLabel: "Added", planned: plannedPathId === "agent-reliability" },
    });
  }

  return nodes;
}

function createEdges(suggestionAdded: boolean): Edge[] {
  const edges: Edge[] = [
    { id: "responses-long", source: "path-responses", sourceHandle: "right", target: "path-long-running", targetHandle: "left", label: "foundation", type: "smoothstep", className: "learning-edge" },
    { id: "long-evals", source: "path-long-running", sourceHandle: "bottom", target: "path-evals", targetHandle: "top", label: "shared state", type: "smoothstep", className: "learning-edge" },
  ];

  if (suggestionAdded) edges.push({ id: "long-reliability", source: "path-long-running", sourceHandle: "bottom", target: "path-reliability", targetHandle: "top", label: "recommended", type: "smoothstep", className: "learning-edge suggested" });
  return edges;
}
