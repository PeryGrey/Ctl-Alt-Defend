'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/_shadcn/components/ui/badge'
import { useGameEngine } from '@/components/shared/useGameEngine'
import { BattlefieldView } from '@/components/shared/BattlefieldView'
import { PhaseBadge } from '@/components/shared/PhaseBadge'
import { RadarPanel } from '@/components/alchemist/RadarPanel'
import { BrewPanel } from '@/components/alchemist/BrewPanel'
import { AmmoInventory } from '@/components/alchemist/AmmoInventory'
import type { AmmoType, LaneId } from '@/engine/types'

export default function AlchemistPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const router = useRouter()
  const { state, actions } = useGameEngine(roomCode, 'alchemist')
  const [selectedLane, setSelectedLane] = useState<LaneId | null>(null)

  useEffect(() => {
    if (state?.phase === 'game_over') {
      router.push(`/reveal/${roomCode}`)
    }
  }, [state?.phase, roomCode, router])

  if (!state) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading game…</p>
      </main>
    )
  }

  const selectedLaneEnemyCount = selectedLane
    ? state.enemies.filter((e) => e.alive && e.targetLane === selectedLane).length
    : 0

  return (
    <main className="h-screen flex overflow-hidden bg-background">
      {/* ── Left 70%: Battlefield ── */}
      <div className="flex-[7] min-w-0 overflow-hidden">
        <BattlefieldView
          lanes={state.lanes}
          enemies={state.enemies}
          role="alchemist"
          radarAccuracy={state.radarAccuracy}
          selectedLaneId={selectedLane}
          onSelectLane={setSelectedLane}
        />
      </div>

      {/* ── Right 30%: Action Panel ── */}
      <div className="flex-[3] min-w-0 border-l flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 border-b space-y-1.5 shrink-0">
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-sm">⚗️ Wave {state.currentWave}</span>
            <PhaseBadge phase={state.phase} nextWaveAt={state.nextWaveAt} />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Score: {state.score}</div>
            <Badge variant={state.radarAccuracy > 0 ? 'default' : 'outline'} className="text-xs">
              {state.radarAccuracy}% radar
            </Badge>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Selected lane enemy summary */}
          {selectedLane && selectedLaneEnemyCount > 0 && (
            <RadarPanel
              enemies={state.enemies.filter((e) => e.targetLane === selectedLane)}
              radarAccuracy={state.radarAccuracy}
            />
          )}

          <BrewPanel
            brewSlots={state.brewSlots}
            onBrew={(slotIndex: 0 | 1 | 2, ammoType: AmmoType) =>
              actions.startBrew(slotIndex, ammoType)
            }
          />

          <AmmoInventory inventory={state.ammoInventory} />
        </div>
      </div>
    </main>
  )
}
