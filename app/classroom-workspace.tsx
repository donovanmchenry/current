"use client";

import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  Check,
  CircleAlert,
  ExternalLink,
  Filter,
  GraduationCap,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { defaultClassroomAssignmentId, type ClassroomAssignment, type ClassroomClass, type ClassroomNavigationState, type ClassroomStudent } from "../lib/classroom-catalog";
import type { LearningPath } from "../lib/learning-path";
import { CreateAssignmentDialog, CreateClassDialog, type NewAssignmentInput, type NewClassInput } from "./classroom-create-dialogs";
import { WorkspaceLink } from "./workspace-link";

export type ClassroomUpdateStatus = "ready" | "applied" | "dismissed";

type ClassroomWorkspaceProps = {
  classes: ClassroomClass[];
  assignments: ClassroomAssignment[];
  students: ClassroomStudent[];
  activeClass: ClassroomClass;
  activeAssignment: ClassroomAssignment | null;
  assignmentPath: LearningPath | null;
  availablePaths: LearningPath[];
  navigation: ClassroomNavigationState;
  onNavigationChange: (state: ClassroomNavigationState) => void;
  onCreateClass: (input: NewClassInput) => void;
  onCreateAssignment: (input: NewAssignmentInput) => void;
  onPreviewStudent: (student: ClassroomStudent, assignment: ClassroomAssignment, curriculumUpdateApplied: boolean) => void;
  onLaunchStudentSession: (student: ClassroomStudent, assignment: ClassroomAssignment) => void;
  updateStatus: ClassroomUpdateStatus;
  onSetUpdateStatus: (status: ClassroomUpdateStatus) => void;
  supportReviewAssigned: boolean;
  onAssignSupportReview: () => void;
};

const viewItems: Array<{ id: ClassroomNavigationState["view"]; label: string; icon: typeof Users }> = [
  { id: "overview", label: "Overview", icon: GraduationCap },
  { id: "students", label: "Students", icon: Users },
  { id: "updates", label: "Updates", icon: Activity },
];

function studentStatusLabel(status: ClassroomStudent["status"]) {
  if (status === "needs_support") return "Needs support";
  if (status === "ahead") return "Ready to extend";
  return "On track";
}

function formatAssignmentDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unscheduled" : new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

