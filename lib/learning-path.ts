export type LearningConcept = {
  title: string;
  objective: string;
  summary?: string;
  checkpoints?: string[];
};

export type LearningSource = {
  id: string;
  kind: "file" | "link";
  title: string;
  href?: string;
  detail?: string;
};

export type LearningPath = {
  id: string;
  title: string;
  description: string;
  progress: number;
  concepts: LearningConcept[];
  next: string;
  status: string;
  relatedPathId?: string | null;
  sources?: LearningSource[];
  userCreated?: boolean;
  createdAt?: string;
};

export type GeneratedLearningPath = {
  title: string;
  description: string;
  concepts: LearningConcept[];
  relatedPathId: string | null;
  mode: "demo" | "live";
};
