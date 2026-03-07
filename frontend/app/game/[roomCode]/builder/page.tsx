'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGameEngine } from '@/components/shared/useGameEngine'
import { BattlefieldView } from '@/components/shared/BattlefieldView'
import { PhaseBadge } from '@/components/shared/PhaseBadge'
import { ResourceMeter } from '@/components/builder/ResourceMeter'
import { CastleMap } from '@/components/builder/CastleMap'
import { BuildQueue } from '@/components/builder/BuildQueue'
import { GAME_CONFIG } from '@/config/gameConfig'
import type { LaneId } from '@/engine/types'

export default function BuilderPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const router = useRouter()
  const { state, actions } = useGameEngine(roomCode, 'builder')
  const [selectedLane, setSelectedLane] = useState<LaneId | null>(null)

  useEffect(() => {
    if (state?.phase === 'game_over') {
      router.push(`/reveal/${roomCode}`)
    }
  }, [state?.phase, roomCode, router])

  const builderActionLanes = useMemo(() => {
    if (!state) return new Set<string>()
    return new Set(
      state.builderActions
        .filter((a) => a.slot !== undefined)
        .map((a) => `${a.laneId}-${a.slot}`)
    )
  }, [state])

  if (!state) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading game…</p>
      </main>
    )
  }

  return (
    <main className="h-screen flex overflow-hidden bg-background">
      {/* ── Left 70%: Battlefield ── */}
      <div className="flex-[7] min-w-0 overflow-hidden">
        <BattlefieldView
          lanes={state.lanes}
          enemies={[]}
          role="builder"
          radarAccuracy={0}
          selectedLaneId={selectedLane}
          onSelectLane={setSelectedLane}
          builderActionLanes={builderActionLanes}
        />
      </div>

      {/* ── Right 30%: Action Panel ── */}
      <div className="flex-[3] min-w-0 border-l flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 border-b space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-sm">🏰 Wave {state.currentWave}</span>
            <PhaseBadge phase={state.phase} nextWaveAt={state.nextWaveAt} />
          </div>
          <div className="text-xs text-muted-foreground">Score: {state.score}</div>
          <ResourceMeter
            resources={state.resources}
            regenRate={GAME_CONFIG.builder.resourceRegenPerSecond}
          />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {selectedLane ? (
            <CastleMap
              lane={state.lanes[selectedLane]}
              laneId={selectedLane}
              resources={state.resources}
              builderActionLanes={builderActionLanes}
              onBuild={(laneId, slot) => actions.startBuild(laneId, slot)}
              onReinforce={(laneId) => actions.reinforce(laneId)}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center pt-4">
              Tap a lane to manage it
            </p>
          )}
          <BuildQueue actions={state.builderActions} />
        </div>
      </div>
    </main>
  )
}
