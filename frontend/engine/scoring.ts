import { GAME_CONFIG } from '../config/gameConfig'
import type { GameState, Lane, LaneId } from './types'

export function getLanesAlive(lanes: Record<LaneId, Lane>): number {
  return Object.values(lanes).filter((l) => l.hp > 0).length
}

export function calculateScore(state: GameState): number {
  const { scoring } = GAME_CONFIG
  return (
    state.wavesCompleted * scoring.perWaveSurvived +
    state.totalEnemiesDefeated * scoring.perEnemyDefeated +
    getLanesAlive(state.lanes) * scoring.perLaneAlive -
    state.weaponsDestroyed * scoring.penaltyPerWeaponDestroyed -
    state.narrowBreaches * scoring.penaltyPerNarrowBreach
  )
}
