ALTER TABLE "exercise"
ADD COLUMN "defaultTargetValue" INTEGER NOT NULL DEFAULT 8;

UPDATE "exercise"
SET "defaultTargetValue" = CASE
  WHEN "targetType" = 'DURATION'::"TargetType" THEN 30
  WHEN "resistanceType" = 'BODYWEIGHT'::"ResistanceType" THEN 12
  ELSE 8
END;