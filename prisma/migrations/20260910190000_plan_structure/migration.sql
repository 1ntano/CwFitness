-- CreateEnum
CREATE TYPE "ResistanceType" AS ENUM ('WEIGHTED', 'BODYWEIGHT');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('REPETITIONS', 'DURATION');

-- CreateTable
CREATE TABLE "exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resistanceType" "ResistanceType" NOT NULL,
    "targetType" "TargetType" NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_day" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "suggestedWeekday" INTEGER,
    "workoutPlanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workout_day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_exercise" (
    "id" TEXT NOT NULL,
    "workoutDayId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "setCount" INTEGER NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "weightGrams" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "planned_exercise_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "exercise_userId_idx" ON "exercise"("userId");
CREATE INDEX "workout_day_workoutPlanId_idx" ON "workout_day"("workoutPlanId");
CREATE UNIQUE INDEX "planned_exercise_workoutDayId_exerciseId_key" ON "planned_exercise"("workoutDayId", "exerciseId");
CREATE INDEX "planned_exercise_exerciseId_idx" ON "planned_exercise"("exerciseId");

ALTER TABLE "exercise" ADD CONSTRAINT "exercise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workout_day" ADD CONSTRAINT "workout_day_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "workout_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planned_exercise" ADD CONSTRAINT "planned_exercise_workoutDayId_fkey" FOREIGN KEY ("workoutDayId") REFERENCES "workout_day"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planned_exercise" ADD CONSTRAINT "planned_exercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
