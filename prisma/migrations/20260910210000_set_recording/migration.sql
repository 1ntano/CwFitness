CREATE TYPE "SessionExerciseSource" AS ENUM ('PLANNED', 'ADDED');
ALTER TABLE "session_exercise" ADD COLUMN "source" "SessionExerciseSource" NOT NULL DEFAULT 'PLANNED', ADD COLUMN "removedAt" TIMESTAMP(3);
CREATE TABLE "session_set_result" (
  "id" TEXT NOT NULL,
  "sessionExerciseId" TEXT NOT NULL,
  "setIndex" INTEGER NOT NULL,
  "actualValue" INTEGER,
  "actualWeightGrams" INTEGER,
  "skipped" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "session_set_result_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "session_set_result_sessionExerciseId_setIndex_key" ON "session_set_result"("sessionExerciseId", "setIndex");
ALTER TABLE "session_set_result" ADD CONSTRAINT "session_set_result_sessionExerciseId_fkey" FOREIGN KEY ("sessionExerciseId") REFERENCES "session_exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
