"use client";
import { cn } from "@/_shadcn/lib/utils";
import { GAME_CONFIG } from "@/config/gameConfig";
import { LANE_LABELS } from "@/constants/gameLabels";
import { isActiveWeapon } from "@/lib/gameUtils";
import { ActionButton } from "@/components/shared/ActionButton";
import { AmmoInventory } from "@/components/alchemist/AmmoInventory";
import type { AmmoType, Lane, LaneId, Personnel } from "@/engine/types";

interface ArtilleryLanePanelProps {
  lane: Lane;
  laneId: LaneId;
  personnel: [Personnel, Personnel, Personnel];
  ammoInventory: Record<AmmoType, number>;
  onLoadAmmo: (ammoType: AmmoType) => void;
  onManWeapon: () => void;
  onUnmanWeapon: () => void;
  onMaintainWeapon: () => void;
  onStopMaintenance: () => void;
}

export function ArtilleryLanePanel({
  lane,
  laneId,
  personnel,
  ammoInventory,
  onLoadAmmo,
  onManWeapon,
  onUnmanWeapon,
  onMaintainWeapon,
  onStopMaintenance,
}: ArtilleryLanePanelProps) {
  const weapon = lane.weapons[0];
  const weaponActive = isActiveWeapon(weapon);

  const firer = weaponActive
    ? personnel.find((p) => p.weaponId === weapon.id && p.mode === "firing")
    : undefined;
  const maintainer = weaponActive
    ? personnel.find(
        (p) => p.weaponId === weapon.id && p.mode === "maintaining",
      )
    : undefined;
  const hasIdle = personnel.some((p) => p.mode === "idle");

  const durStat = weaponActive
    ? `${Math.ceil(weapon.durability)} / ${GAME_CONFIG.weapons.startingDurability}`
    : undefined;
  const durCritical = weaponActive && weapon.durability < 20;

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Lane title */}
      <p className="font-semibold text-sm px-1 shrink-0">
        {LANE_LABELS[laneId]}
      </p>

      {!weaponActive && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center px-4">
            No weapon — ask Builder to build one!
          </p>
        </div>
      )}

      {/* Ammo selection */}
      {weaponActive && (
        <div className="shrink-0">
          <AmmoInventory
            inventory={ammoInventory}
            loadedAmmo={weapon.ammoLoaded}
            onSelect={onLoadAmmo}
            isPulse={!!firer && weapon.ammoLoaded === null}
          />
        </div>
      )}

      {/* Personnel buttons */}
      {weaponActive && (
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          {firer ? (
            <ActionButton
              variant="primary-ghost"
              label="Gunner"
              stat="firing"
              action="Hold Fire"
              onClick={onUnmanWeapon}
            />
          ) : (
            <div data-tutorial-id="artillery-man-button" className="flex-1 flex flex-col">
              <ActionButton
                variant={hasIdle ? "default" : "outline"}
                label="Gunner"
                stat="—"
                action="Open Fire"
                disabled={!hasIdle}
                onClick={onManWeapon}
              />
            </div>
          )}

          {maintainer ? (
            <ActionButton
              variant="blue-ghost"
              label="Durability"
              stat={durStat}
              action="Stop Repair"
              onClick={onStopMaintenance}
            />
          ) : (
            <div data-tutorial-id="artillery-maintain-button" className="flex-1 flex flex-col">
              <ActionButton
                variant={hasIdle ? "blue" : "outline"}
                label="Durability"
                stat={durStat}
                statClassName={cn(durCritical && "text-destructive font-bold")}
                action="Repair"
                disabled={!hasIdle}
                onClick={onMaintainWeapon}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
