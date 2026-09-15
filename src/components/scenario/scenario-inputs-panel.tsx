"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { scenarioPresets } from "@/data/mock-scenarios";

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
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>What If?</CardTitle>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onReset}>
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
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
              title={preset.description}
            >
              <span className="text-xs font-semibold">{preset.name}</span>
            </Button>
          ))}
        </div>

        <Separator />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Scenario Period</label>
          <Select
            value={String(input.periodMonths)}
            onValueChange={(v) => onChange({ periodMonths: Number(v) as ScenarioInput["periodMonths"] })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 months</SelectItem>
              <SelectItem value="6">6 months</SelectItem>
              <SelectItem value="12">12 months</SelectItem>
              <SelectItem value="24">24 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Income</p>
          <SliderField
            id="salary"
            label="Monthly Salary"
            value={input.monthlySalary}
            onChange={(v) => onChange({ monthlySalary: v })}
            min={20000}
            max={200000}
            step={1000}
          />
          <SliderField
            id="salary-increase"
            label="Expected Salary Increase"
            value={input.salaryIncrease}
            onChange={(v) => onChange({ salaryIncrease: v })}
            min={0}
            max={50000}
            step={500}
          />
          <SliderField
            id="bonus"
            label="Optional Bonus (month 1)"
            value={input.bonus}
            onChange={(v) => onChange({ bonus: v })}
            min={0}
            max={150000}
            step={1000}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Spending</p>
          <SliderField
            id="essentials"
            label="Monthly Essential Expenses"
            value={input.essentialExpenses}
            onChange={(v) => onChange({ essentialExpenses: v })}
            min={5000}
            max={100000}
            step={500}
          />
          <SliderField
            id="lifestyle"
            label="Lifestyle Spending"
            value={input.lifestyleSpending}
            onChange={(v) => onChange({ lifestyleSpending: v })}
            min={0}
            max={80000}
            step={500}
          />
          <SliderField
            id="additional-expense"
            label="Additional Monthly Expense"
            value={input.additionalMonthlyExpense}
            onChange={(v) => onChange({ additionalMonthlyExpense: v })}
            min={0}
            max={40000}
            step={500}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Savings &amp; Reserves</p>
          <SliderField
            id="savings-target"
            label="Monthly Savings Target"
            value={input.savingsTarget}
            onChange={(v) => onChange({ savingsTarget: v })}
            min={0}
            max={60000}
            step={500}
          />
          <SliderField
            id="current-savings"
            label="Current Savings"
            value={input.currentSavings}
            onChange={(v) => onChange({ currentSavings: v })}
            min={0}
            max={500000}
            step={5000}
          />
          <SliderField
            id="emergency-fund"
            label="Emergency Fund"
            value={input.emergencyFund}
            onChange={(v) => onChange({ emergencyFund: v })}
            min={0}
            max={300000}
            step={5000}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Purchase Plan</p>
          <SliderField
            id="purchase-amount"
            label="Potential Purchase Amount"
            value={input.purchaseAmount}
            onChange={(v) => onChange({ purchaseAmount: v })}
            min={0}
            max={250000}
            step={1000}
          />
          <SliderField
            id="purchase-month"
            label="Purchase Month"
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
