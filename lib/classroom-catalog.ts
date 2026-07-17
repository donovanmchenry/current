import type { LearningPath } from "./learning-path";

export type ClassroomStudentStatus = "on_track" | "needs_support" | "ahead";

export type ClassroomStudent = {
  id: string;
  name: string;
  initials: string;
  interest: string;
  mastery: number;
  completedConcepts: number;
  status: ClassroomStudentStatus;
  lastActive: string;
  misconception: string | null;
  support: string;
  example: string;
  applicationPrompt: string;
  applicationOptions: string[];
  applicationCorrectIndex: number;
};

export const classroomStudents: ClassroomStudent[] = [
  {
    id: "maya-chen",
    name: "Maya Chen",
    initials: "MC",
    interest: "Spaceflight",
    mastery: 82,
    completedConcepts: 3,
    status: "on_track",
    lastActive: "12 min ago",
    misconception: null,
    support: "Rover telemetry and launch data",
    example: "A rover travels 18 meters every 3 seconds. Its position increases by 6 meters each second, so the slope is 6 meters per second.",
    applicationPrompt: "A rover starts 4 meters from its base and travels 6 meters each second. Which equation models its distance after x seconds?",
    applicationOptions: ["y = 4x + 6", "y = 6x + 4", "y = 10x", "y = 6x"],
    applicationCorrectIndex: 1,
  },
  {
    id: "jordan-brooks",
    name: "Jordan Brooks",
    initials: "JB",
    interest: "Basketball",
    mastery: 61,
    completedConcepts: 2,
    status: "needs_support",
    lastActive: "28 min ago",
    misconception: "Treats slope as the total change instead of a rate per unit.",
    support: "Scoring runs with unit labels at every step",
    example: "A team scores 12 points over 4 minutes. The score changes by 3 points per minute, so the slope is 3, not 12.",
    applicationPrompt: "A team begins the quarter with 20 points and scores 3 points per minute. Which equation models its score after x minutes?",
    applicationOptions: ["y = 20x + 3", "y = 3x + 20", "y = 23x", "y = 3x"],
    applicationCorrectIndex: 1,
  },
  {
    id: "sofia-patel",
    name: "Sofia Patel",
    initials: "SP",
    interest: "Music production",
    mastery: 76,
    completedConcepts: 3,
    status: "on_track",
    lastActive: "1 hr ago",
    misconception: null,
    support: "Tempo changes and timeline visualizations",
    example: "A track begins with 8 beats and adds 4 beats each measure. The starting 8 is the intercept and 4 beats per measure is the slope.",
    applicationPrompt: "A loop begins with 8 beats and adds 4 beats each measure. Which equation gives the total beats after x measures?",
    applicationOptions: ["y = 8x + 4", "y = 4x + 8", "y = 12x", "y = 4x"],
    applicationCorrectIndex: 1,
  },
  {
    id: "eli-thompson",
    name: "Eli Thompson",
    initials: "ET",
    interest: "Skateboarding",
    mastery: 48,
    completedConcepts: 1,
    status: "needs_support",
    lastActive: "Yesterday",
    misconception: "Uses the change in height without dividing by the horizontal distance.",
    support: "Ramp diagrams with rise and run separated",
    example: "A ramp rises 3 feet over a horizontal run of 12 feet. Its slope is 3 divided by 12, or one quarter.",
    applicationPrompt: "A ramp begins 2 feet above the ground and rises 1 foot for every 4 horizontal feet. Which equation models its height?",
    applicationOptions: ["y = 4x + 2", "y = 0.25x + 2", "y = 2x + 0.25", "y = 0.25x"],
    applicationCorrectIndex: 1,
  },
  {
    id: "amara-wilson",
    name: "Amara Wilson",
    initials: "AW",
    interest: "Cooking",
    mastery: 69,
    completedConcepts: 2,
    status: "on_track",
    lastActive: "2 hrs ago",
    misconception: null,
    support: "Recipe scaling with tables before equations",
    example: "A recipe starts with 1 cup of broth and adds 2 cups for each batch. One is the starting value and 2 cups per batch is the rate.",
    applicationPrompt: "A recipe starts with 1 cup of broth and adds 2 cups per batch. Which equation models the total after x batches?",
    applicationOptions: ["y = x + 2", "y = 2x + 1", "y = 3x", "y = 2x"],
    applicationCorrectIndex: 1,
  },
  {
    id: "noah-garcia",
    name: "Noah Garcia",
    initials: "NG",
    interest: "Game design",
    mastery: 57,
    completedConcepts: 2,
    status: "needs_support",
    lastActive: "3 hrs ago",
    misconception: "Reads the y-intercept as the first change instead of the starting value.",
    support: "Score counters that separate starting points from points earned",
    example: "A player begins with 100 bonus points and earns 25 points each level. The intercept is the starting 100; the slope is 25 per level.",
    applicationPrompt: "A player starts with 100 points and earns 25 points each level. Which equation models the score after x levels?",
    applicationOptions: ["y = 100x + 25", "y = 25x + 100", "y = 125x", "y = 25x"],
    applicationCorrectIndex: 1,
  },
  {
    id: "lucas-martin",
    name: "Lucas Martin",
    initials: "LM",
    interest: "Public transit",
    mastery: 88,
    completedConcepts: 4,
    status: "ahead",
    lastActive: "4 hrs ago",
    misconception: null,
    support: "Compare competing fare models",
    example: "One transit pass costs $12 plus $2 per ride. Another has no fee and costs $3.50 per ride. Their equations reveal when each is cheaper.",
    applicationPrompt: "A pass costs $12 plus $2 per ride. Which equation models the total cost after x rides?",
    applicationOptions: ["y = 12x + 2", "y = 2x + 12", "y = 14x", "y = 2x"],
    applicationCorrectIndex: 1,
  },
  {
    id: "priya-shah",
    name: "Priya Shah",
    initials: "PS",
    interest: "Environmental science",
    mastery: 73,
    completedConcepts: 3,
    status: "on_track",
    lastActive: "Yesterday",
    misconception: null,
    support: "Water-level data across tables and graphs",
    example: "A reservoir begins at 40 feet and rises 1.5 feet each day. The intercept is 40 feet and the slope is 1.5 feet per day.",
    applicationPrompt: "A reservoir begins at 40 feet and rises 1.5 feet each day. Which equation models its depth after x days?",
    applicationOptions: ["y = 40x + 1.5", "y = 1.5x + 40", "y = 41.5x", "y = 1.5x"],
    applicationCorrectIndex: 1,
  },
];

