"use client";
import { Progress } from "@/_shadcn/components/ui/progress";
import { cn } from "@/_shadcn/lib/utils";

interface StatRowProps {
  label: string;
  value: number; // 0–100 percentage for bar
  display: string; // text shown on right
  barClass?: string;
  valueCritical?: boolean;
  empty?: boolean; // show empty bar + "—"
}

export function StatRow({
  label,
  value,
  display,
  barClass,
  valueCritical,
  empty,
}: StatRowProps) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground shrink-0 w-8">{label}</span>
      <Progress
        value={empty ? 0 : value}
        className={cn("flex-1 h-1.5", barClass)}
      />
      <span
        className={cn(
          "tabular-nums shrink-0 w-7 text-right text-muted-foreground",
          valueCritical && "text-destructive font-bold",
        )}
      >
        {empty ? "—" : display}
      </span>
    </div>
  );
}
