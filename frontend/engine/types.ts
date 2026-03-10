export type LaneId = 'moat_left' | 'bridge_left' | 'bridge_right' | 'moat_right'
export const LANE_IDS: LaneId[] = ['moat_left', 'bridge_left', 'bridge_right', 'moat_right']
export type EnemyType = 'sea' | 'land' | 'air'
export type AmmoType = 'sea' | 'land' | 'air'
export type Role = 'builder' | 'artillery' | 'alchemist'
export type GamePhase = 'wave_active' | 'between_waves' | 'game_over'

export interface Enemy {
  id: string
  type: EnemyType
  targetLane: LaneId
  hp: number
  maxHp: number
  speed: number // px/sec from config
  position: number // 0–100 progress toward castle (100 = reached)
  alive: boolean
}

export interface Weapon {
  id: string
  laneId: LaneId
  slot: 0
  durability: number // 0 = destroyed
  ammoLoaded: AmmoType | null
  exists: boolean
}

export interface Lane {
  id: LaneId
  hp: number
  maxHp: number
  weapons: [Weapon | null]
}

export interface Personnel {
  id: 0 | 1 | 2
  weaponId: string | null
  mode: 'firing' | 'maintaining' | 'idle'
}

export interface BrewSlot {
  slotIndex: 0 | 1 | 2
  ammoType: AmmoType | null
  completesAt: number | null // ms timestamp
}

export interface BuilderAction {
  type: 'build' | 'reinforce' | 'emergencyRebuild'
  laneId: LaneId
  slot: 0 | undefined
  completesAt: number // ms timestamp
}

export interface GameState {
  roomCode: string
  role: Role
  phase: GamePhase

  currentWave: number
  waveStartedAt: number // ms timestamp
  nextWaveAt: number | null // ms timestamp (set during breather)

  resources: number // Builder resource pool
  lanes: Record<LaneId, Lane>
  enemies: Enemy[]
  enemiesDefeated: number // this wave
  totalEnemiesDefeated: number // all time

  personnel: [Personnel, Personnel, Personnel]
  ammoInventory: Record<AmmoType, number>
  brewSlots: [BrewSlot, BrewSlot, BrewSlot]

  builderActions: BuilderAction[]

  score: number
  wavesCompleted: number
  weaponsDestroyed: number
  narrowBreaches: number // lanes that reached <10 HP but survived

  radarAccuracy: number // 0–100
  correctAmmoKills: number
}
