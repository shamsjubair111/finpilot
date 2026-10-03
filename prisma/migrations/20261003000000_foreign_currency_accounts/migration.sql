-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "currency" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "originalAmount" DOUBLE PRECISION,
ADD COLUMN     "originalCurrency" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "exchangeRates" JSONB;

