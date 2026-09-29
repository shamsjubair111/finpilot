-- AlterTable
ALTER TABLE "Commitment" ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "anchorDay" INTEGER,
ADD COLUMN     "autoPost" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "frequency" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN     "lastRemindedFor" TIMESTAMP(3),
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'expense';

