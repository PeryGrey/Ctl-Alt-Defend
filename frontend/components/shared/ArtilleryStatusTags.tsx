"use client";
import type { Lane, Personnel } from "@/engine/types";

interface ArtilleryStatusTagsProps {
  lane: Lane;
  personnel: [Personnel, Personnel, Personnel];
}

export function ArtilleryStatusTags({
  lane,
  personnel,
}: ArtilleryStatusTagsProps) {
  const weapon = lane.weapons[0];
  if (!weapon?.exists) return null;

  const firing = personnel.some(
    (p) => p.weaponId === weapon.id && p.mode === "firing",
  );
  const maintaining = personnel.some(
    (p) => p.weaponId === weapon.id && p.mode === "maintaining",
  );

  if (!firing && !maintaining) return null;

  return (
    <div className="flex items-center gap-2">
      {firing && (
        <span className="px-1 py-0.5 rounded text-xs font-medium leading-none bg-primary/20 text-primary">
          Firing
        </span>
      )}
      {maintaining && (
        <span className="px-1 py-0.5 rounded text-xs font-medium leading-none bg-blue-700/20 text-blue-400">
          Repair
        </span>
      )}
    </div>
  );
}
