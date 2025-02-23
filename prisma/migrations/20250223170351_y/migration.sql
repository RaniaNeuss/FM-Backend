/*
  Warnings:

  - A unique constraint covering the columns `[deviceId,address]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Tag_deviceId_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Tag_deviceId_address_key" ON "Tag"("deviceId", "address");
