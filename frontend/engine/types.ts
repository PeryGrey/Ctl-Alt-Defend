export type WallId = 'north' | 'south' | 'east' | 'west'
export type EnemyType = 'sea' | 'land' | 'air' // sea→cannonballs, land→arrows, air→bolts
export type AmmoType = 'cannonballs' | 'arrows' | 'bolts'
export type Role = 'builder' | 'artillery' | 'alchemist'
export type GamePhase = 'wave_active' | 'between_waves' | 'game_over'

export interface Enemy {
  id: string
  type: EnemyType
  targetWall: WallId
  hp: number
  maxHp: number
  speed: number // px/sec from config
  position: number // 0–100 progress toward wall (100 = reached)
  alive: boolean
}

export interface Weapon {
  id: string
  wallId: WallId
  slot: 0 | 1
  durability: number // 0 = destroyed
  ammoLoaded: AmmoType | null
  exists: boolean
}

export interface Wall {
  id: WallId
  hp: number
  maxHp: number
  weapons: [Weapon | null, Weapon | null]
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
  type: 'build' | 'upgrade' | 'reposition' | 'reinforce' | 'emergencyRebuild'
  wallId: WallId
  slot: 0 | 1 | undefined
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
  walls: Record<WallId, Wall>
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
  narrowBreaches: number // walls that reached <10 HP but survived

  radarAccuracy: number // 0–100
  correctAmmoKills: number
}
