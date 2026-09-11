CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE', 'FULL_BODY', 'CARDIO');

ALTER TABLE "exercise"
ADD COLUMN "muscleGroup" "MuscleGroup" NOT NULL DEFAULT 'FULL_BODY';

UPDATE "exercise"
SET "muscleGroup" = CASE
  WHEN "name" IN ('杠铃深蹲', '罗马尼亚硬拉') THEN 'LEGS'::"MuscleGroup"
  WHEN "name" IN ('杠铃卧推', '标准俯卧撑') THEN 'CHEST'::"MuscleGroup"
  WHEN "name" IN ('俯身划船', '引体向上') THEN 'BACK'::"MuscleGroup"
  WHEN "name" = '站姿推举' THEN 'SHOULDERS'::"MuscleGroup"
  WHEN "name" = '平板支撑' THEN 'CORE'::"MuscleGroup"
  ELSE 'FULL_BODY'::"MuscleGroup"
END;