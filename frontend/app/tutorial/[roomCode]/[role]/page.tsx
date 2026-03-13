"use client";
import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { BattlefieldView } from "@/components/shared/BattlefieldView";
import { PhaseBadge } from "@/components/shared/PhaseBadge";
import { GameScreenLayout } from "@/components/shared/GameScreenLayout";
import { MetricMeter } from "@/components/shared/MetricMeter";
import { CastleMap } from "@/components/builder/CastleMap";
import { ArtilleryLanePanel } from "@/components/artillery/ArtilleryLanePanel";
import { BrewPanel } from "@/components/alchemist/BrewPanel";
import { PersonnelDots } from "@/components/artillery/PersonnelDots";
import { Badge } from "@/_shadcn/components/ui/badge";
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay";
import { useTutorial } from "@/components/tutorial/useTutorial";
import { TUTORIAL_STEPS } from "@/components/tutorial/tutorialSteps";
import { MOCK_GAME_STATES } from "@/components/tutorial/mockGameState";
import { GAME_CONFIG } from "@/config/gameConfig";
import { ROLE_META } from "@/constants/gameLabels";
import { publishEvent } from "@/lib/realtime";
import type { Role, LaneId, AmmoType, GameState } from "@/engine/types";

export default function TutorialPage() {
  const { roomCode, role } = useParams<{ roomCode: string; role: string }>();
  const router = useRouter();
  const typedRole = role as Role;
  const isValidRole = (["builder", "artillery", "alchemist"] as Role[]).includes(typedRole);

  const [mockState, setMockState] = useState<GameState>(
    MOCK_GAME_STATES[isValidRole ? typedRole : "builder"],
  );
  const [selectedLane, setSelectedLane] = useState<LaneId | null>(null);

  useEffect(() => {
    if (!isValidRole) router.replace("/");
  }, [isValidRole, router]);

  const handleComplete = useCallback(async () => {
    await publishEvent(roomCode, "player_ready", { role: typedRole });
    router.push(`/lobby/${roomCode}?role=${typedRole}`);
  }, [roomCode, typedRole, router]);

  const { currentStep, currentStepIndex, totalSteps, onAction, advanceGotIt } =
    useTutorial({
      steps: TUTORIAL_STEPS[typedRole],
      onComplete: handleComplete,
    });

  function handleSelectLane(laneId: LaneId) {
    setSelectedLane(laneId);
    if (typedRole === "artillery" && !mockState.lanes[laneId].weapons[0]?.exists) return;
    onAction("lane-selected");
  }

  // ── Builder mock actions ───────────────────────────────────────────────────
  function handleBuild(laneId: LaneId, slot: 0) {
    setMockState((s) => ({
      ...s,
      resources: s.resources - GAME_CONFIG.builder.costs.build,
      lanes: {
        ...s.lanes,
        [laneId]: {
          ...s.lanes[laneId],
          weapons: [
            {
              id: `weapon-${laneId}`,
              laneId,
              slot,
              durability: GAME_CONFIG.weapons.startingDurability,
              ammoLoaded: null,
              exists: true,
            },
          ] as GameState["lanes"][LaneId]["weapons"],
        },
      },
    }));
    onAction("build");
  }

  function handleReinforce(laneId: LaneId) {
    setMockState((s) => {
      const lane = s.lanes[laneId];
      const restored = Math.min(
        lane.maxHp,
        lane.hp + lane.maxHp * GAME_CONFIG.lanes.reinforceHpFraction,
      );
      return {
        ...s,
        resources: s.resources - GAME_CONFIG.builder.costs.reinforce,
        lanes: { ...s.lanes, [laneId]: { ...lane, hp: restored } },
      };
    });
    onAction("reinforce");
  }

  // ── Artillery mock actions ─────────────────────────────────────────────────
  function handleManWeapon() {
    setMockState((s) => {
      const weapon = selectedLane ? s.lanes[selectedLane].weapons[0] : null;
      if (!weapon?.exists) return s;
      const idle = s.personnel.find((p) => p.mode === "idle");
      if (!idle) return s;
      return {
        ...s,
        personnel: s.personnel.map((p) =>
          p.id === idle.id ? { ...p, weaponId: weapon.id, mode: "firing" as const } : p,
        ) as GameState["personnel"],
      };
    });
    onAction("man-weapon");
  }

  function handleUnmanWeapon() {
    setMockState((s) => {
      const weapon = selectedLane ? s.lanes[selectedLane].weapons[0] : null;
      if (!weapon?.exists) return s;
      const firer = s.personnel.find(
        (p) => p.weaponId === weapon.id && p.mode === "firing",
      );
      if (!firer) return s;
      return {
        ...s,
        personnel: s.personnel.map((p) =>
          p.id === firer.id ? { ...p, weaponId: null, mode: "idle" as const } : p,
        ) as GameState["personnel"],
      };
    });
  }

  function handleMaintainWeapon() {
    setMockState((s) => {
      const weapon = selectedLane ? s.lanes[selectedLane].weapons[0] : null;
      if (!weapon?.exists) return s;
      const idle = s.personnel.find((p) => p.mode === "idle");
      if (!idle) return s;
      return {
        ...s,
        personnel: s.personnel.map((p) =>
          p.id === idle.id ? { ...p, weaponId: weapon.id, mode: "maintaining" as const } : p,
        ) as GameState["personnel"],
      };
    });
    onAction("maintain-weapon");
  }

  function handleStopMaintenance() {
    setMockState((s) => {
      const weapon = selectedLane ? s.lanes[selectedLane].weapons[0] : null;
      if (!weapon?.exists) return s;
      const maintainer = s.personnel.find(
        (p) => p.weaponId === weapon.id && p.mode === "maintaining",
      );
      if (!maintainer) return s;
      return {
        ...s,
        personnel: s.personnel.map((p) =>
          p.id === maintainer.id ? { ...p, weaponId: null, mode: "idle" as const } : p,
        ) as GameState["personnel"],
      };
    });
  }

  function handleLoadAmmo(ammoType: AmmoType) {
    setMockState((s) => {
      const weapon = selectedLane ? s.lanes[selectedLane].weapons[0] : null;
      if (!weapon?.exists) return s;
      return {
        ...s,
        lanes: {
          ...s.lanes,
          [selectedLane!]: {
            ...s.lanes[selectedLane!],
            weapons: [{ ...weapon, ammoLoaded: ammoType }] as GameState["lanes"][LaneId]["weapons"],
          },
        },
      };
    });
    onAction("load-ammo");
  }

  // ── Alchemist mock actions ─────────────────────────────────────────────────
  function handleBrew(slotIndex: 0 | 1 | 2, ammoType: AmmoType) {
    setMockState((s) => ({
      ...s,
      brewSlots: s.brewSlots.map((slot) =>
        slot.slotIndex === slotIndex
          ? { ...slot, ammoType, completesAt: Date.now() + GAME_CONFIG.alchemist.brewTimePerAmmoType[ammoType] * 1000 }
          : slot,
      ) as GameState["brewSlots"],
    }));
    onAction("brew");
  }

  const selectedLaneData = selectedLane ? mockState.lanes[selectedLane] : null;

  if (!isValidRole) return null;

  return (
    <div className="relative h-screen overflow-hidden">
      <GameScreenLayout
        battlefieldView={
          <BattlefieldView
            lanes={mockState.lanes}
            enemies={mockState.enemies}
            role={typedRole}
            radarAccuracy={mockState.radarAccuracy}
            selectedLaneId={selectedLane}
            onSelectLane={handleSelectLane}
            personnel={typedRole === "artillery" ? mockState.personnel : undefined}
          />
        }
        header={
          <>
            <div className="flex items-center justify-between gap-1">
              <span className="font-bold text-sm">
                {ROLE_META[typedRole].emoji} Tutorial
              </span>
              <PhaseBadge phase={mockState.phase} nextWaveAt={null} />
            </div>

            {typedRole === "builder" && (
              <>
                <div className="text-xs text-muted-foreground">Score: 0</div>
                <MetricMeter
                  label="Resource"
                  value={mockState.resources}
                  maxValue={GAME_CONFIG.builder.resourceCap}
                  regenRate={GAME_CONFIG.builder.resourceRegenPerSecond}
                />
              </>
            )}

            {typedRole === "artillery" && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Score: 0</span>
                <PersonnelDots personnel={mockState.personnel} />
              </div>
            )}

            {typedRole === "alchemist" && (
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Score: 0</div>
                <Badge
                  variant={mockState.radarAccuracy > 0 ? "default" : "outline"}
                  className="uppercase font-semibold"
                  data-tutorial-id="radar-accuracy-badge"
                >
                  {mockState.radarAccuracy}% radar
                </Badge>
              </div>
            )}
          </>
        }
        actions={
          <>
            {typedRole === "builder" &&
              (selectedLane && selectedLaneData ? (
                <CastleMap
                  key={selectedLane}
                  lane={selectedLaneData}
                  laneId={selectedLane}
                  resources={mockState.resources}
                  builderActions={mockState.builderActions}
                  onBuild={handleBuild}
                  onReinforce={handleReinforce}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <p className="text-sm font-medium text-center">
                    Tap a lane to manage it
                  </p>
                </div>
              ))}

            {typedRole === "artillery" &&
              (selectedLane && selectedLaneData ? (
                <ArtilleryLanePanel
                  key={selectedLane}
                  ammoInventory={mockState.ammoInventory}
                  onLoadAmmo={handleLoadAmmo}
                  lane={selectedLaneData}
                  laneId={selectedLane}
                  personnel={mockState.personnel}
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
              ))}

            {typedRole === "alchemist" && (
              <BrewPanel
                brewSlots={mockState.brewSlots}
                ammoInventory={mockState.ammoInventory}
                onBrew={handleBrew}
              />
            )}
          </>
        }
      />

      <TutorialOverlay
        currentStep={currentStep}
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        onGotIt={advanceGotIt}
      />
    </div>
  );
}
