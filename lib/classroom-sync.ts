import type { ClassroomStudentEvidence } from "./classroom-catalog";

export const classroomEvidenceEventKey = "current-classroom-evidence-event-v1";

export type ClassroomEvidenceEvent = {
  evidenceKey: string;
  evidence: ClassroomStudentEvidence;
};

export function classroomEvidenceEvent(evidenceKey: string, evidence: ClassroomStudentEvidence): ClassroomEvidenceEvent {
  return { evidenceKey, evidence };
}

export function parseClassroomEvidenceEvent(value: string | null): ClassroomEvidenceEvent | null {
  if (!value) return null;
  try {
    const candidate = JSON.parse(value) as Partial<ClassroomEvidenceEvent>;
    if (typeof candidate.evidenceKey !== "string" || !candidate.evidenceKey.includes(":") || candidate.evidenceKey.length > 320) return null;
    if (!candidate.evidence || typeof candidate.evidence !== "object") return null;
    const evidence = candidate.evidence as Partial<ClassroomStudentEvidence>;
    if (typeof evidence.mastery !== "number" || typeof evidence.completedConcepts !== "number" || typeof evidence.lastActive !== "string") return null;
    if (evidence.status !== "on_track" && evidence.status !== "needs_support" && evidence.status !== "ahead") return null;
    if (evidence.misconception !== null && typeof evidence.misconception !== "string") return null;
    if (typeof evidence.recallAttempts !== "number" || (evidence.lastScore !== null && typeof evidence.lastScore !== "number")) return null;
    return {
      evidenceKey: candidate.evidenceKey,
      evidence: {
        mastery: Math.max(0, Math.min(100, Math.round(evidence.mastery))),
        completedConcepts: Math.max(0, Math.min(100, Math.round(evidence.completedConcepts))),
        status: evidence.status,
        lastActive: evidence.lastActive.slice(0, 40),
        misconception: evidence.misconception,
        recallAttempts: Math.max(0, Math.round(evidence.recallAttempts)),
        lastScore: evidence.lastScore === null ? null : Math.max(0, Math.min(100, Math.round(evidence.lastScore))),
      },
    };
  } catch {
    return null;
  }
}
