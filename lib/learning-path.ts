export type LessonPracticeType = "multiple_choice" | "true_false" | "open_response";

export type LessonApplication = {
  type: LessonPracticeType;
  prompt: string;
  options: string[];
  correctIndex: number;
  rubric: string[];
  explanation: string;
};

export type GeneratedLesson = {
  title: string;
  overview: string;
  reading: string[];
  keyPoints: string[];
  recallPrompt: string;
  recallRubric: string[];
  visualSteps: string[];
  example: string;
  application: LessonApplication;
  reflectionPrompt: string;
  sourceIds: string[];
  mode: "demo" | "live";
};

export type LearningConcept = {
  title: string;
  objective: string;
  summary?: string;
  checkpoints?: string[];
  sourceIds?: string[];
  sourceNote?: string;
  updatedAt?: string;
  lesson?: GeneratedLesson;
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
