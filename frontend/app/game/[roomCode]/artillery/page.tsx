"use client";
import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useGameEngine } from "@/components/shared/useGameEngine";
import { BattlefieldView } from "@/components/shared/BattlefieldView";
import type { ShotSpec } from "@/components/shared/BattlefieldView";
import { PhaseBadge } from "@/components/shared/PhaseBadge";
import { GameLoadingState } from "@/components/shared/GameLoadingState";
import { GameScreenLayout } from "@/components/shared/GameScreenLayout";
import { useGameOverRedirect } from "@/components/shared/useGameOverRedirect";
import { ArtilleryLanePanel } from "@/components/artillery/ArtilleryLanePanel";
import { AmmoInventory } from "@/components/alchemist/AmmoInventory";
import { ROLE_META } from "@/constants/gameLabels";
import { isActiveWeapon } from "@/lib/gameUtils";
import { PersonnelDots } from "@/components/artillery/PersonnelDots";
import type { LaneId, WeaponFirePayload } from "@/engine/types";
import { LANE_IDS } from "@/engine/types";

export default function ArtilleryPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [selectedLane, setSelectedLane] = useState<LaneId | null>(null);
  const [shotsByLane, setShotsByLane] = useState<Record<LaneId, ShotSpec[]>>(
    () =>
      Object.fromEntries(LANE_IDS.map((id) => [id, []])) as unknown as Record<
        LaneId,
        ShotSpec[]
      >,
  );

  const handleWeaponFire = useCallback((payload: WeaponFirePayload) => {
    const shot: ShotSpec = {
      id: `${payload.weaponId}-${Date.now()}`,
      ammoType: payload.ammoType,
      targetPosition: payload.targetPosition,
    };
    setShotsByLane((prev) => ({
      ...prev,
      // Replace any in-flight shot of the same ammo type — only one per type per lane at a time
      [payload.laneId]: [
        ...prev[payload.laneId].filter((s) => s.ammoType !== payload.ammoType),
        shot,
      ],
    }));
  }, []);

  const handleShotComplete = useCallback((laneId: LaneId, shotId: string) => {
    setShotsByLane((prev) => ({
      ...prev,
      [laneId]: prev[laneId].filter((s) => s.id !== shotId),
    }));
  }, []);

  const { state, actions } = useGameEngine(roomCode, "artillery", {
    onWeaponFire: handleWeaponFire,
  });

  useGameOverRedirect(state?.phase, roomCode, "artillery");

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
          shotsByLane={shotsByLane}
          onShotComplete={handleShotComplete}
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
            <span className="text-xs text-muted-foreground">
              Score: {state.score}
            </span>
            <PersonnelDots personnel={state.personnel} />
          </div>
        </>
      }
      actions={
        selectedLane && selectedLaneData ? (
          <ArtilleryLanePanel
            key={selectedLane}
            ammoInventory={state.ammoInventory}
            onLoadAmmo={(ammoType) =>
              actions.loadAmmo(selectedWeapon!.id, ammoType)
            }
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
