"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/currency";

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 500,
  tooltip,
  formatAsCurrency = true,
  id,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  tooltip?: string;
  formatAsCurrency?: boolean;
  id: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
          {label}
        </Label>
        <span className="text-sm font-semibold tabular-nums">
          {formatAsCurrency ? formatCurrency(value) : value}
        </span>
      </div>
      <Slider
        id={id}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        aria-label={label}
        title={tooltip}
      />
    </div>
  );
}
