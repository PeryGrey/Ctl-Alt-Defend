import { GAME_CONFIG } from '../config/gameConfig'
import type { Enemy, EnemyType, WallId } from './types'

const WALL_IDS: WallId[] = ['north', 'south', 'east', 'west']
const ENEMY_TYPES: EnemyType[] = ['sea', 'land', 'air']

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

  const attackWalls = shuffle(WALL_IDS).slice(0, waveConfig.attackWalls)
  const baseHp = GAME_CONFIG.enemies.baseHp * waveConfig.hpMultiplier
  const speed = GAME_CONFIG.enemies.baseSpeedPxPerSecond * waveConfig.speedMultiplier

  const enemies: Enemy[] = []
  for (let i = 0; i < waveConfig.enemyCount; i++) {
    const targetWall = attackWalls[i % attackWalls.length]
    const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)]
    enemies.push({
      id: `w${waveNumber}-e${i}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      targetWall,
      hp: baseHp,
      maxHp: baseHp,
      speed,
      position: 0,
      alive: true,
    })
  }

  return enemies
}
