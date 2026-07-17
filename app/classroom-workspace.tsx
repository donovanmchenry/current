"use client";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CircleAlert,
  Filter,
  GraduationCap,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { classroomStudents, type ClassroomStudent } from "../lib/classroom-catalog";

type ClassroomView = "overview" | "students" | "updates";
export type ClassroomUpdateStatus = "ready" | "applied" | "dismissed";

type ClassroomWorkspaceProps = {
  onOpenLearningMap: () => void;
  onPreviewStudent: (student: ClassroomStudent, curriculumUpdateApplied: boolean) => void;
  updateStatus: ClassroomUpdateStatus;
  onSetUpdateStatus: (status: ClassroomUpdateStatus) => void;
};

const viewItems: Array<{ id: ClassroomView; label: string; icon: typeof Users }> = [
  { id: "overview", label: "Overview", icon: GraduationCap },
  { id: "students", label: "Students", icon: Users },
  { id: "updates", label: "Updates", icon: Activity },
];

function studentStatusLabel(status: ClassroomStudent["status"]) {
  if (status === "needs_support") return "Needs support";
  if (status === "ahead") return "Ready to extend";
  return "On track";
}

export function ClassroomWorkspace({ onOpenLearningMap, onPreviewStudent, updateStatus, onSetUpdateStatus }: ClassroomWorkspaceProps) {
  const [view, setView] = useState<ClassroomView>("overview");
  const [selectedStudentId, setSelectedStudentId] = useState(classroomStudents[1].id);
  const [studentQuery, setStudentQuery] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);

  const selectedStudent = classroomStudents.find((student) => student.id === selectedStudentId) ?? classroomStudents[0];
  const supportStudents = classroomStudents.filter((student) => student.status === "needs_support");
  const averageMastery = Math.round(classroomStudents.reduce((total, student) => total + student.mastery, 0) / classroomStudents.length);
  const visibleStudents = useMemo(() => {
    const normalizedQuery = studentQuery.trim().toLowerCase();
    return classroomStudents.filter((student) => {
      if (attentionOnly && student.status !== "needs_support") return false;
      return !normalizedQuery || `${student.name} ${student.interest} ${student.support}`.toLowerCase().includes(normalizedQuery);
    });
  }, [attentionOnly, studentQuery]);

  const openAttentionGroup = () => {
    setAttentionOnly(true);
    setStudentQuery("");
    setSelectedStudentId(supportStudents[0].id);
    setView("students");
  };

  return (
    <section className="classroom-shell" aria-label="Current Classroom">
      <header className="classroom-topbar">
        <div className="classroom-wordmark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/current-icon.png" width="19" height="19" alt="" aria-hidden="true" />
          <strong>Current</strong>
          <span>Classroom</span>
        </div>
        <div className="classroom-view-switcher" role="tablist" aria-label="Classroom view">
          {viewItems.map((item) => {
            const Icon = item.icon;
            return <button role="tab" aria-selected={view === item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)} key={item.id}><Icon size={14} />{item.label}{item.id === "updates" && updateStatus === "ready" ? <span className="classroom-update-indicator" /> : null}</button>;
          })}
        </div>
        <button className="classroom-map-action" onClick={onOpenLearningMap}><Network size={14} /> Learning map</button>
      </header>

      <aside className="classroom-sidebar">
        <button className="classroom-back" onClick={onOpenLearningMap}><ArrowLeft size={14} /> Back to learning</button>
        <div className="classroom-class-title">
          <span>Algebra I</span>
          <strong>Period 2</strong>
          <small>{classroomStudents.length} students</small>
        </div>
        <nav aria-label="Classroom sections">
          {viewItems.map((item) => {
            const Icon = item.icon;
            return <button className={view === item.id ? "active" : ""} onClick={() => setView(item.id)} key={item.id}><Icon size={15} /><span>{item.label}</span>{item.id === "updates" && updateStatus === "ready" ? <small>1</small> : null}</button>;
          })}
        </nav>
        <div className="classroom-assignment-nav">
          <span>Assigned path</span>
          <button onClick={() => { setView("overview"); }}><BookOpenCheck size={15} /><div><strong>Linear relationships</strong><small>Due Friday</small></div></button>
        </div>
      </aside>

      <main className="classroom-main">
        {view === "overview" ? (
          <div className="classroom-view classroom-overview">
            <header className="classroom-page-heading">
              <div><h1>Algebra I</h1><p>Period 2 · Linear relationships</p></div>
              <button onClick={() => onPreviewStudent(selectedStudent, updateStatus === "applied")}><BookOpenCheck size={14} /> Preview student view</button>
            </header>

            <section className="classroom-metrics" aria-label="Class progress">
              <div><span>Class mastery</span><strong>{averageMastery}%</strong></div>
              <div><span>On pace</span><strong>{classroomStudents.length - supportStudents.length} of {classroomStudents.length}</strong></div>
              <div><span>Needs support</span><strong>{supportStudents.length}</strong></div>
              <div><span>Pending updates</span><strong>{updateStatus === "ready" ? 1 : 0}</strong></div>
            </section>

            <section className="classroom-assignment-band" aria-label="Current assignment">
              <div className="classroom-assignment-copy"><span><BookOpenCheck size={14} /> Assigned path</span><h2>Linear relationships</h2><p>Interpret slope and intercept in real contexts, then compare equations, tables, and graphs.</p></div>
              <ol>
                <li className="complete"><span><Check size={10} /></span><strong>Slope as a rate</strong></li>
                <li className="current"><span>2</span><strong>Intercept as a starting value</strong></li>
                <li><span>3</span><strong>Build an equation</strong></li>
                <li><span>4</span><strong>Compare representations</strong></li>
              </ol>
            </section>

            <section className="classroom-signal" aria-label="Class misconception">
              <span className="classroom-signal-icon"><CircleAlert size={17} /></span>
              <div><small>Shared recall gap</small><h2>Slope is being treated as a total, not a rate.</h2><p>{supportStudents.length} students missed the relationship between change in output and change in input across two attempts.</p></div>
              <button onClick={openAttentionGroup}>Review group <ArrowRight size={13} /></button>
            </section>

            <StudentTable students={classroomStudents} selectedStudentId={selectedStudent.id} onSelect={setSelectedStudentId} />
          </div>
        ) : view === "students" ? (
          <div className="classroom-view classroom-students-view">
            <header className="classroom-page-heading"><div><h1>Students</h1><p>Progress and observed learning gaps for Linear relationships.</p></div></header>
            <div className="classroom-student-tools">
              <label><Search size={14} /><input value={studentQuery} onChange={(event) => setStudentQuery(event.target.value)} placeholder="Search students or interests" aria-label="Search students" /></label>
              <button className={attentionOnly ? "active" : ""} aria-pressed={attentionOnly} onClick={() => setAttentionOnly((current) => !current)}><Filter size={13} /> Needs support{attentionOnly ? <X size={12} /> : null}</button>
            </div>
            <StudentTable students={visibleStudents} selectedStudentId={selectedStudent.id} onSelect={setSelectedStudentId} emptyMessage="No students match this view." />
          </div>
        ) : (
          <div className="classroom-view classroom-updates-view">
            <header className="classroom-page-heading"><div><h1>Curriculum updates</h1><p>Current proposes changes. Teachers decide what reaches students.</p></div><span className={`classroom-update-status ${updateStatus}`}>{updateStatus === "ready" ? "Awaiting review" : updateStatus === "applied" ? "Approved" : "Dismissed"}</span></header>
            <article className={`classroom-update-review ${updateStatus}`}>
              <div className="classroom-update-source"><span><ShieldCheck size={15} /> District Algebra I pacing guide</span><small>Checked by Sol · Today</small></div>
              <h2>Multiple representations added to the unit checkpoint</h2>
              <p>The updated guide asks students to compare the same relationship across tables, graphs, equations, and verbal descriptions.</p>
              <div className="classroom-update-diff">
                <div><small>Stored objective</small><p>Identify slope and intercept from an equation.</p></div>
                <div><small>Latest objective</small><p>Compare slope and intercept across tables, graphs, equations, and verbal descriptions.</p></div>
              </div>
              <div className="classroom-update-impact"><Sparkles size={15} /><div><strong>Proposed classroom impact</strong><span>Adds one checkpoint to Compare representations and schedules a short review for all {classroomStudents.length} students.</span></div></div>
              {updateStatus === "ready" ? <div className="classroom-update-actions"><button onClick={() => onSetUpdateStatus("applied")}><Check size={13} /> Approve update</button><button onClick={() => onSetUpdateStatus("dismissed")}>Dismiss</button></div> : <button className="classroom-reopen-update" onClick={() => onSetUpdateStatus("ready")}>Reopen review</button>}
            </article>
          </div>
        )}
      </main>

      <aside className="classroom-inspector">
        {view === "updates" ? (
          <section className="classroom-update-inspector">
            <span>Teacher control</span>
            <ShieldCheck size={21} />
            <h2>{updateStatus === "applied" ? "Update approved" : updateStatus === "dismissed" ? "No class content changed" : "Nothing changes until you approve"}</h2>
            <p>{updateStatus === "applied" ? "The revised checkpoint is now part of the assigned path and will enter each student’s next review." : updateStatus === "dismissed" ? "The proposal remains in the audit trail and can be reopened." : "Current has compared the source and prepared the impact. Students still see the teacher-approved version."}</p>
          </section>
        ) : (
          <StudentInspector student={selectedStudent} onPreview={() => onPreviewStudent(selectedStudent, updateStatus === "applied")} />
        )}
      </aside>
    </section>
  );
}

