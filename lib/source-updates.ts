import type { LearningConcept, SourceConceptPatch, SourceSnapshot, SourceUpdateProposal } from "./learning-path";

export function normalizeSourceContent(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 40_000);
}

export function sourceFingerprint(value: string) {
  const normalized = normalizeSourceContent(value);
  let hash = 2166136261;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createSourceSnapshot(content: string, capturedAt = new Date().toISOString()): SourceSnapshot {
  const normalized = normalizeSourceContent(content);
  return { content: normalized, capturedAt, fingerprint: sourceFingerprint(normalized) };
}

function terms(value: string) {
  return new Set(value.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) ?? []);
}

function overlap(left: string, right: string) {
  const leftTerms = terms(left);
  const rightTerms = terms(right);
  if (!leftTerms.size || !rightTerms.size) return 0;
  const shared = [...leftTerms].filter((term) => rightTerms.has(term)).length;
  return shared / Math.max(leftTerms.size, rightTerms.size);
}

function sentences(value: string) {
  return normalizeSourceContent(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 45 && sentence.length <= 420)
    .slice(0, 160);
}

export function hasMeaningfulSourceChange(previous: SourceSnapshot | undefined, latest: SourceSnapshot) {
  if (!previous || !previous.content) return true;
  if (previous.fingerprint === latest.fingerprint) return false;
  const oldTerms = terms(previous.content);
  const newTerms = terms(latest.content);
  if (!oldTerms.size || !newTerms.size) return previous.content !== latest.content;
  const shared = [...oldTerms].filter((term) => newTerms.has(term)).length;
  return shared / Math.max(oldTerms.size, newTerms.size) < 0.985;
}

export function fallbackSourceUpdate(input: {
  pathId: string;
  sourceId: string;
  sourceTitle: string;
  sourceHref: string;
  previous?: SourceSnapshot;
  latest: SourceSnapshot;
  concepts: LearningConcept[];
}): SourceUpdateProposal {
  const oldSentences = sentences(input.previous?.content ?? "");
  const newSentences = sentences(input.latest.content);
  const added = newSentences.find((sentence) => !oldSentences.some((oldSentence) => overlap(oldSentence, sentence) >= 0.78))
    ?? newSentences[0]
    ?? input.latest.content.slice(0, 360);
  const removed = oldSentences.find((sentence) => !newSentences.some((newSentence) => overlap(newSentence, sentence) >= 0.78))
    ?? oldSentences[0]
    ?? "No earlier source excerpt was stored.";
  const rankedConcepts = input.concepts.map((concept, conceptIndex) => ({
    concept,
    conceptIndex,
    score: overlap(`${concept.title} ${concept.objective} ${concept.sourceNote ?? ""}`, added),
  })).sort((left, right) => right.score - left.score);
  const affected = rankedConcepts.filter((candidate) => candidate.score > 0).slice(0, 2);
  const selected = affected.length ? affected : rankedConcepts.slice(0, 1);
  const patches: SourceConceptPatch[] = selected.map(({ concept, conceptIndex }) => ({
    conceptIndex,
    summary: concept.summary ?? concept.objective,
    sourceNote: added.slice(0, 420),
    checkpoints: [...new Set([...(concept.checkpoints ?? []), "Explain what the refreshed source changes"])].slice(0, 5),
  }));

  return {
    id: `source-update-${input.pathId}-${input.sourceId}-${input.latest.fingerprint}`,
    pathId: input.pathId,
    sourceId: input.sourceId,
    sourceTitle: input.sourceTitle,
    sourceHref: input.sourceHref,
    detectedAt: input.latest.capturedAt,
    status: "ready",
    summary: `${input.sourceTitle} contains evidence that was not present in the stored snapshot.`,
    beforeExcerpt: removed.slice(0, 420),
    afterExcerpt: added.slice(0, 420),
    affectedConceptIndexes: patches.map((patch) => patch.conceptIndex),
    patches,
    latestSnapshot: input.latest,
    mode: "demo",
  };
}
