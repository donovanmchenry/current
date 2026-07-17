"use client";

import { BookOpenCheck, CalendarDays, Plus, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { LearningPath } from "../lib/learning-path";

export type NewClassInput = {
  name: string;
  section: string;
  students: Array<{ name: string; interest: string }>;
};

export type NewAssignmentInput = {
  pathId: string;
  dueAt: string;
};

export function CreateClassDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (input: NewClassInput) => void }) {
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [roster, setRoster] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const students = roster.split("\n").map((line) => {
      const [studentName, ...interestParts] = line.split("|");
      return { name: studentName?.trim() ?? "", interest: interestParts.join("|").trim() || "General interests" };
    }).filter((student) => student.name);
    if (!name.trim() || !section.trim()) return setError("Add a class name and section.");
    if (!students.length) return setError("Add at least one student to the roster.");
    if (students.length > 30) return setError("This MVP supports up to 30 students per class.");
    onCreate({ name: name.trim(), section: section.trim(), students });
  };

  return (
    <div className="classroom-dialog-overlay" role="presentation">
      <section className="classroom-dialog" role="dialog" aria-modal="true" aria-labelledby="create-class-title">
        <header><div><Users size={16} /><span><strong id="create-class-title">Create a class</strong><small>Add the roster now, then assign a Current path.</small></span></div><button aria-label="Close class creation" onClick={onClose}><X size={15} /></button></header>
        <div className="classroom-dialog-body">
          <div className="classroom-dialog-grid">
            <label><span>Class name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Environmental Science" autoFocus /></label>
            <label><span>Section</span><input value={section} onChange={(event) => setSection(event.target.value)} placeholder="Period 4" /></label>
          </div>
          <label className="classroom-roster-input"><span>Roster</span><small>One student per line. Add an interest after a vertical bar.</small><textarea value={roster} onChange={(event) => setRoster(event.target.value)} placeholder={"Avery Morgan | Robotics\nSam Lee | Climate science\nRiley Davis | Photography"} /></label>
          <button className="classroom-sample-roster" type="button" onClick={() => setRoster("Avery Morgan | Robotics\nSam Lee | Climate science\nRiley Davis | Photography")}><Plus size={12} /> Use sample roster</button>
          {error ? <p className="classroom-dialog-error" role="alert">{error}</p> : null}
        </div>
        <footer><button onClick={onClose}>Cancel</button><button onClick={submit}><Users size={13} /> Create class</button></footer>
      </section>
    </div>
  );
}

export function CreateAssignmentDialog({ className, paths, onClose, onCreate }: { className: string; paths: LearningPath[]; onClose: () => void; onCreate: (input: NewAssignmentInput) => void }) {
  const [pathId, setPathId] = useState(paths[0]?.id ?? "");
  const [dueAt, setDueAt] = useState(() => {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    return due.toISOString().slice(0, 10);
  });
  const selectedPath = useMemo(() => paths.find((path) => path.id === pathId), [pathId, paths]);

  return (
    <div className="classroom-dialog-overlay" role="presentation">
      <section className="classroom-dialog assignment-dialog" role="dialog" aria-modal="true" aria-labelledby="create-assignment-title">
        <header><div><BookOpenCheck size={16} /><span><strong id="create-assignment-title">Assign a learning path</strong><small>{className}</small></span></div><button aria-label="Close assignment creation" onClick={onClose}><X size={15} /></button></header>
        <div className="classroom-dialog-body">
          <label><span>Current path</span><select value={pathId} onChange={(event) => setPathId(event.target.value)}>{paths.map((path) => <option value={path.id} key={path.id}>{path.title}</option>)}</select></label>
          {selectedPath ? <div className="classroom-assignment-preview"><BookOpenCheck size={17} /><div><strong>{selectedPath.title}</strong><p>{selectedPath.description}</p><small>{selectedPath.concepts.length} concepts · assigned to the entire class</small></div></div> : null}
          <label><span>Due date</span><div className="classroom-date-input"><CalendarDays size={14} /><input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></div></label>
        </div>
        <footer><button onClick={onClose}>Cancel</button><button disabled={!selectedPath || !dueAt} onClick={() => onCreate({ pathId, dueAt })}><BookOpenCheck size={13} /> Assign path</button></footer>
      </section>
    </div>
  );
}