export function classroomPathForStudent(student: ClassroomStudent, curriculumUpdateApplied = false): LearningPath {
  return {
    id: "classroom-linear-relationships",
    title: "Linear relationships",
    description: `Assigned in Algebra I and adapted with ${student.interest.toLowerCase()} contexts for ${student.name}.`,
    progress: student.mastery,
    next: "Slope as a rate",
    status: "Assigned by Ms. Rodriguez",
    relatedPathId: null,
    userCreated: true,
    createdAt: "2026-07-17T00:00:00.000Z",
    sources: [
      {
        id: "ccss-8-ee-b-5",
        kind: "link",
        title: "CCSS 8.EE.B.5",
        detail: "Graph proportional relationships and interpret unit rate as slope",
        href: "https://www.thecorestandards.org/Math/Content/8/EE/B/5/",
      },
    ],
    concepts: [
      {
        title: "Slope as a rate",
        objective: "Interpret slope as a rate of change with correct units.",
        summary: "Slope describes how much one quantity changes for each unit of another quantity.",
        checkpoints: ["Change in output", "Change in input", "Rate units"],
        sourceIds: ["ccss-8-ee-b-5"],
        sourceNote: "The standard connects unit rate to slope and asks students to compare proportional relationships represented in different ways.",
        lesson: {
          provenance: "Adapted from teacher-approved materials",
          title: "Slope tells you what changes each time",
          overview: `This version uses ${student.interest.toLowerCase()} because that context is useful to ${student.name}; the learning objective and rubric remain the same for the class.`,
          reading: [
            "Slope is a rate, not just a difference. It compares the change in an output with the change in an input.",
            student.example,
            "Keep the units attached. They tell you what one unit of input produces and prevent a total change from being mistaken for a rate.",
          ],
          keyPoints: ["Slope is change in output divided by change in input.", "A slope should be interpreted with units.", "Personalized context does not change the class objective."],
          recallPrompt: "Without looking back, explain what slope measures and why its units matter.",
          recallRubric: ["Names both quantities being compared", "Describes change per one unit", "Includes appropriate units"],
          visualSteps: ["Identify the two changing quantities", "Find the change in each", "Divide output change by input change", "Attach rate units"],
          example: student.example,
          application: {
            type: "multiple_choice",
            prompt: student.applicationPrompt,
            options: student.applicationOptions,
            correctIndex: student.applicationCorrectIndex,
            rubric: ["Uses the rate as the coefficient of x", "Uses the starting value as the intercept"],
            explanation: "The rate multiplies x, while the initial amount is added as the y-intercept.",
          },
          reflectionPrompt: `Where else in ${student.interest.toLowerCase()} could a rate of change help you predict what happens next?`,
          sourceIds: ["ccss-8-ee-b-5"],
          mode: "demo",
        },
      },
      {
        title: "Intercept as a starting value",
        objective: "Interpret the y-intercept as the value present before change begins.",
        summary: "The y-intercept records the output when the input is zero.",
        checkpoints: ["Input equals zero", "Initial condition", "Contextual units"],
        sourceIds: ["ccss-8-ee-b-5"],
      },
      {
        title: "Build an equation",
        objective: "Translate a starting value and constant rate into y = mx + b.",
        summary: "A linear model combines a constant rate with an initial value.",
        checkpoints: ["Identify m", "Identify b", "Check the model against a value"],
        sourceIds: ["ccss-8-ee-b-5"],
      },
      {
        title: "Compare representations",
        objective: curriculumUpdateApplied
          ? "Compare slope and intercept across tables, graphs, equations, and verbal descriptions."
          : "Identify slope and intercept from an equation.",
        summary: "Equivalent representations expose the same rate and starting value in different forms.",
        checkpoints: curriculumUpdateApplied
          ? ["Read rate from a table", "Read intercept from a graph", "Match equations to verbal descriptions"]
          : ["Identify the coefficient", "Identify the constant term"],
        sourceIds: ["ccss-8-ee-b-5"],
      },
    ],
  };
}