export function ClassroomWorkspace({ classes, assignments, students, activeClass, activeAssignment, assignmentPath, availablePaths, navigation, onNavigationChange, onCreateClass, onCreateAssignment, onPreviewStudent, onLaunchStudentSession, updateStatus, onSetUpdateStatus, supportReviewAssigned, onAssignSupportReview }: ClassroomWorkspaceProps) {
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);
  const { view, selectedStudentId, studentQuery, attentionOnly } = navigation;
  const updateNavigation = (patch: Partial<ClassroomNavigationState>) => onNavigationChange({ ...navigation, ...patch });

  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? students[0];
  const supportStudents = students.filter((student) => student.status === "needs_support");
  const averageMastery = students.length ? Math.round(students.reduce((total, student) => total + student.mastery, 0) / students.length) : 0;
  const classAssignments = assignments.filter((assignment) => assignment.classId === activeClass.id);
  const curriculumUpdateAvailable = activeAssignment?.id === defaultClassroomAssignmentId;
  const visibleStudents = useMemo(() => {
    const normalizedQuery = studentQuery.trim().toLowerCase();
    return students.filter((student) => {
      if (attentionOnly && student.status !== "needs_support") return false;
      return !normalizedQuery || `${student.name} ${student.interest} ${student.support}`.toLowerCase().includes(normalizedQuery);
    });
  }, [attentionOnly, studentQuery, students]);

  const selectClass = (classId: string) => {
    const nextClass = classes.find((item) => item.id === classId) ?? activeClass;
    const nextAssignment = assignments.find((item) => item.classId === nextClass.id) ?? null;
    updateNavigation({ activeClassId: nextClass.id, activeAssignmentId: nextAssignment?.id ?? "", selectedStudentId: nextClass.studentIds[0] ?? "", view: "overview", attentionOnly: false, studentQuery: "" });
  };

  const openAttentionGroup = () => {
    updateNavigation({ attentionOnly: true, studentQuery: "", selectedStudentId: supportStudents[0]?.id ?? selectedStudent.id, view: "students" });
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
            return <button role="tab" aria-selected={view === item.id} className={view === item.id ? "active" : ""} onClick={() => updateNavigation({ view: item.id })} key={item.id}><Icon size={14} />{item.label}{item.id === "updates" && curriculumUpdateAvailable && updateStatus === "ready" ? <span className="classroom-update-indicator" /> : null}</button>;
          })}
        </div>
        <WorkspaceLink className="classroom-map-action" href="/">Personal workspace <ArrowRight size={14} /></WorkspaceLink>
      </header>

      <aside className="classroom-sidebar">
        <div className="classroom-class-title">
          <div><label><span>Class</span><select aria-label="Current class" value={activeClass.id} onChange={(event) => selectClass(event.target.value)}>{classes.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.section}</option>)}</select></label><button aria-label="Create class" title="Create class" onClick={() => setCreateClassOpen(true)}><Plus size={14} /></button></div>
          <strong>{activeClass.name}</strong>
          <span>{activeClass.section}</span>
          <small>{students.length} students</small>
        </div>
        <nav aria-label="Classroom sections">
          {viewItems.map((item) => {
            const Icon = item.icon;
            return <button className={view === item.id ? "active" : ""} onClick={() => updateNavigation({ view: item.id })} key={item.id}><Icon size={15} /><span>{item.label}</span>{item.id === "updates" && curriculumUpdateAvailable && updateStatus === "ready" ? <small>1</small> : null}</button>;
          })}
        </nav>
        <div className="classroom-assignment-nav">
          <span>Assignments</span>
          {classAssignments.map((assignment) => <button className={activeAssignment?.id === assignment.id ? "active" : ""} onClick={() => updateNavigation({ activeAssignmentId: assignment.id, view: "overview", attentionOnly: false, studentQuery: "" })} key={assignment.id}><BookOpenCheck size={15} /><div><strong>{assignment.title}</strong><small>Due {formatAssignmentDate(assignment.dueAt)}</small></div></button>)}
          <button className="classroom-new-assignment" onClick={() => setCreateAssignmentOpen(true)}><Plus size={14} /><span>Assign path</span></button>
        </div>
      </aside>

      <main className="classroom-main">
        <div className="classroom-mobile-management">
          <select aria-label="Current class" value={activeClass.id} onChange={(event) => selectClass(event.target.value)}>{classes.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.section}</option>)}</select>
          <button aria-label="Create class" title="Create class" onClick={() => setCreateClassOpen(true)}><Users size={14} /><span>New class</span></button>
          <button aria-label="Assign path" title="Assign path" onClick={() => setCreateAssignmentOpen(true)}><Plus size={14} /><span>Assign</span></button>
        </div>
        {!activeAssignment || !assignmentPath ? (
          <div className="classroom-view classroom-empty-assignment">
            <BookOpenCheck size={22} />
            <h1>Assign the first learning path</h1>
            <p>Choose any path already in Current. Every student will receive the same objectives and sources with examples adapted to their interests.</p>
            <button onClick={() => setCreateAssignmentOpen(true)}><Plus size={14} /> Assign path</button>
          </div>
        ) : view === "overview" ? (
          <div className="classroom-view classroom-overview">
            <header className="classroom-page-heading">
              <div><h1>{activeClass.name}</h1><p>{activeClass.section} · {activeAssignment.title}</p></div>
              <button onClick={() => onPreviewStudent(selectedStudent, activeAssignment, curriculumUpdateAvailable && updateStatus === "applied")}><BookOpenCheck size={14} /> Preview student view</button>
            </header>

            <section className="classroom-metrics" aria-label="Class progress">
              <div><span>Class mastery</span><strong>{averageMastery}%</strong></div>
              <div><span>On pace</span><strong>{students.length - supportStudents.length} of {students.length}</strong></div>
              <div><span>Needs support</span><strong>{supportStudents.length}</strong></div>
              <div><span>Pending updates</span><strong>{curriculumUpdateAvailable && updateStatus === "ready" ? 1 : 0}</strong></div>
            </section>

            <section className="classroom-assignment-band" aria-label="Current assignment">
              <div className="classroom-assignment-copy"><span><BookOpenCheck size={14} /> Due {formatAssignmentDate(activeAssignment.dueAt)}</span><h2>{activeAssignment.title}</h2><p>{activeAssignment.objective}</p></div>
              <ol>
                {assignmentPath.concepts.map((concept, index) => <li className={index === 0 ? "current" : ""} key={concept.title}><span>{index + 1}</span><strong>{concept.title}</strong></li>)}
              </ol>
            </section>

            {supportStudents.length ? <section className="classroom-signal" aria-label="Class misconception">
              <span className="classroom-signal-icon"><CircleAlert size={17} /></span>
              <div><small>Shared recall gap</small><h2>{supportStudents[0]?.misconception ?? "Several students need another retrieval attempt."}</h2><p>{supportStudents.length} student{supportStudents.length === 1 ? "" : "s"} need targeted support on this assignment.</p></div>
              <button onClick={openAttentionGroup}>Review group <ArrowRight size={13} /></button>
            </section> : <section className="classroom-signal classroom-signal-clear" aria-label="Class learning signal"><span className="classroom-signal-icon"><Check size={17} /></span><div><small>Learning signal</small><h2>{students.some((student) => student.recallAttempts) ? "No unresolved misconception in the latest recalls." : "Waiting for the first student attempts."}</h2><p>Shared gaps will appear here when Current has enough evidence to suggest a useful group intervention.</p></div></section>}

            <StudentTable students={students} conceptCount={assignmentPath.concepts.length} selectedStudentId={selectedStudent.id} onSelect={(id) => updateNavigation({ selectedStudentId: id })} />
          </div>
        ) : view === "students" ? (
          <div className="classroom-view classroom-students-view">
            <header className="classroom-page-heading"><div><h1>Students</h1><p>Progress and observed learning gaps for {activeAssignment.title}.</p></div>{attentionOnly ? <button disabled={supportReviewAssigned} onClick={onAssignSupportReview}><BookOpenCheck size={14} /> {supportReviewAssigned ? "Review assigned" : "Assign targeted review"}</button> : null}</header>
            <div className="classroom-student-tools">
              <label><Search size={14} /><input value={studentQuery} onChange={(event) => updateNavigation({ studentQuery: event.target.value })} placeholder="Search students or interests" aria-label="Search students" /></label>
              <button className={attentionOnly ? "active" : ""} aria-pressed={attentionOnly} onClick={() => updateNavigation({ attentionOnly: !attentionOnly })}><Filter size={13} /> Needs support{attentionOnly ? <X size={12} /> : null}</button>
            </div>
            <StudentTable students={visibleStudents} conceptCount={assignmentPath.concepts.length} selectedStudentId={selectedStudent.id} onSelect={(id) => updateNavigation({ selectedStudentId: id })} emptyMessage="No students match this view." />
          </div>
        ) : (
          <div className="classroom-view classroom-updates-view">
            <header className="classroom-page-heading"><div><h1>Curriculum updates</h1><p>Current proposes changes. Teachers decide what reaches students.</p></div>{curriculumUpdateAvailable ? <span className={`classroom-update-status ${updateStatus}`}>{updateStatus === "ready" ? "Awaiting review" : updateStatus === "applied" ? "Approved" : "Dismissed"}</span> : null}</header>
            {curriculumUpdateAvailable ? <article className={`classroom-update-review ${updateStatus}`}>
              <div className="classroom-update-source"><span><ShieldCheck size={15} /> District Algebra I pacing guide</span><small>Checked by Sol · Today</small></div>
              <h2>Multiple representations added to the unit checkpoint</h2>
              <p>The updated guide asks students to compare the same relationship across tables, graphs, equations, and verbal descriptions.</p>
              <div className="classroom-update-diff">
                <div><small>Stored objective</small><p>Identify slope and intercept from an equation.</p></div>
                <div><small>Latest objective</small><p>Compare slope and intercept across tables, graphs, equations, and verbal descriptions.</p></div>
              </div>
              <div className="classroom-update-impact"><Sparkles size={15} /><div><strong>Proposed classroom impact</strong><span>Adds one checkpoint to Compare representations and schedules a short review for all {students.length} students.</span></div></div>
              {updateStatus === "ready" ? <div className="classroom-update-actions"><button onClick={() => onSetUpdateStatus("applied")}><Check size={13} /> Approve update</button><button onClick={() => onSetUpdateStatus("dismissed")}>Dismiss</button></div> : <button className="classroom-reopen-update" onClick={() => onSetUpdateStatus("ready")}>Reopen review</button>}
            </article> : <div className="classroom-no-updates"><ShieldCheck size={20} /><strong>No updates awaiting review</strong><p>Current will compare approved sources for {activeAssignment.title} and bring meaningful changes here.</p></div>}
          </div>
        )}
      </main>

      <aside className="classroom-inspector">
        {!activeAssignment ? <section className="classroom-update-inspector"><span>Assignment</span><BookOpenCheck size={21} /><h2>No path assigned yet</h2><p>Create an assignment to begin collecting student evidence.</p></section> : view === "updates" ? (
          <section className="classroom-update-inspector">
            <span>Teacher control</span>
            <ShieldCheck size={21} />
            <h2>{!curriculumUpdateAvailable ? "No teacher decision needed" : updateStatus === "applied" ? "Update approved" : updateStatus === "dismissed" ? "No class content changed" : "Nothing changes until you approve"}</h2>
            <p>{!curriculumUpdateAvailable ? "Current is watching the sources attached to this path. Proposed changes will appear here with their expected impact." : updateStatus === "applied" ? "The revised checkpoint is now part of the assigned path and will enter each student’s next review." : updateStatus === "dismissed" ? "The proposal remains in the audit trail and can be reopened." : "Current has compared the source and prepared the impact. Students still see the teacher-approved version."}</p>
          </section>
        ) : (
          <StudentInspector student={selectedStudent} conceptCount={assignmentPath?.concepts.length ?? 0} onPreview={() => onPreviewStudent(selectedStudent, activeAssignment, curriculumUpdateAvailable && updateStatus === "applied")} onLaunchSession={() => onLaunchStudentSession(selectedStudent, activeAssignment)} />
        )}
      </aside>
      {createClassOpen ? <CreateClassDialog onClose={() => setCreateClassOpen(false)} onCreate={(input) => { onCreateClass(input); setCreateClassOpen(false); }} /> : null}
      {createAssignmentOpen ? <CreateAssignmentDialog className={`${activeClass.name} · ${activeClass.section}`} paths={availablePaths} onClose={() => setCreateAssignmentOpen(false)} onCreate={(input) => { onCreateAssignment(input); setCreateAssignmentOpen(false); }} /> : null}
    </section>
  );
}

