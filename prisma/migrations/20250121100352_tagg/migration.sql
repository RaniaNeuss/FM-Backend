/*
  Warnings:

  - A unique constraint covering the columns `[address]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Tag_address_key" ON "Tag"("address");
