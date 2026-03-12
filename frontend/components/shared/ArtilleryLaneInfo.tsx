"use client";
import { StatRow } from "@/components/shared/StatRow";
import { GAME_CONFIG } from "@/config/gameConfig";
import type { Lane } from "@/engine/types";
import { getHealthColorClass } from "@/lib/gameUtils";

interface ArtilleryLaneInfoProps {
  lane: Lane;
}

export function ArtilleryLaneInfo({ lane }: ArtilleryLaneInfoProps) {
  const weapon = lane.weapons[0];
  const weaponExists = weapon !== null && weapon?.exists;
  const durPct = weaponExists
    ? (weapon.durability / GAME_CONFIG.weapons.startingDurability) * 100
    : 0;

  return (
    <div className="w-full space-y-1.5">
      {weaponExists ? (
        <StatRow
          label="Gun"
          value={durPct ?? 0}
          display={`${Math.ceil(weapon.durability)}`}
          barClass={getHealthColorClass(durPct)}
        />
      ) : (
        <div className="text-xs text-muted-foreground italic">No weapon</div>
      )}
    </div>
  );
}
