import type {
  AffordabilityResult,
  AffordabilityStatus,
  GoalPriority,
  PurchaseStrategy,
} from "@/types/finance";

export interface AffordabilityContext {
  price: number;
  savedAmount: number;
  priority: GoalPriority;
  monthlyIncome: number;
  monthlyFreeCash: number; // surplus available after budgeted expenses
  liquidSavings: number; // savings available beyond the emergency reserve
  emergencyFundCoverage: number; // 0-100
}

const PRIORITY_POINTS: Record<GoalPriority, number> = {
  high: 10,
  medium: 6,
  low: 3,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Produces a 0-100 affordability score based on mock-but-consistent
 * heuristics: price relative to income, price relative to liquid savings,
 * emergency fund health, monthly free cash flow, and stated priority.
 *
 * This intentionally trades academic rigor for a result that "feels"
 * financially sound and reacts sensibly as inputs change.
 */
export function calculateAffordabilityScore(
  ctx: AffordabilityContext
): AffordabilityResult {
  const remaining = Math.max(0, ctx.price - ctx.savedAmount);

  // 1. Price vs monthly income (max 30)
  const incomeRatio = ctx.monthlyIncome > 0 ? ctx.price / ctx.monthlyIncome : 10;
  const incomeScore = clamp(30 - incomeRatio * 3, 0, 30);

  // 2. Remaining amount vs liquid savings (max 25)
  const savingsRatio =
    remaining === 0 ? 0 : remaining / Math.max(ctx.liquidSavings, 1);
  const savingsScore = remaining === 0 ? 25 : clamp(25 - savingsRatio * 25, 0, 25);

  // 3. Emergency fund health (max 20)
  const efMultiplier = remaining > ctx.liquidSavings ? 0.6 : 1;
  const emergencyScore = clamp(ctx.emergencyFundCoverage / 100, 0, 1) * 20 * efMultiplier;

  // 4. Monthly free cash flow runway (max 15)
  const monthsNeeded = remaining / Math.max(ctx.monthlyFreeCash, 1);
  const freeCashScore = clamp(15 - (monthsNeeded - 1) * 1.5, 0, 15);

  // 5. Stated priority (max 10)
  const priorityScore = PRIORITY_POINTS[ctx.priority];

  const rawScore = incomeScore + savingsScore + emergencyScore + freeCashScore + priorityScore;
  const score = Math.round(clamp(rawScore, 0, 100));

  const { status, label } = getStatusForScore(score);

  const reasons = buildReasons({
    ctx,
    remaining,
    incomeScore,
    savingsScore,
    emergencyScore,
    freeCashScore,
    monthsNeeded,
  });

  return { score, status, label, reasons };
}

function getStatusForScore(score: number): { status: AffordabilityStatus; label: string } {
  if (score >= 85) return { status: "safe", label: "Safe to Buy" };
  if (score >= 65) return { status: "reasonable", label: "Save a Little Longer" };
  if (score >= 45) return { status: "wait", label: "Wait" };
  return { status: "high_risk", label: "Not Recommended Yet" };
}

function buildReasons(params: {
  ctx: AffordabilityContext;
  remaining: number;
  incomeScore: number;
  savingsScore: number;
  emergencyScore: number;
  freeCashScore: number;
  monthsNeeded: number;
}): string[] {
  const { ctx, remaining, incomeScore, savingsScore, emergencyScore, freeCashScore, monthsNeeded } =
    params;
  const reasons: string[] = [];

  if (incomeScore >= 22) {
    reasons.push("Price is a small fraction of your monthly income.");
  } else if (incomeScore <= 10) {
    reasons.push("Price is large relative to your monthly income.");
  }

  if (remaining === 0) {
    reasons.push("You've already saved the full amount.");
  } else if (savingsScore <= 8) {
    reasons.push("Remaining amount is a large share of your available savings.");
  } else if (savingsScore >= 18) {
    reasons.push("Remaining amount is easily covered by your available savings.");
  }

  if (ctx.emergencyFundCoverage < 60 && remaining > 0) {
    reasons.push("Your emergency fund isn't fully built up yet.");
  } else if (emergencyScore >= 16) {
    reasons.push("Your emergency fund is healthy enough to absorb this.");
  }

  if (monthsNeeded > 6 && remaining > 0) {
    reasons.push("Would take a while to save using free cash flow alone.");
  } else if (freeCashScore >= 12) {
    reasons.push("Fits comfortably within your monthly free cash flow.");
  }

  if (ctx.priority === "high") {
    reasons.push("Marked as a high priority item.");
  } else if (ctx.priority === "low") {
    reasons.push("Marked as a low priority — safe to delay.");
  }

  return reasons;
}

/**
 * Builds Comfortable / Balanced / Aggressive savings strategies for a
 * purchase given the amount still needed.
 */
export function calculatePurchaseStrategies(remaining: number): PurchaseStrategy[] {
  if (remaining <= 0) {
    return [
      { name: "Comfortable", monthlyContribution: 0, estimatedMonths: 0, description: "Already fully saved." },
      { name: "Balanced", monthlyContribution: 0, estimatedMonths: 0, description: "Already fully saved." },
      { name: "Aggressive", monthlyContribution: 0, estimatedMonths: 0, description: "Already fully saved." },
    ];
  }

  const comfortable = Math.round((remaining / 7) / 100) * 100 || Math.ceil(remaining / 7);
  const balanced = Math.round((remaining / 5) / 100) * 100 || Math.ceil(remaining / 5);
  const aggressive = Math.round((remaining / 4) / 100) * 100 || Math.ceil(remaining / 4);

  return [
    {
      name: "Comfortable",
      monthlyContribution: comfortable,
      estimatedMonths: Math.ceil(remaining / comfortable),
      description: "Lower monthly impact, longer timeline.",
    },
    {
      name: "Balanced",
      monthlyContribution: balanced,
      estimatedMonths: Math.ceil(remaining / balanced),
      description: "Moderate pace without straining your budget.",
    },
    {
      name: "Aggressive",
      monthlyContribution: aggressive,
      estimatedMonths: Math.ceil(remaining / aggressive),
      description: "Fastest path, requires cutting other spending.",
    },
  ];
}

export function calculatePurchaseImpact(params: {
  remaining: number;
  monthlyContribution: number;
  emergencyFundCurrent: number;
  emergencyFundTarget: number;
  otherGoalsMonthlyTotal: number;
  monthlyFreeCash: number;
}) {
  const {
    remaining,
    monthlyContribution,
    emergencyFundCurrent,
    emergencyFundTarget,
    otherGoalsMonthlyTotal,
    monthlyFreeCash,
  } = params;

  const months = monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : Infinity;
  const remainingFreeCash = monthlyFreeCash - monthlyContribution;
  const goalsDelayed = remainingFreeCash < otherGoalsMonthlyTotal;
  const emergencyFundImpact =
    remainingFreeCash < 0
      ? "May require dipping into savings, delaying emergency fund growth."
      : "Emergency fund contributions remain unaffected.";
  const emergencyFundCoverageAfter = Math.min(
    100,
    Math.round((emergencyFundCurrent / emergencyFundTarget) * 100)
  );

  return {
    estimatedMonths: months,
    remainingFreeCashAfterContribution: remainingFreeCash,
    otherGoalsDelayed: goalsDelayed,
    emergencyFundImpact,
    emergencyFundCoverageAfter,
  };
}
