"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useGameEngine } from "@/components/shared/useGameEngine";
import { BattlefieldView } from "@/components/shared/BattlefieldView";
import { PhaseBadge } from "@/components/shared/PhaseBadge";
import { GameLoadingState } from "@/components/shared/GameLoadingState";
import { GameScreenLayout } from "@/components/shared/GameScreenLayout";
import { useGameOverRedirect } from "@/components/shared/useGameOverRedirect";
import { MetricMeter } from "@/components/shared/MetricMeter";
import { CastleMap } from "@/components/builder/CastleMap";
import { GAME_CONFIG } from "@/config/gameConfig";
import { ROLE_META } from "@/constants/gameLabels";
import type { LaneId } from "@/engine/types";

export default function BuilderPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { state, actions } = useGameEngine(roomCode, "builder");
  const [selectedLane, setSelectedLane] = useState<LaneId | null>(null);

  useGameOverRedirect(state?.phase, roomCode);

  if (!state) return <GameLoadingState />;

  return (
    <GameScreenLayout
      battlefieldView={
        <BattlefieldView
          lanes={state.lanes}
          enemies={[]}
          role="builder"
          radarAccuracy={0}
          selectedLaneId={selectedLane}
          onSelectLane={setSelectedLane}
          builderActions={state.builderActions}
        />
      }
      header={
        <>
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-sm">
              {ROLE_META["builder"].emoji} Wave {state.currentWave}
            </span>
            <PhaseBadge phase={state.phase} nextWaveAt={state.nextWaveAt} />
          </div>
          <div className="text-xs text-muted-foreground">
            Score: {state.score}
          </div>
          <MetricMeter
            label="Resource"
            value={state.resources}
            maxValue={GAME_CONFIG.builder.resourceCap}
            regenRate={GAME_CONFIG.builder.resourceRegenPerSecond}
          />
        </>
      }
      actions={
        selectedLane ? (
          <CastleMap
            key={selectedLane}
            lane={state.lanes[selectedLane]}
            laneId={selectedLane}
            resources={state.resources}
            builderActions={state.builderActions}
            onBuild={(laneId, slot) => actions.startBuild(laneId, slot)}
            onReinforce={(laneId) => actions.reinforce(laneId)}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <p className="text-sm font-medium text-center">
              Tap a lane to manage it
            </p>
          </div>
        )
      }
    />
  );
}
