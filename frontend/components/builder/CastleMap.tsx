"use client";
import { useState, useRef } from "react";
import { cn } from "@/_shadcn/lib/utils";
import { GAME_CONFIG } from "@/config/gameConfig";
import { LANE_LABELS } from "@/constants/gameLabels";
import { useCountdown } from "@/components/shared/useCountdown";
import { ActionButton } from "@/components/shared/ActionButton";
import type { Lane, LaneId, BuilderAction } from "@/engine/types";

interface CastleMapProps {
  lane: Lane;
  laneId: LaneId;
  resources: number;
  builderActions: BuilderAction[];
  onBuild: (laneId: LaneId, slot: 0) => void;
  onReinforce: (laneId: LaneId) => void;
}

function useBuildProgress(completesAt: number) {
  const totalSecs = GAME_CONFIG.builder.timers.build;
  const secs = useCountdown(completesAt);
  const pct = Math.min(
    100,
    Math.max(0, ((totalSecs - secs) / totalSecs) * 100),
  );
  return { secs, pct };
}

function BuildingCard({ completesAt }: { completesAt: number }) {
  const { secs, pct } = useBuildProgress(completesAt);
  return (
    <div className="relative flex-1 w-full rounded-lg border p-3 flex flex-col justify-between overflow-hidden">
      <div
        className="absolute inset-0 bg-violet-500/15 transition-all"
        style={{ transform: `translateX(-${100 - pct}%)` }}
      />
      <div className="relative flex justify-between text-xs text-muted-foreground">
        <span className="uppercase">Weapon</span>
        <span className="tabular-nums">{secs}s</span>
      </div>
      <span className="relative text-2xl font-medium text-muted-foreground">
        Building…
      </span>
    </div>
  );
}

export function CastleMap({
  lane,
  laneId,
  resources,
  builderActions,
  onBuild,
  onReinforce,
}: CastleMapProps) {
  const [reinforcePulse, setReinforcePulse] = useState(false);
  const [buildPulse, setBuildPulse] = useState(false);
  const lastBuildCompletedAtRef = useRef<number>(0);

  const critical = lane.hp / lane.maxHp < 0.3;
  const canReinforce = resources >= GAME_CONFIG.builder.costs.reinforce;
  const isDestructive = canReinforce && critical;

  const buildAction = builderActions.find(
    (a) => a.laneId === laneId && a.slot !== undefined,
  );
  if (buildAction) {
    lastBuildCompletedAtRef.current = buildAction.completesAt;
  }
  const weapon = lane.weapons[0];
  const weaponExists = weapon?.exists;
  const canBuild = resources >= GAME_CONFIG.builder.costs.build && !buildAction;
  const showBuilding =
    !!buildAction ||
    (!weaponExists && Date.now() < lastBuildCompletedAtRef.current + 1500);
  const durCritical = weaponExists && weapon.durability < 20;

  function handleReinforce() {
    onReinforce(laneId);
    setReinforcePulse(true);
    setTimeout(() => setReinforcePulse(false), 400);
  }

  function handleBuild() {
    onBuild(laneId, 0);
    setBuildPulse(true);
    setTimeout(() => setBuildPulse(false), 400);
  }

  return (
    <div className="h-full flex flex-col gap-2">
      <p className="font-semibold text-sm px-1 shrink-0">
        {LANE_LABELS[laneId]}
      </p>

      {/* Wall — always actionable */}
      <div data-tutorial-id="builder-reinforce-button" className="flex-1 flex flex-col">
        <ActionButton
          variant={
            isDestructive ? "destructive" : canReinforce ? "default" : "outline"
          }
          label="Wall"
          stat={`${Math.ceil(lane.hp)} / ${lane.maxHp}`}
          statClassName={cn(critical && "font-bold")}
          action={`Reinforce · ${GAME_CONFIG.builder.costs.reinforce}`}
          disabled={!canReinforce}
          onClick={handleReinforce}
          className={cn(
            !canReinforce && critical && "border-destructive/70",
            reinforcePulse &&
              (isDestructive
                ? "ring-2 ring-offset-1 ring-white/60"
                : "ring-2 ring-offset-1 ring-primary/60"),
          )}
        />
      </div>

      {/* Weapon — three states */}
      {showBuilding ? (
        <BuildingCard completesAt={lastBuildCompletedAtRef.current} />
      ) : weaponExists ? (
        <div className="flex-1 w-full rounded-lg border p-3 flex flex-col justify-between">
          <div className="flex justify-between text-xs text-muted-foreground uppercase">
            <span className="uppercase">Gun</span>
            <span
              className={cn(
                "tabular-nums",
                durCritical && "text-destructive font-bold",
              )}
            >
              {Math.ceil(weapon.durability)} /{" "}
              {GAME_CONFIG.weapons.startingDurability}
            </span>
          </div>
          <span className="text-2xl text-muted-foreground">Operational</span>
        </div>
      ) : (
        <div data-tutorial-id="builder-build-button" className="flex-1 flex flex-col">
          <ActionButton
            variant={canBuild ? "default" : "outline"}
            label="Gun"
            stat="—"
            action={`Build · ${GAME_CONFIG.builder.costs.build}`}
            disabled={!canBuild}
            onClick={handleBuild}
            className={cn(buildPulse && "ring-2 ring-offset-1 ring-primary/60")}
          />
        </div>
      )}
    </div>
  );
}
