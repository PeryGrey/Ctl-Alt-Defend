"use client";
import { StatRow } from "@/components/shared/StatRow";
import { getHealthColorClass } from "@/lib/gameUtils";
import type { Lane } from "@/engine/types";

interface BuilderLaneInfoProps {
  lane: Lane;
}

export function BuilderLaneInfo({ lane }: BuilderLaneInfoProps) {
  const hpPct = (lane.hp / lane.maxHp) * 100;
  const critical = hpPct < 30;

  return (
    <div className="w-full space-y-1.5">
      <StatRow
        label="Wall"
        value={hpPct}
        display={`${Math.ceil(lane.hp)}`}
        barClass={getHealthColorClass(hpPct)}
        valueCritical={critical}
      />
    </div>
  );
}
