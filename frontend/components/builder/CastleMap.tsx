"use client";
import { Card, CardContent } from "@/_shadcn/components/ui/card";
import { Button } from "@/_shadcn/components/ui/button";
import { Progress } from "@/_shadcn/components/ui/progress";
import { cn } from "@/_shadcn/lib/utils";
import { GAME_CONFIG } from "@/config/gameConfig";
import type { Lane, LaneId } from "@/engine/types";

interface CastleMapProps {
  lane: Lane
  laneId: LaneId
  resources: number
  builderActionLanes: Set<string> // laneId-slot keys currently in queue
  onBuild: (laneId: LaneId, slot: 0) => void
  onReinforce: (laneId: LaneId) => void
}

const LANE_LABELS: Record<LaneId, string> = {
  moat_left: "Left Moat",
  bridge_left: "Left Bridge",
  bridge_right: "Right Bridge",
  moat_right: "Right Moat",
}

function hpColorClass(hp: number, maxHp: number): string {
  const pct = hp / maxHp;
  if (pct > 0.6) return "[&>div]:bg-green-500";
  if (pct > 0.3) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-red-500";
}

function durColorClass(dur: number): string {
  if (dur > 60) return "[&>div]:bg-green-500";
  if (dur > 20) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-red-500";
}

export function CastleMap({
  lane,
  laneId,
  resources,
  builderActionLanes,
  onBuild,
  onReinforce,
}: CastleMapProps) {
  const hpPct = (lane.hp / lane.maxHp) * 100;
  const critical = lane.hp / lane.maxHp < 0.3;

  return (
    <Card className={cn("border-2", critical ? "border-destructive" : "border-border")}>
      <CardContent className="py-3 px-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{LANE_LABELS[laneId]}</span>
          <span className="text-xs text-muted-foreground">{Math.ceil(lane.hp)} HP</span>
        </div>
        <Progress
          value={hpPct}
          className={cn("h-2", hpColorClass(lane.hp, lane.maxHp))}
        />

        {/* Weapon slots */}
        <div className="space-y-1">
          {([0] as const).map((slot) => {
            const weapon = lane.weapons[slot];
            const queueKey = `${laneId}-${slot}`;
            const inQueue = builderActionLanes.has(queueKey);
            const canBuild =
              resources >= GAME_CONFIG.builder.costs.build && !inQueue;

            if (!weapon || !weapon.exists) {
              return (
                <div key={slot} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground flex-1">
                    Weapon slot: empty
                  </span>
                  {!inQueue && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs px-2"
                      disabled={!canBuild}
                      onClick={() => onBuild(laneId, slot)}
                    >
                      Build ({GAME_CONFIG.builder.costs.build})
                    </Button>
                  )}
                  {inQueue && (
                    <span className="text-xs text-muted-foreground">Building…</span>
                  )}
                </div>
              );
            }

            const durPct =
              (weapon.durability / GAME_CONFIG.weapons.startingDurability) * 100;
            const durCritical = durPct < 20;

            return (
              <div
                key={slot}
                className={cn(
                  "rounded p-1 border",
                  durCritical ? "border-destructive" : "border-transparent",
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    Weapon ·{" "}
                    <span className="font-mono">{weapon.id.slice(-4)}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.ceil(weapon.durability)}%
                  </span>
                </div>
                <Progress
                  value={durPct}
                  className={cn("h-1.5", durColorClass(weapon.durability))}
                />
              </div>
            );
          })}
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full h-9 text-xs"
          disabled={resources < GAME_CONFIG.builder.costs.reinforce}
          onClick={() => onReinforce(laneId)}
        >
          Reinforce ({GAME_CONFIG.builder.costs.reinforce})
        </Button>
      </CardContent>
    </Card>
  );
}