function StudentTable({ students, conceptCount, selectedStudentId, onSelect, emptyMessage = "" }: { students: ClassroomStudent[]; conceptCount: number; selectedStudentId: string; onSelect: (id: string) => void; emptyMessage?: string }) {
  return (
    <section className="classroom-roster" aria-label="Student progress">
      <header><span>Student</span><span>Mastery</span><span>Progress</span><span>Status</span><span>Last active</span></header>
      {students.map((student) => (
        <button className={selectedStudentId === student.id ? "selected" : ""} aria-pressed={selectedStudentId === student.id} onClick={() => onSelect(student.id)} key={student.id}>
          <span className="classroom-student-name"><i>{student.initials}</i><span><strong>{student.name}</strong><small>{student.interest}</small></span></span>
          <span className="classroom-mastery"><span><i style={{ width: `${student.mastery}%` }} /></span><strong>{student.mastery}%</strong></span>
          <span>{student.completedConcepts} of {conceptCount}</span>
          <span className={`classroom-student-status ${student.status}`}>{student.status === "needs_support" ? <CircleAlert size={11} /> : <Check size={11} />}{studentStatusLabel(student.status)}</span>
          <span>{student.lastActive}</span>
          <ArrowRight size={13} />
        </button>
      ))}
      {!students.length ? <p className="classroom-roster-empty">{emptyMessage}</p> : null}
    </section>
  );
}

