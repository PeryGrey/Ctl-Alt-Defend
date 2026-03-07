'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/_shadcn/components/ui/card'
import { useGameEngine } from '@/components/shared/useGameEngine'
import { BattlefieldView } from '@/components/shared/BattlefieldView'
import { PhaseBadge } from '@/components/shared/PhaseBadge'
import { PersonnelPool } from '@/components/artillery/PersonnelPool'
import { WeaponDashboard } from '@/components/artillery/WeaponDashboard'
import type { AmmoType, LaneId, Weapon } from '@/engine/types'

export default function ArtilleryPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const router = useRouter()
  const { state, actions } = useGameEngine(roomCode, 'artillery')
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

  const allWeapons: Weapon[] = Object.values(state.lanes).flatMap((lane) =>
    lane.weapons.filter((w): w is Weapon => w !== null && w.exists)
  )

  const { cannonballs, arrows, bolts } = state.ammoInventory

  return (
    <main className="h-screen flex overflow-hidden bg-background">
      {/* ── Left 70%: Battlefield ── */}
      <div className="flex-[7] min-w-0 overflow-hidden">
        <BattlefieldView
          lanes={state.lanes}
          enemies={state.enemies}
          role="artillery"
          radarAccuracy={0}
          selectedLaneId={selectedLane}
          onSelectLane={setSelectedLane}
          personnel={state.personnel}
        />
      </div>

      {/* ── Right 30%: Action Panel ── */}
      <div className="flex-[3] min-w-0 border-l flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 border-b space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-sm">🎯 Wave {state.currentWave}</span>
            <PhaseBadge phase={state.phase} nextWaveAt={state.nextWaveAt} />
          </div>
          <div className="text-xs text-muted-foreground">Score: {state.score}</div>
          {/* Ammo inventory summary */}
          <Card>
            <CardContent className="py-2 px-3">
              <div className="flex items-center justify-around text-sm font-semibold">
                <span>🔮 {cannonballs}</span>
                <span>🏹 {arrows}</span>
                <span>⚡ {bolts}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <PersonnelPool
            personnel={state.personnel}
            weapons={allWeapons}
            onAssign={(id, weaponId, mode) => actions.assignPersonnel(id, weaponId, mode)}
            onUnassign={(id) => actions.unassignPersonnel(id)}
          />

          <WeaponDashboard
            lanes={state.lanes}
            ammoInventory={state.ammoInventory}
            personnel={state.personnel}
            onLoadAmmo={(weaponId: string, ammoType: AmmoType) => actions.loadAmmo(weaponId, ammoType)}
            filterLaneId={selectedLane ?? undefined}
          />
        </div>
      </div>
    </main>
  )
}
