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
  LoaderCircle,
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
  kind: "path" | "concept";
  title: string;
  detail: string;
  pathId: string;
  progress?: number;
  current?: boolean;
  changed?: boolean;
  researching?: boolean;
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
    status: "Researching",
  },
];

const suggestedPath: LearningPath = {
  id: "agent-reliability",
  title: "Agent reliability",
  description: "Turn tool failures, recovery patterns, and evaluations into resilient production behavior.",
  progress: 0,
  concepts: ["Tool failure modes", "Retry policy", "Human handoff", "Reliability budgets"],
  next: "Tool failure modes",
  status: "Added by research",
};

const nodeTypes = { learning: LearningGraphNode } satisfies NodeTypes;

export function LearningMap({ onOpenLesson, onOpenSidebar }: { onOpenLesson: () => void; onOpenSidebar: () => void }) {
  const [mapMode, setMapMode] = useState<MapMode>("map");
  const [selectedPathId, setSelectedPathId] = useState("long-running");
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus>("ready");
  const [suggestionStatus, setSuggestionStatus] = useState<SuggestionStatus>("ready");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [plannedPathId, setPlannedPathId] = useState<string | null>(null);
  const mapBodyRef = useRef<HTMLDivElement>(null);

  const paths = useMemo(
    () => suggestionStatus === "added" ? [...basePaths, suggestedPath] : basePaths,
    [suggestionStatus],
  );
  const selectedPath = paths.find((path) => path.id === selectedPathId) ?? paths[0];
  const nodes = useMemo(
    () => createNodes(proposalStatus === "applied", suggestionStatus === "added"),
    [proposalStatus, suggestionStatus],
  );
  const edges = useMemo(() => createEdges(suggestionStatus === "added"), [suggestionStatus]);

  useEffect(() => {
    mapBodyRef.current?.scrollTo({ top: 0 });
  }, [mapMode]);

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
                fitViewOptions={{ padding: 0.2, maxZoom: 1.05 }}
                minZoom={0.32}
                maxZoom={1.35}
                onNodeClick={(_, node) => selectPath(node.data.pathId)}
                aria-label="Connected learning paths and concepts"
              >
                <Background color="#242424" gap={28} size={1} />
                <Controls showInteractive={false} />
              </ReactFlow>
              <div className="graph-status"><span>{paths.length} paths</span><span>{paths.reduce((total, path) => total + path.concepts.length, 0)} concepts</span><span><i /> Research active</span></div>
            </div>
          ) : (
            <ul className="learning-path-list" aria-label="Learning paths">
              {paths.map((path) => (
                <li key={path.id}>
                  <button className={selectedPath.id === path.id ? "selected" : ""} onClick={() => selectPath(path.id)}>
                    <span className="path-list-icon"><FolderOpen size={17} /></span>
                    <span className="path-list-copy"><strong>{path.title}</strong><small>{path.description}</small></span>
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
              <button className="rail-primary-action" disabled={plannedPathId === selectedPath.id} onClick={() => setPlannedPathId(selectedPath.id)}><Clock3 size={14} />{plannedPathId === selectedPath.id ? "Next session planned" : "Plan next session"}</button>
            )}
          </section>

          <section className="research-activity">
            <div className="research-heading"><div><Activity size={15} /><span>Research activity</span></div><small>3 agents</small></div>

            <article className="agent-activity-item running">
              <span className="activity-icon"><LoaderCircle size={15} /></span>
              <div><strong>Checking official sources</strong><p>Compaction, conversation state, and eval guidance</p><small>Running now</small></div>
            </article>

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

function LearningGraphNode({ data, selected }: NodeProps<LearningNode>) {
  const className = [
    "learning-graph-node",
    data.kind,
    selected ? "selected" : "",
    data.current ? "current" : "",
    data.changed ? "changed" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={className}>
      <Handle id="left" type="target" position={Position.Left} className="learning-node-handle" />
      <Handle id="top" type="target" position={Position.Top} className="learning-node-handle" />
      <div className="graph-node-heading">
        <span>{data.kind === "path" ? <FolderOpen size={14} /> : <span className="concept-dot" />}</span>
        <strong>{data.title}</strong>
        {data.researching ? <LoaderCircle className="node-researching" size={12} /> : null}
      </div>
      <small>{data.detail}</small>
      {typeof data.progress === "number" ? <div className="graph-node-progress"><i style={{ width: `${data.progress}%` }} /></div> : null}
      {data.changed ? <span className="node-change-label"><Sparkles size={10} /> Updated</span> : null}
      <Handle id="right" type="source" position={Position.Right} className="learning-node-handle" />
      <Handle id="bottom" type="source" position={Position.Bottom} className="learning-node-handle" />
    </div>
  );
}

function createNodes(updateApplied: boolean, suggestionAdded: boolean): LearningNode[] {
  const nodes: LearningNode[] = [
    {
      id: "path-responses",
      type: "learning",
      position: { x: 40, y: 70 },
      ariaLabel: "Responses API foundations learning path",
      data: { kind: "path", title: "Responses API foundations", detail: "64% mastered", pathId: "responses-api", progress: 64 },
    },
    {
      id: "path-long-running",
      type: "learning",
      position: { x: 350, y: 205 },
      ariaLabel: "Long-running agents learning path",
      data: { kind: "path", title: "Long-running agents", detail: "Current path · 5 concepts", pathId: "long-running", progress: 38, current: true },
    },
    {
      id: "path-evals",
      type: "learning",
      position: { x: 700, y: 70 },
      ariaLabel: "Agent evaluations learning path",
      data: { kind: "path", title: "Agent evaluations", detail: "Researching · 6 concepts", pathId: "agent-evals", progress: 21, researching: true },
    },
    {
      id: "concept-state",
      type: "learning",
      position: { x: 85, y: 365 },
      ariaLabel: "Conversation state concept",
      data: { kind: "concept", title: "Conversation state", detail: "Mastered", pathId: "long-running" },
    },
    {
      id: "concept-compaction",
      type: "learning",
      position: { x: 355, y: 440 },
      ariaLabel: "Compaction concept",
      data: { kind: "concept", title: "Compaction", detail: updateApplied ? "Updated · review added" : "Learning now", pathId: "long-running", current: true, changed: updateApplied },
    },
    {
      id: "concept-chaining",
      type: "learning",
      position: { x: 650, y: 350 },
      ariaLabel: "Stateless chaining concept",
      data: { kind: "concept", title: "Stateless chaining", detail: "Up next", pathId: "long-running" },
    },
  ];

  if (suggestionAdded) {
    nodes.push({
      id: "path-reliability",
      type: "learning",
      position: { x: 720, y: 520 },
      ariaLabel: "Agent reliability learning path",
      data: { kind: "path", title: "Agent reliability", detail: "Added by research · 4 concepts", pathId: "agent-reliability", progress: 0, changed: true },
    });
  }

  return nodes;
}

function createEdges(suggestionAdded: boolean): Edge[] {
  const edges: Edge[] = [
    { id: "responses-long", source: "path-responses", sourceHandle: "right", target: "path-long-running", targetHandle: "left", label: "foundation", type: "smoothstep", className: "learning-edge" },
    { id: "long-evals", source: "path-long-running", sourceHandle: "right", target: "path-evals", targetHandle: "left", label: "shared state", type: "smoothstep", className: "learning-edge" },
    { id: "long-state", source: "path-long-running", sourceHandle: "bottom", target: "concept-state", targetHandle: "top", type: "smoothstep", className: "learning-edge" },
    { id: "long-compaction", source: "path-long-running", sourceHandle: "bottom", target: "concept-compaction", targetHandle: "top", type: "smoothstep", className: "learning-edge active" },
    { id: "long-chaining", source: "path-long-running", sourceHandle: "bottom", target: "concept-chaining", targetHandle: "top", type: "smoothstep", className: "learning-edge" },
  ];

  if (suggestionAdded) edges.push({ id: "long-reliability", source: "path-long-running", sourceHandle: "right", target: "path-reliability", targetHandle: "left", label: "recommended", type: "smoothstep", className: "learning-edge suggested" });
  return edges;
}