function StudentInspector({ student, conceptCount, onPreview, onLaunchSession }: { student: ClassroomStudent; conceptCount: number; onPreview: () => void; onLaunchSession: () => void }) {
  return (
    <section className="classroom-student-inspector">
      <span>Selected student</span>
      <div className="classroom-inspector-student"><i>{student.initials}</i><div><h2>{student.name}</h2><p>{studentStatusLabel(student.status)} · {student.mastery}% mastery</p></div></div>
      <div className="classroom-inspector-progress"><span><i style={{ width: `${student.mastery}%` }} /></span><small>{student.completedConcepts} of {conceptCount} concepts</small></div>
      {typeof student.lastScore === "number" ? <div className="classroom-latest-evidence"><span>Latest recall</span><strong>{student.lastScore}%</strong><small>{student.recallAttempts ?? 1} recorded attempt{student.recallAttempts === 1 ? "" : "s"}</small></div> : null}
      {student.misconception ? <div className="classroom-inspector-gap"><small>Observed gap</small><p>{student.misconception}</p></div> : <div className="classroom-inspector-gap resolved"><small>Latest recall</small><p>No unresolved misconception.</p></div>}
      <div className="classroom-personalization"><span><Sparkles size={13} /> Personalized support</span><strong>{student.support}</strong><p>Interest: {student.interest}. The class objective and scoring rubric remain unchanged.</p></div>
      <div className="classroom-student-actions">
        <button className="classroom-preview-student" onClick={onPreview}><BookOpenCheck size={14} /> Preview as student</button>
        <button className="classroom-launch-student" onClick={onLaunchSession}><ExternalLink size={14} /> Launch student session</button>
      </div>
    </section>
  );
}
