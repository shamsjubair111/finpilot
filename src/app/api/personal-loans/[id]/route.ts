import { db } from "@/lib/server/db";
import { itemRoutes } from "@/lib/server/crud";
import { personalLoanCheck } from "@/lib/server/personal-loan-check";
import { personalLoanSchema } from "@/lib/validation";

export const { GET, PATCH, DELETE } = itemRoutes(db.personalLoan, personalLoanSchema, personalLoanCheck);
