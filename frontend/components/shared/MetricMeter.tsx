"use client";
import { Progress } from "@/_shadcn/components/ui/progress";
import { cn } from "@/_shadcn/lib/utils";
import { GAME_CONFIG } from "@/config/gameConfig";

interface MetricMeterProps {
  label: string;
  value: number;
  maxValue: number;
  regenRate?: number;
}

export function MetricMeter({
  label,
  value,
  maxValue,
  regenRate,
}: MetricMeterProps) {
  const pct = Math.min(100, (value / maxValue) * 100);

  return (
    <div className="space-y-1 pb-2" data-tutorial-id="resource-meter">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {Math.floor(value)}
          {regenRate && (
            <span className="text-xs font-normal text-muted-foreground ml-1">
              +{regenRate}/s
            </span>
          )}
        </span>
      </div>
      <Progress
        value={pct}
        className={cn("h-3", pct >= 100 && "[&>div]:bg-green-500")}
      />
    </div>
  );
}
