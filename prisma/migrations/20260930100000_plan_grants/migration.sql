-- CreateTable
CREATE TABLE "PlanGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "reference" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "grantedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanGrant_userId_idx" ON "PlanGrant"("userId");

-- CreateIndex
CREATE INDEX "PlanGrant_createdAt_idx" ON "PlanGrant"("createdAt");

