"use client";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SliderField } from "./slider-field";
import { RotateCcw } from "lucide-react";
import type { ScenarioInput } from "@/types/finance";
import { scenarioPresets } from "@/lib/constants";
import { t } from "@/lib/i18n";

export function ScenarioInputsPanel({
  input,
  onChange,
  onReset,
}: {
  input: ScenarioInput;
  onChange: (patch: Partial<ScenarioInput>) => void;
  onReset: () => void;
}) {
  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle>{t("What If?")}</CardTitle>
        <CardAction><Button variant="ghost" size="sm" className="gap-1.5" onClick={onReset}>
          <RotateCcw className="size-3.5" />
          {t("Reset")}
        </Button></CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {scenarioPresets.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              className="h-auto flex-col items-start gap-0.5 py-2 text-left"
              onClick={() => onChange(preset.overrides)}
              title={t(preset.description)}
            >
              <span className="text-xs font-semibold">{t(preset.name)}</span>
            </Button>
          ))}
        </div>

        <Separator />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("Scenario Period")}</label>
          <Select
            value={String(input.periodMonths)}
            onValueChange={(v) => onChange({ periodMonths: Number(v) as ScenarioInput["periodMonths"] })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">{t("3 months")}</SelectItem>
              <SelectItem value="6">{t("6 months")}</SelectItem>
              <SelectItem value="12">{t("12 months")}</SelectItem>
              <SelectItem value="24">{t("24 months")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Income")}</p>
          <SliderField
            id="salary"
            label={t("Monthly Salary")}
            value={input.monthlySalary}
            onChange={(v) => onChange({ monthlySalary: v })}
            min={20000}
            max={200000}
            step={1000}
          />
          <SliderField
            id="salary-increase"
            label={t("Expected Salary Increase")}
            value={input.salaryIncrease}
            onChange={(v) => onChange({ salaryIncrease: v })}
            min={0}
            max={50000}
            step={500}
          />
          <SliderField
            id="bonus"
            label={t("Optional Bonus (month 1)")}
            value={input.bonus}
            onChange={(v) => onChange({ bonus: v })}
            min={0}
            max={150000}
            step={1000}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Spending")}</p>
          <SliderField
            id="essentials"
            label={t("Monthly Essential Expenses")}
            value={input.essentialExpenses}
            onChange={(v) => onChange({ essentialExpenses: v })}
            min={5000}
            max={100000}
            step={500}
          />
          <SliderField
            id="lifestyle"
            label={t("Lifestyle Spending")}
            value={input.lifestyleSpending}
            onChange={(v) => onChange({ lifestyleSpending: v })}
            min={0}
            max={80000}
            step={500}
          />
          <SliderField
            id="additional-expense"
            label={t("Additional Monthly Expense")}
            value={input.additionalMonthlyExpense}
            onChange={(v) => onChange({ additionalMonthlyExpense: v })}
            min={0}
            max={40000}
            step={500}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Savings & Reserves")}</p>
          <SliderField
            id="savings-target"
            label={t("Monthly Savings Target")}
            value={input.savingsTarget}
            onChange={(v) => onChange({ savingsTarget: v })}
            min={0}
            max={60000}
            step={500}
          />
          <SliderField
            id="current-savings"
            label={t("Current Savings")}
            value={input.currentSavings}
            onChange={(v) => onChange({ currentSavings: v })}
            min={0}
            max={500000}
            step={5000}
          />
          <SliderField
            id="emergency-fund"
            label={t("Emergency Fund")}
            value={input.emergencyFund}
            onChange={(v) => onChange({ emergencyFund: v })}
            min={0}
            max={300000}
            step={5000}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Purchase Plan")}</p>
          <SliderField
            id="purchase-amount"
            label={t("Potential Purchase Amount")}
            value={input.purchaseAmount}
            onChange={(v) => onChange({ purchaseAmount: v })}
            min={0}
            max={250000}
            step={1000}
          />
          <SliderField
            id="purchase-month"
            label={t("Purchase Month")}
            value={input.purchaseMonth}
            onChange={(v) => onChange({ purchaseMonth: v })}
            min={1}
            max={input.periodMonths}
            step={1}
            formatAsCurrency={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}
