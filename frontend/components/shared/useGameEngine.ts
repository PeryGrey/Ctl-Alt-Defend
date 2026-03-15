'use client'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { createGameEngine } from '@/engine/gameEngine'
import { publishEvent } from '@/lib/realtime'
import type { GameState, Role, LaneId, AmmoType, WeaponFirePayload } from '@/engine/types'
import type { GameEngine } from '@/engine/gameEngine'

export function useGameEngine(
  roomCode: string,
  role: Role,
  options?: { onWeaponFire?: (payload: WeaponFirePayload) => void }
) {
  const [state, setState] = useState<GameState | null>(null)
  const engineRef = useRef<GameEngine | null>(null)

  useEffect(() => {
    const engine = createGameEngine({
      roomCode,
      role,
      publish: (type, payload) => publishEvent(roomCode, type, payload),
      onStateChange: setState,
      onWeaponFire: options?.onWeaponFire,
    })
    engineRef.current = engine
    engine.start()
    return () => {
      engine.stop()
      engineRef.current = null
    }
  }, [roomCode, role])

  const startBuild = useCallback((laneId: LaneId, slot: 0) => {
    engineRef.current?.actions.startBuild(laneId, slot)
  }, [])

  const reinforce = useCallback((laneId: LaneId) => {
    engineRef.current?.actions.reinforce(laneId)
  }, [])

  const assignPersonnel = useCallback(
    (personnelId: 0 | 1 | 2, weaponId: string, mode: 'firing' | 'maintaining') => {
      engineRef.current?.actions.assignPersonnel(personnelId, weaponId, mode)
    },
    []
  )

  const unassignPersonnel = useCallback((personnelId: 0 | 1 | 2) => {
    engineRef.current?.actions.unassignPersonnel(personnelId)
  }, [])

  const loadAmmo = useCallback((weaponId: string, ammoType: AmmoType) => {
    engineRef.current?.actions.loadAmmo(weaponId, ammoType)
  }, [])

  const startBrew = useCallback((slotIndex: 0 | 1 | 2, ammoType: AmmoType) => {
    engineRef.current?.actions.startBrew(slotIndex, ammoType)
  }, [])

  const dispatchAmmo = useCallback((ammoType: AmmoType, weaponId: string) => {
    engineRef.current?.actions.dispatchAmmo(ammoType, weaponId)
  }, [])

  const actions = useMemo<GameEngine['actions']>(() => ({
    startBuild,
    reinforce,
    assignPersonnel,
    unassignPersonnel,
    loadAmmo,
    startBrew,
    dispatchAmmo,
  }), [startBuild, reinforce, assignPersonnel, unassignPersonnel, loadAmmo, startBrew, dispatchAmmo])

  return { state, actions }
}
