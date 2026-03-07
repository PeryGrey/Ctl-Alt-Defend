'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/_shadcn/components/ui/card'
import { Badge } from '@/_shadcn/components/ui/badge'
import type { BuilderAction } from '@/engine/types'

interface BuildQueueProps {
  actions: BuilderAction[]
}

const ACTION_LABELS: Record<BuilderAction['type'], string> = {
  build: 'Building',
  upgrade: 'Upgrading',
  reposition: 'Repositioning',
  reinforce: 'Reinforcing',
  emergencyRebuild: 'Emergency Rebuild',
}

const LANE_LABELS: Record<string, string> = {
  moat_left: 'Left Moat',
  bridge_left: 'Left Bridge',
  bridge_right: 'Right Bridge',
  moat_right: 'Right Moat',
}

function Countdown({ completesAt }: { completesAt: number }) {
  const [secs, setSecs] = useState(() => Math.max(0, Math.ceil((completesAt - Date.now()) / 1000)))

  useEffect(() => {
    const id = setInterval(() => {
      setSecs(Math.max(0, Math.ceil((completesAt - Date.now()) / 1000)))
    }, 500)
    return () => clearInterval(id)
  }, [completesAt])

  return <>{secs}s</>
}

export function BuildQueue({ actions }: BuildQueueProps) {
  if (actions.length === 0) return null

  return (
    <Card>
      <CardContent className="py-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Build Queue
        </p>
        {actions.map((a) => (
          <div
            key={`${a.laneId}-${a.slot ?? 'r'}-${a.completesAt}`}
            className="flex items-center justify-between text-sm"
          >
            <span>
              {ACTION_LABELS[a.type]}{' '}
              <span className="text-muted-foreground">{LANE_LABELS[a.laneId] ?? a.laneId}</span>
              {a.slot !== undefined && (
                <span className="text-muted-foreground"> weapon</span>
              )}
            </span>
            <Badge variant="secondary">
              <Countdown completesAt={a.completesAt} />
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
