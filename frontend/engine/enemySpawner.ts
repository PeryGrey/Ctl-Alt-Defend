import { GAME_CONFIG } from '../config/gameConfig'
import type { Enemy, EnemyType, LaneId } from './types'

const LANE_IDS: LaneId[] = ['moat_left', 'bridge_left', 'bridge_right', 'moat_right']

// Moat lanes: sea or air; Bridge lanes: land or air
const LANE_ENEMY_TYPES: Record<LaneId, EnemyType[]> = {
  moat_left: ['sea', 'air'],
  bridge_left: ['land', 'air'],
  bridge_right: ['land', 'air'],
  moat_right: ['sea', 'air'],
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function generateWaveEnemies(waveNumber: number): Enemy[] {
  const waveConfig =
    GAME_CONFIG.waves.find((w) => w.wave === waveNumber) ??
    GAME_CONFIG.waves[GAME_CONFIG.waves.length - 1]

  const attackLanes = shuffle(LANE_IDS).slice(0, waveConfig.attackLanes)
  const baseHp = GAME_CONFIG.enemies.baseHp * waveConfig.hpMultiplier
  const speed = GAME_CONFIG.enemies.baseSpeedPxPerSecond * waveConfig.speedMultiplier

  const { spawnStaggerMin, spawnStaggerMax } = GAME_CONFIG.enemies
  const enemies: Enemy[] = []
  const laneSpawnOffset: Partial<Record<LaneId, number>> = {}
  for (let i = 0; i < waveConfig.enemyCount; i++) {
    const targetLane = attackLanes[i % attackLanes.length]
    const validTypes = LANE_ENEMY_TYPES[targetLane]
    const type = validTypes[Math.floor(Math.random() * validTypes.length)]
    const currentOffset = laneSpawnOffset[targetLane] ?? 0
    const stagger = spawnStaggerMin + Math.random() * (spawnStaggerMax - spawnStaggerMin)
    laneSpawnOffset[targetLane] = currentOffset + stagger
    enemies.push({
      id: `w${waveNumber}-e${i}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      targetLane,
      hp: baseHp,
      maxHp: baseHp,
      speed,
      position: -currentOffset,
      alive: true,
    })
  }

  return enemies
}
