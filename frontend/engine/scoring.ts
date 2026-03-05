import { GAME_CONFIG } from '../config/gameConfig'
import type { GameState, Wall, WallId } from './types'

export function getWallsAlive(walls: Record<WallId, Wall>): number {
  return Object.values(walls).filter((w) => w.hp > 0).length
}

export function calculateScore(state: GameState): number {
  const { scoring } = GAME_CONFIG
  return (
    state.wavesCompleted * scoring.perWaveSurvived +
    state.totalEnemiesDefeated * scoring.perEnemyDefeated +
    getWallsAlive(state.walls) * scoring.perWallAlive -
    state.weaponsDestroyed * scoring.penaltyPerWeaponDestroyed -
    state.narrowBreaches * scoring.penaltyPerNarrowBreach
  )
}
