"use client";
import { cn } from "@/_shadcn/lib/utils";
import type { Personnel } from "@/engine/types";

interface PersonnelDotsProps {
  personnel: [Personnel, Personnel, Personnel];
}

const dotColor: Record<Personnel["mode"], string> = {
  idle: "bg-muted-foreground/40",
  firing: "bg-primary",
  maintaining: "bg-blue-500",
};

export function PersonnelDots({ personnel }: PersonnelDotsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Crew</span>
      <div className="flex items-center gap-1">
        {personnel.map((p) => (
          <span
            key={p.id}
            className={cn("block w-2.5 h-2.5 rounded-full", dotColor[p.mode])}
          />
        ))}
      </div>
    </div>
  );
}
