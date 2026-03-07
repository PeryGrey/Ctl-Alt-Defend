'use client'
import { Card, CardContent } from '@/_shadcn/components/ui/card'
import { Button } from '@/_shadcn/components/ui/button'
import { Progress } from '@/_shadcn/components/ui/progress'
import { Badge } from '@/_shadcn/components/ui/badge'
import { cn } from '@/_shadcn/lib/utils'
import { GAME_CONFIG } from '@/config/gameConfig'
import type { Lane, LaneId, AmmoType, Personnel } from '@/engine/types'

interface WeaponDashboardProps {
  lanes: Record<LaneId, Lane>
  ammoInventory: Record<AmmoType, number>
  personnel: Personnel[]
  onLoadAmmo: (weaponId: string, ammoType: AmmoType) => void
  /** If provided, only show weapons in this lane */
  filterLaneId?: LaneId
}

const AMMO_LABELS: Record<AmmoType, string> = {
  cannonballs: 'Cannonballs',
  arrows: 'Arrows',
  bolts: 'Bolts',
}

const AMMO_TYPES: AmmoType[] = ['cannonballs', 'arrows', 'bolts']

const LANE_LABELS: Record<LaneId, string> = {
  moat_left: 'Left Moat',
  bridge_left: 'Left Bridge',
  bridge_right: 'Right Bridge',
  moat_right: 'Right Moat',
}

function durColorClass(dur: number): string {
  if (dur > 60) return '[&>div]:bg-green-500'
  if (dur > 20) return '[&>div]:bg-amber-500'
  return '[&>div]:bg-red-500'
}

export function WeaponDashboard({
  lanes,
  ammoInventory,
  personnel,
  onLoadAmmo,
  filterLaneId,
}: WeaponDashboardProps) {
  const lanesToShow = filterLaneId
    ? { [filterLaneId]: lanes[filterLaneId] }
    : lanes

  const weapons = Object.values(lanesToShow)
    .flatMap((lane) =>
      lane.weapons
        .filter((w): w is NonNullable<typeof w> => w !== null && w.exists)
        .map((w) => ({ weapon: w, laneLabel: LANE_LABELS[lane.id] }))
    )

  if (weapons.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          {filterLaneId
            ? 'No weapons in this lane — ask Builder to build some!'
            : 'No weapons built yet — ask Builder to build some!'}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
        Weapons
      </p>
      {weapons.map(({ weapon, laneLabel }) => {
        const durPct = (weapon.durability / GAME_CONFIG.weapons.startingDurability) * 100
        const durCritical = durPct < 20
        const assignedPersonnel = personnel.filter((p) => p.weaponId === weapon.id)

        return (
          <Card
            key={weapon.id}
            className={cn('border-2', durCritical ? 'border-destructive' : 'border-border')}
          >
            <CardContent className="py-3 px-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">
                  {laneLabel} · Slot {weapon.slot + 1}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {weapon.id.slice(-4)}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Durability</span>
                  <span>{Math.ceil(weapon.durability)}%</span>
                </div>
                <Progress
                  value={durPct}
                  className={cn('h-2', durColorClass(weapon.durability))}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Ammo:</span>
                {weapon.ammoLoaded ? (
                  <Badge variant="default">{AMMO_LABELS[weapon.ammoLoaded]}</Badge>
                ) : (
                  <Badge variant="outline">No ammo</Badge>
                )}
              </div>

              {assignedPersonnel.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Manned:{' '}
                  {assignedPersonnel.map((p) => `Soldier ${p.id + 1} (${p.mode})`).join(', ')}
                </p>
              )}

              <div className="flex gap-2 flex-wrap">
                {AMMO_TYPES.map((ammoType) => (
                  <Button
                    key={ammoType}
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs flex-1"
                    disabled={ammoInventory[ammoType] <= 0}
                    onClick={() => onLoadAmmo(weapon.id, ammoType)}
                  >
                    Load {AMMO_LABELS[ammoType]} ({ammoInventory[ammoType]})
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
