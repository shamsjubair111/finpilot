-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "externalId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN     "planExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_userId_externalId_key" ON "Transaction"("userId", "externalId");


-- Existing users start on a 14-day Pro trial so the new plan limits don't surprise them.
UPDATE "User" SET "plan" = 'pro', "planExpiresAt" = NOW() + INTERVAL '14 days';