function StudentTable({ students, selectedStudentId, onSelect, emptyMessage = "" }: { students: ClassroomStudent[]; selectedStudentId: string; onSelect: (id: string) => void; emptyMessage?: string }) {
  return (
    <section className="classroom-roster" aria-label="Student progress">
      <header><span>Student</span><span>Mastery</span><span>Progress</span><span>Status</span><span>Last active</span></header>
      {students.map((student) => (
        <button className={selectedStudentId === student.id ? "selected" : ""} aria-pressed={selectedStudentId === student.id} onClick={() => onSelect(student.id)} key={student.id}>
          <span className="classroom-student-name"><i>{student.initials}</i><span><strong>{student.name}</strong><small>{student.interest}</small></span></span>
          <span className="classroom-mastery"><span><i style={{ width: `${student.mastery}%` }} /></span><strong>{student.mastery}%</strong></span>
          <span>{student.completedConcepts} of 4</span>
          <span className={`classroom-student-status ${student.status}`}>{student.status === "needs_support" ? <CircleAlert size={11} /> : <Check size={11} />}{studentStatusLabel(student.status)}</span>
          <span>{student.lastActive}</span>
          <ArrowRight size={13} />
        </button>
      ))}
      {!students.length ? <p className="classroom-roster-empty">{emptyMessage}</p> : null}
    </section>
  );
}

function StudentInspector({ student, onPreview }: { student: ClassroomStudent; onPreview: () => void }) {
  return (
    <section className="classroom-student-inspector">
      <span>Selected student</span>
      <div className="classroom-inspector-student"><i>{student.initials}</i><div><h2>{student.name}</h2><p>{studentStatusLabel(student.status)} · {student.mastery}% mastery</p></div></div>
      <div className="classroom-inspector-progress"><span><i style={{ width: `${student.mastery}%` }} /></span><small>{student.completedConcepts} of 4 concepts</small></div>
      {student.misconception ? <div className="classroom-inspector-gap"><small>Observed gap</small><p>{student.misconception}</p></div> : <div className="classroom-inspector-gap resolved"><small>Latest recall</small><p>No unresolved misconception.</p></div>}
      <div className="classroom-personalization"><span><Sparkles size={13} /> Personalized support</span><strong>{student.support}</strong><p>Interest: {student.interest}. The class objective and scoring rubric remain unchanged.</p></div>
      <button className="classroom-preview-student" onClick={onPreview}><BookOpenCheck size={14} /> Open student view</button>
    </section>
  );
}
