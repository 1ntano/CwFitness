ALTER TABLE "session_set_result" ADD COLUMN "operationId" TEXT;
CREATE UNIQUE INDEX "session_set_result_operationId_key" ON "session_set_result"("operationId");
