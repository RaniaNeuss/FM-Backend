/*
  Warnings:

  - A unique constraint covering the columns `[alarmId,ontime]` on the table `AlarmHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AlarmHistory_alarmId_ontime_key" ON "AlarmHistory"("alarmId", "ontime");
