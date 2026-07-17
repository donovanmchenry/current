import assert from "node:assert/strict";
import test from "node:test";

import {
  classroomEvidenceKey,
  classroomEvidenceAfterRecall,
  classroomPathForAssignment,
  classroomPathForStudent,
  classroomStudentFromInput,
  classroomStudents,
  classroomStudentsWithEvidence,
} from "../lib/classroom-catalog.ts";
import { basePaths } from "../lib/learning-catalog.ts";

test("isolates each student in a distinct classroom path", () => {
  const jordan = classroomStudents.find((student) => student.id === "jordan-brooks");
  const maya = classroomStudents.find((student) => student.id === "maya-chen");
  assert.ok(jordan);
  assert.ok(maya);

  const jordanPath = classroomPathForStudent(jordan);
  const mayaPath = classroomPathForStudent(maya);

  assert.notEqual(jordanPath.id, mayaPath.id);
  assert.equal(jordanPath.classroomStudentId, jordan.id);
  assert.match(jordanPath.description, /Jordan Brooks/);
  assert.match(mayaPath.description, /Maya Chen/);
});

test("turns a successful recall into current classroom evidence", () => {
  const jordan = classroomStudents.find((student) => student.id === "jordan-brooks");
  assert.ok(jordan);

  const evidence = classroomEvidenceAfterRecall(jordan, undefined, {
    score: 90,
    misconception: null,
    feedback: "The rate and units are both present.",
  });

  assert.equal(evidence.status, "on_track");
  assert.equal(evidence.misconception, null);
  assert.equal(evidence.lastActive, "Just now");
  assert.equal(evidence.recallAttempts, 1);
  assert.equal(evidence.lastScore, 90);
  assert.ok(evidence.mastery > jordan.mastery);
});

test("keeps a failed recall visible for teacher intervention", () => {
  const maya = classroomStudents.find((student) => student.id === "maya-chen");
  assert.ok(maya);

  const evidence = classroomEvidenceAfterRecall(maya, undefined, {
    score: 48,
    misconception: "Uses total distance instead of distance per second.",
    feedback: "Rebuild the rate.",
  });

  assert.equal(evidence.status, "needs_support");
  assert.match(evidence.misconception ?? "", /per second/);
  assert.equal(evidence.lastScore, 48);
});

test("creates an isolated student path for each class assignment", () => {
  const student = classroomStudentFromInput("avery-morgan", "Avery Morgan", "Robotics");
  const sourcePath = basePaths.find((path) => path.id === "long-running");
  assert.ok(sourcePath);
  const assignment = {
    id: "systems-period-4-agent-context",
    classId: "systems-period-4",
    pathId: sourcePath.id,
    title: sourcePath.title,
    objective: sourcePath.description,
    dueAt: "2026-07-24T23:59:00.000Z",
    createdAt: "2026-07-17T00:00:00.000Z",
  };

  const path = classroomPathForAssignment(student, assignment, sourcePath);

  assert.equal(path.classroomStudentId, student.id);
  assert.equal(path.classroomAssignmentId, assignment.id);
  assert.equal(path.relatedPathId, sourcePath.id);
  assert.match(path.description, /Robotics/i);
  assert.ok(path.concepts.every((concept) => concept.lesson === undefined));
});

test("keeps classroom evidence scoped to the assignment", () => {
  const student = classroomStudents[0];
  const evidence = classroomEvidenceAfterRecall(student, undefined, {
    score: 42,
    misconception: "Confuses a total with a rate.",
    feedback: "Use units.",
  });
  const evidenceStore = { [classroomEvidenceKey("assignment-a", student.id)]: evidence };

  const assignmentA = classroomStudentsWithEvidence([student], evidenceStore, "assignment-a")[0];
  const assignmentB = classroomStudentsWithEvidence([student], evidenceStore, "assignment-b")[0];

  assert.equal(assignmentA.lastScore, 42);
  assert.equal(assignmentA.status, "needs_support");
  assert.equal(assignmentB.lastScore, undefined);
  assert.equal(assignmentB.status, student.status);
});
