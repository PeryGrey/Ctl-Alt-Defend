"use client";
import { cn } from "@/_shadcn/lib/utils";
import { LANE_LABELS } from "@/constants/gameLabels";
import { BuilderLaneInfo } from "@/components/shared/BuilderLaneInfo";
import { ArtilleryLaneInfo } from "@/components/shared/ArtilleryLaneInfo";
import { ArtilleryStatusTags } from "@/components/shared/ArtilleryStatusTags";
import { AlchemistLaneInfo } from "@/components/shared/AlchemistLaneInfo";
import type { Lane, LaneId, Enemy, Personnel, Role } from "@/engine/types";
import { LANE_IDS } from "@/engine/types";
import { hashEnemyReveal } from "@/lib/gameUtils";
import { ENEMY_TYPE_LUCIDE_ICONS } from "@/constants/gameIcons";
import { HatGlasses } from "lucide-react";

// ── Enemy track (right track panel) ──────────────────────────────────────────

function EnemyTrack({
  lane,
  enemies,
  radarAccuracy,
}: {
  lane: Lane;
  enemies: Enemy[];
  radarAccuracy?: number;
}) {
  const laneEnemies = enemies.filter(
    (e) =>
      e.alive &&
      e.targetLane === lane.id &&
      e.position >= 0 &&
      e.position <= 100,
  );

  return (
    <div className="w-full h-full relative">
      <div className="absolute left-0 right-0 top-1/2 h-px bg-border/50" />
      {laneEnemies.map((e) => {
        const revealed =
          radarAccuracy !== undefined
            ? hashEnemyReveal(e.id, radarAccuracy)
            : true;
        const Icon = revealed ? ENEMY_TYPE_LUCIDE_ICONS[e.type] : null;
        return (
          <span
            key={e.id}
            className="absolute top-1/2 -translate-y-1/2 text-sm leading-none"
            style={{ right: `${e.position}%` }}
          >
            {radarAccuracy === undefined ? (
              <HatGlasses className="size-5 text-destructive" />
            ) : Icon ? (
              <Icon className="size-5 text-destructive" />
            ) : (
              <span className="text-xl text-muted-foreground font-bold">?</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ── Main BattlefieldView ─────────────────────────────────────────────────────

interface BattlefieldViewProps {
  lanes: Record<LaneId, Lane>;
  enemies: Enemy[];
  role: Role;
  radarAccuracy: number;
  selectedLaneId: LaneId | null;
  onSelectLane: (laneId: LaneId) => void;
  personnel?: [Personnel, Personnel, Personnel];
}

export function BattlefieldView({
  lanes,
  enemies,
  role,
  radarAccuracy,
  selectedLaneId,
  onSelectLane,
  personnel,
}: BattlefieldViewProps) {
  return (
    <div className="h-full flex flex-col p-2 gap-2" data-tutorial-id="battlefield">
      {/* Direction hint */}
      <div className="shrink-0 flex items-center justify-end gap-1 px-1">
        <span className="text-[10px] text-muted-foreground/60 flex gap-0.5">
          {[1.0, 0.8, 0.6, 0.4, 0.2, 0].map((delay) => (
            <span
              key={delay}
              style={{ animationDelay: `${delay}s` }}
              className="animate-[pulse_1.2s_ease-in-out_infinite]"
            >
              ‹
            </span>
          ))}
        </span>
        <span className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-wide">
          Enemy attack direction
        </span>
      </div>

      {/* 4 horizontal lane rows */}
      <div className="flex flex-col gap-1.5 flex-1">
        {LANE_IDS.map((laneId) => {
          const lane = lanes[laneId];
          const selected = selectedLaneId === laneId;
          const hpPct = (lane.hp / lane.maxHp) * 100;
          const critical = hpPct < 30;

          return (
            <div key={laneId} className="flex-1 rounded-lg">
              <button
                onClick={() => onSelectLane(laneId)}
                className={cn(
                  "flex flex-row items-stretch rounded-lg border-2 text-left transition-colors w-full h-full overflow-hidden p-0",
                  selected
                    ? "border-primary bg-primary/10"
                    : critical
                    ? "border-destructive/60 bg-destructive/5"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                {/* Left: info panel */}
                <div className="shrink-0 w-[40%] flex flex-col justify-center p-2 gap-2">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="py-0.5 text-xs font-semibold leading-none">
                      {LANE_LABELS[laneId]}
                    </span>
                    {role === "artillery" && personnel && (
                      <ArtilleryStatusTags lane={lane} personnel={personnel} />
                    )}
                  </div>
                  {role === "builder" && <BuilderLaneInfo lane={lane} />}
                  {role === "artillery" && personnel && (
                    <ArtilleryLaneInfo lane={lane} />
                  )}
                  {role === "alchemist" && (
                    <AlchemistLaneInfo
                      lane={lane}
                      enemies={enemies}
                      radarAccuracy={radarAccuracy}
                    />
                  )}
                </div>

                {/* Vertical divider */}
                <div className="w-px bg-border shrink-0" />

                {/* Right: track panel */}
                <div className="flex-1 relative overflow-hidden">
                  {role === "artillery" && personnel && (
                    <EnemyTrack lane={lane} enemies={enemies} />
                  )}
                  {role === "alchemist" && (
                    <EnemyTrack
                      lane={lane}
                      enemies={enemies}
                      radarAccuracy={radarAccuracy}
                    />
                  )}
                  {role === "builder" && (
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-border/30" />
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
