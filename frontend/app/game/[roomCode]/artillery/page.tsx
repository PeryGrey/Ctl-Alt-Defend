"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useGameEngine } from "@/components/shared/useGameEngine";
import { BattlefieldView } from "@/components/shared/BattlefieldView";
import { PhaseBadge } from "@/components/shared/PhaseBadge";
import { GameLoadingState } from "@/components/shared/GameLoadingState";
import { GameScreenLayout } from "@/components/shared/GameScreenLayout";
import { useGameOverRedirect } from "@/components/shared/useGameOverRedirect";
import { ArtilleryLanePanel } from "@/components/artillery/ArtilleryLanePanel";
import { AmmoInventory } from "@/components/alchemist/AmmoInventory";
import { ROLE_META } from "@/constants/gameLabels";
import { isActiveWeapon } from "@/lib/gameUtils";
import { PersonnelDots } from "@/components/artillery/PersonnelDots";
import type { LaneId } from "@/engine/types";

export default function ArtilleryPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { state, actions } = useGameEngine(roomCode, "artillery");
  const [selectedLane, setSelectedLane] = useState<LaneId | null>(null);

  useGameOverRedirect(state?.phase, roomCode);

  if (!state) return <GameLoadingState />;

  const selectedLaneData = selectedLane ? state.lanes[selectedLane] : null;
  const selectedWeapon = selectedLaneData?.weapons[0];
  const weaponActive = isActiveWeapon(selectedWeapon);

  function handleManWeapon() {
    if (!weaponActive) return;
    const alreadyFiring = state!.personnel.some(
      (p) => p.weaponId === selectedWeapon!.id && p.mode === "firing",
    );
    if (alreadyFiring) return;
    const idle = state!.personnel.find((p) => p.mode === "idle");
    if (idle) actions.assignPersonnel(idle.id, selectedWeapon!.id, "firing");
  }

  function handleUnmanWeapon() {
    if (!weaponActive) return;
    const firer = state!.personnel.find(
      (p) => p.weaponId === selectedWeapon!.id && p.mode === "firing",
    );
    if (firer) actions.unassignPersonnel(firer.id);
  }

  function handleMaintainWeapon() {
    if (!weaponActive) return;
    const alreadyMaintaining = state!.personnel.some(
      (p) => p.weaponId === selectedWeapon!.id && p.mode === "maintaining",
    );
    if (alreadyMaintaining) return;
    const idle = state!.personnel.find((p) => p.mode === "idle");
    if (idle)
      actions.assignPersonnel(idle.id, selectedWeapon!.id, "maintaining");
  }

  function handleStopMaintenance() {
    if (!weaponActive) return;
    const maintainer = state!.personnel.find(
      (p) => p.weaponId === selectedWeapon!.id && p.mode === "maintaining",
    );
    if (maintainer) actions.unassignPersonnel(maintainer.id);
  }

  return (
    <GameScreenLayout
      battlefieldView={
        <BattlefieldView
          lanes={state.lanes}
          enemies={state.enemies}
          role="artillery"
          radarAccuracy={0}
          selectedLaneId={selectedLane}
          onSelectLane={setSelectedLane}
          personnel={state.personnel}
        />
      }
      header={
        <>
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-sm">
              {ROLE_META["artillery"].emoji} Wave {state.currentWave}
            </span>
            <PhaseBadge phase={state.phase} nextWaveAt={state.nextWaveAt} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Score: {state.score}</span>
            <PersonnelDots personnel={state.personnel} />
          </div>
        </>
      }
      actions={
        selectedLane && selectedLaneData ? (
          <ArtilleryLanePanel
            key={selectedLane}
            ammoInventory={state.ammoInventory}
            onLoadAmmo={(ammoType) => actions.loadAmmo(selectedWeapon!.id, ammoType)}
            lane={selectedLaneData}
            laneId={selectedLane}
            personnel={state.personnel}
            onManWeapon={handleManWeapon}
            onUnmanWeapon={handleUnmanWeapon}
            onMaintainWeapon={handleMaintainWeapon}
            onStopMaintenance={handleStopMaintenance}
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
