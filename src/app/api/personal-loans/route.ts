import { db } from "@/lib/server/db";
import { collectionRoutes } from "@/lib/server/crud";
import { personalLoanCheck } from "@/lib/server/personal-loan-check";
import { personalLoanSchema } from "@/lib/validation";

export const { GET, POST } = collectionRoutes(db.personalLoan, personalLoanSchema, { date: "desc" }, personalLoanCheck);
