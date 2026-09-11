export const MUSCLE_GROUPS = [
  "CHEST",
  "BACK",
  "LEGS",
  "SHOULDERS",
  "ARMS",
  "CORE",
  "FULL_BODY",
  "CARDIO",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  CHEST: "胸部",
  BACK: "背部",
  LEGS: "下肢",
  SHOULDERS: "肩部",
  ARMS: "手臂",
  CORE: "核心",
  FULL_BODY: "全身",
  CARDIO: "心肺",
};

export function muscleGroupLabel(group: MuscleGroup) {
  return MUSCLE_GROUP_LABELS[group];
}