"use client";
import type { Lane, Enemy } from "@/engine/types";

interface AlchemistLaneInfoProps {
  lane: Lane;
  enemies: Enemy[];
  radarAccuracy: number;
}

export function AlchemistLaneInfo({
  lane: _lane,
  enemies,
}: AlchemistLaneInfoProps) {
  const aliveCount = enemies.filter(
    (e) => e.alive && e.targetLane === _lane.id,
  ).length;

  if (aliveCount === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">No enemies</div>
    );
  }

  return (
    <div className="text-xs text-muted-foreground shrink-0">
      Enemies:
      <span className="pl-1.5 tabular-nums w-6 text-destructive">
        {aliveCount}
      </span>
    </div>
  );
}
