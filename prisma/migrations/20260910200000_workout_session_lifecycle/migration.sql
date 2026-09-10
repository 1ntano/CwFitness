-- CreateEnum
CREATE TYPE "WorkoutSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "workout_session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workoutPlanId" TEXT NOT NULL,
  "workoutDayId" TEXT,
  "workoutPlanName" TEXT NOT NULL,
  "workoutDayName" TEXT NOT NULL,
  "timeZone" TEXT NOT NULL,
  "localStartDate" TEXT NOT NULL,
  "status" "WorkoutSessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "pausedAt" TIMESTAMP(3),
  "pausedDurationMs" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "trainingTimeSeconds" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "workout_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_exercise" (
  "id" TEXT NOT NULL,
  "workoutSessionId" TEXT NOT NULL,
  "exerciseId" TEXT NOT NULL,
  "exerciseName" TEXT NOT NULL,
  "resistanceType" "ResistanceType" NOT NULL,
  "targetType" "TargetType" NOT NULL,
  "setCount" INTEGER NOT NULL,
  "targetValue" INTEGER NOT NULL,
  "weightGrams" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "session_exercise_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "workout_session_userId_status_idx" ON "workout_session"("userId", "status");
CREATE INDEX "workout_session_workoutPlanId_idx" ON "workout_session"("workoutPlanId");
CREATE UNIQUE INDEX "workout_session_one_in_progress_per_user" ON "workout_session"("userId") WHERE "status" IN ('ACTIVE', 'PAUSED');
CREATE INDEX "session_exercise_workoutSessionId_idx" ON "session_exercise"("workoutSessionId");
CREATE INDEX "session_exercise_exerciseId_idx" ON "session_exercise"("exerciseId");

ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "workout_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_workoutDayId_fkey" FOREIGN KEY ("workoutDayId") REFERENCES "workout_day"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "session_exercise" ADD CONSTRAINT "session_exercise_workoutSessionId_fkey" FOREIGN KEY ("workoutSessionId") REFERENCES "workout_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "session_exercise" ADD CONSTRAINT "session_exercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
