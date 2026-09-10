export type ResistanceType = "WEIGHTED" | "BODYWEIGHT";
export type TargetType = "REPETITIONS" | "DURATION";

export type Exercise = {
  id: string;
  name: string;
  resistanceType: ResistanceType;
  targetType: TargetType;
};

export type PlannedExercise = {
  id: string;
  exerciseId: string;
  setCount: number;
  targetValue: number;
  weightGrams: number | null;
  exercise: Exercise;
};

export type WorkoutDay = {
  id: string;
  name: string;
  suggestedWeekday: number | null;
  plannedExercises: PlannedExercise[];
};

export type Plan = {
  id: string;
  name: string;
  workoutDays: WorkoutDay[];
};

export type SetResult = {
  setIndex: number;
  actualValue: number | null;
  actualWeightGrams: number | null;
  skipped: boolean;
};

export type SessionExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  resistanceType: ResistanceType;
  targetType: TargetType;
  setCount: number;
  targetValue: number;
  weightGrams: number | null;
  source: "PLANNED" | "ADDED";
  removedAt: string | null;
  setResults: SetResult[];
};

export type WorkoutSession = {
  id: string;
  status: "ACTIVE" | "PAUSED";
  timeZone: string;
  localStartDate: string;
  startedAt: string;
  pausedAt: string | null;
  completedAt: string | null;
  trainingTimeSeconds: number | null;
  exercises: SessionExercise[];
};

export type WorkspaceView = "today" | "plans" | "exercises" | "training";
