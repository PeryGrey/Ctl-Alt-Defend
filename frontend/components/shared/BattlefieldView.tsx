'use client'
import { cn } from '@/_shadcn/lib/utils'
import { Progress } from '@/_shadcn/components/ui/progress'
import { Badge } from '@/_shadcn/components/ui/badge'
import { GAME_CONFIG } from '@/config/gameConfig'
import type { Lane, LaneId, Enemy, Personnel, Role } from '@/engine/types'

const LANE_IDS: LaneId[] = ['moat_left', 'bridge_left', 'bridge_right', 'moat_right']

const LANE_LABELS: Record<LaneId, string> = {
  moat_left: 'Moat L',
  bridge_left: 'Bridge L',
  bridge_right: 'Bridge R',
  moat_right: 'Moat R',
}

const LANE_ICONS: Record<LaneId, string> = {
  moat_left: '🌊',
  bridge_left: '🌉',
  bridge_right: '🌉',
  moat_right: '🌊',
}

const TYPE_ICONS: Record<string, string> = {
  sea: '🌊',
  land: '🏃',
  air: '🦅',
}

function hpColorClass(pct: number) {
  if (pct > 60) return '[&>div]:bg-green-500'
  if (pct > 30) return '[&>div]:bg-amber-500'
  return '[&>div]:bg-red-500'
}

function durColorClass(pct: number) {
  if (pct > 60) return '[&>div]:bg-green-500'
  if (pct > 20) return '[&>div]:bg-amber-500'
  return '[&>div]:bg-red-500'
}

// ── Builder lane content ─────────────────────────────────────────────────────

