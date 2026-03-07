'use client'
import { useMemo } from 'react'
import { Card, CardContent } from '@/_shadcn/components/ui/card'
import { Badge } from '@/_shadcn/components/ui/badge'
import type { Enemy, LaneId } from '@/engine/types'

interface RadarPanelProps {
  enemies: Enemy[]
  radarAccuracy: number
}

const LANE_LABELS: Record<LaneId, string> = {
  moat_left: 'Left Moat',
  bridge_left: 'Left Bridge',
  bridge_right: 'Right Bridge',
  moat_right: 'Right Moat',
}

const TYPE_LABELS: Record<string, string> = {
  sea: 'Sea',
  land: 'Land',
  air: 'Air',
}

export function RadarPanel({ enemies, radarAccuracy }: RadarPanelProps) {
  const alive = enemies.filter((e) => e.alive)

  const revealKey = [...alive.map((e) => e.id), radarAccuracy].join()
  const revealMap = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const e of alive) {
      let hash = 5381
      for (let i = 0; i < e.id.length; i++) {
        hash = ((hash << 5) + hash) ^ e.id.charCodeAt(i)
      }
      const pseudo = Math.abs(hash % 100)
      map.set(e.id, pseudo < radarAccuracy)
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealKey])

  // Group by lane
  const byLane = useMemo(() => {
    const groups: Partial<Record<LaneId, Enemy[]>> = {}
    for (const e of alive) {
      if (!groups[e.targetLane]) groups[e.targetLane] = []
      groups[e.targetLane]!.push(e)
    }
    for (const laneId of Object.keys(groups) as LaneId[]) {
      groups[laneId]!.sort((a, b) => b.position - a.position)
    }
    return groups
  }, [alive])

  const lanesUnderAttack = Object.keys(byLane) as LaneId[]

  return (
    <Card>
      <CardContent className="py-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Radar
          </p>
          <Badge variant={radarAccuracy > 0 ? 'default' : 'outline'}>
            {radarAccuracy}% accuracy
          </Badge>
        </div>

        {alive.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">No enemies detected</p>
        )}

        {lanesUnderAttack.map((laneId) => (
          <div key={laneId} className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">
              {LANE_LABELS[laneId]}
            </p>
            {byLane[laneId]!.map((enemy) => {
              const typeRevealed = revealMap.get(enemy.id) ?? false
              return (
                <div
                  key={enemy.id}
                  className="flex items-center justify-between text-sm py-1 border-b last:border-0"
                >
                  <span>
                    {typeRevealed ? (
                      <Badge variant="default" className="text-xs">
                        {TYPE_LABELS[enemy.type]}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Unknown
                      </Badge>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(enemy.position)}% close
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
