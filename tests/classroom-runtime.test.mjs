import assert from "node:assert/strict";
import test from "node:test";

import {
  classroomEvidenceAfterRecall,
  classroomPathForStudent,
  classroomStudents,
} from "../lib/classroom-catalog.ts";

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