function BuilderLaneContent({
  lane,
  builderActionLanes,
}: {
  lane: Lane
  builderActionLanes: Set<string>
}) {
  const hpPct = (lane.hp / lane.maxHp) * 100
  const critical = hpPct < 30

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between text-xs">
        <span className={critical ? 'text-destructive font-bold' : 'text-muted-foreground'}>
          {Math.ceil(lane.hp)} HP
        </span>
      </div>
      <Progress value={hpPct} className={cn('h-2', hpColorClass(hpPct))} />
      <div className="space-y-0.5">
        {([0] as const).map((slot) => {
          const weapon = lane.weapons[slot]
          const inQueue = builderActionLanes.has(`${lane.id}-${slot}`)
          if (inQueue)
            return (
              <div
                key={slot}
                className="text-xs text-center py-0.5 bg-muted/50 rounded text-muted-foreground"
              >
                Building…
              </div>
            )
          if (!weapon || !weapon.exists)
            return (
              <div
                key={slot}
                className="text-xs text-center py-0.5 border border-dashed rounded text-muted-foreground"
              >
                Empty
              </div>
            )
          const durPct = (weapon.durability / GAME_CONFIG.weapons.startingDurability) * 100
          return (
            <div key={slot} className="text-xs text-center py-0.5 rounded bg-muted/30">
              <span
                className={
                  durPct < 20
                    ? 'text-destructive font-bold'
                    : durPct < 50
                      ? 'text-amber-500'
                      : 'text-green-600'
                }
              >
                {Math.ceil(durPct)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Artillery lane content ───────────────────────────────────────────────────

function ArtilleryLaneContent({
  lane,
  enemies,
  personnel,
}: {
  lane: Lane
  enemies: Enemy[]
  personnel: [Personnel, Personnel, Personnel]
}) {
  const hpPct = (lane.hp / lane.maxHp) * 100
  const laneEnemies = enemies.filter(
    (e) => e.alive && e.targetLane === lane.id && e.position >= 0 && e.position <= 100,
  )

  const weapon = lane.weapons[0]
  const weaponExists = weapon !== null && weapon?.exists
  const ammoShort =
    weaponExists && weapon?.ammoLoaded
      ? { cannonballs: '🔮', arrows: '🏹', bolts: '⚡' }[weapon.ammoLoaded]
      : '—'
  const assignedCount = weaponExists ? personnel.filter((p) => p.weaponId === weapon?.id).length : 0

  return (
    <div className="flex flex-col w-full flex-1 min-h-0">
      {/* HP bar */}
      <Progress value={hpPct} className={cn('h-1.5 shrink-0', hpColorClass(hpPct))} />

      {/* Track area */}
      <div className="relative flex-1 min-h-0 my-1">
        {/* Center road line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border/50" />

        {/* Enemy markers */}
        {laneEnemies.map((e) => (
          <span
            key={e.id}
            className="absolute left-1/2 -translate-x-1/2 text-sm leading-none"
            style={{ top: `${e.position}%` }}
          >
            👾
          </span>
        ))}
      </div>

      {/* Weapon status bar */}
      <div className="shrink-0 h-8 border-t flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>{ammoShort}</span>
        <span>{weaponExists ? `×${assignedCount}` : '—'}</span>
      </div>
    </div>
  )
}

// ── Alchemist lane content ───────────────────────────────────────────────────

function AlchemistLaneContent({
  lane,
  enemies,
  radarAccuracy,
}: {
  lane: Lane
  enemies: Enemy[]
  radarAccuracy: number
}) {
  const aliveEnemies = enemies.filter((e) => e.alive && e.targetLane === lane.id)

  if (aliveEnemies.length === 0) {
    return <div className="text-xs text-center text-muted-foreground py-1 italic">Clear</div>
  }

  // Group by revealed type
  const typeCounts: Record<string, number> = {}
  for (const e of aliveEnemies) {
    let hash = 5381
    for (let i = 0; i < e.id.length; i++) {
      hash = ((hash << 5) + hash) ^ e.id.charCodeAt(i)
    }
    const pseudo = Math.abs(hash % 100)
    const key = pseudo < radarAccuracy ? e.type : 'unknown'
    typeCounts[key] = (typeCounts[key] ?? 0) + 1
  }

  return (
    <div className="space-y-0.5 w-full">
      <div className="text-sm font-bold text-center text-destructive">{aliveEnemies.length}</div>
      {Object.entries(typeCounts).map(([type, count]) => (
        <div key={type} className="text-xs text-center">
          {TYPE_ICONS[type] ?? '?'} ×{count}
        </div>
      ))}
    </div>
  )
}

// ── Main BattlefieldView ─────────────────────────────────────────────────────

interface BattlefieldViewProps {
  lanes: Record<LaneId, Lane>
  enemies: Enemy[]
  role: Role
  radarAccuracy: number
  selectedLaneId: LaneId | null
  onSelectLane: (laneId: LaneId) => void
  personnel?: [Personnel, Personnel, Personnel]
  builderActionLanes?: Set<string>
}

export function BattlefieldView({
  lanes,
  enemies,
  role,
  radarAccuracy,
  selectedLaneId,
  onSelectLane,
  personnel,
  builderActionLanes = new Set(),
}: BattlefieldViewProps) {
  return (
    <div className="h-full flex flex-col p-2 gap-2">
      {/* 4 lane columns */}
      <div className="grid grid-cols-4 gap-1.5 flex-1">
        {LANE_IDS.map((laneId) => {
          const lane = lanes[laneId]
          const selected = selectedLaneId === laneId
          const hpPct = (lane.hp / lane.maxHp) * 100
          const critical = hpPct < 30
          const aliveCount = enemies.filter((e) => e.alive && e.targetLane === laneId).length

          return (
            <button
              key={laneId}
              onClick={() => onSelectLane(laneId)}
              className={cn(
                'flex flex-col items-start gap-1.5 p-2 rounded-lg border-2 text-left transition-colors w-full h-full',
                selected
                  ? 'border-primary bg-primary/10'
                  : critical
                    ? 'border-destructive/60 bg-destructive/5'
                    : 'border-border bg-card hover:border-primary/40',
              )}
            >
              {/* Lane header */}
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold leading-tight">{LANE_LABELS[laneId]}</span>
                <span className="text-sm">{LANE_ICONS[laneId]}</span>
              </div>

              {/* Enemy count badge — visible to all (Artillery/Builder see count; Alchemist gets type too) */}
              {role !== 'builder' && aliveCount > 0 && (
                <Badge variant="destructive" className="text-xs px-1 py-0 h-4">
                  {aliveCount}
                </Badge>
              )}

              {/* Role-specific lane content */}
              {role === 'builder' && (
                <BuilderLaneContent lane={lane} builderActionLanes={builderActionLanes} />
              )}
              {role === 'artillery' && personnel && (
                <ArtilleryLaneContent lane={lane} enemies={enemies} personnel={personnel} />
              )}
              {role === 'alchemist' && (
                <AlchemistLaneContent
                  lane={lane}
                  enemies={enemies}
                  radarAccuracy={radarAccuracy}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Castle wall indicator */}
      <div className="text-center text-xs text-muted-foreground border-t pt-1 shrink-0">
        🏰 Castle edge
      </div>
    </div>
  )
}
