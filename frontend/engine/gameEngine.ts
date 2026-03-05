import { GAME_CONFIG } from '../config/gameConfig'
import type { GameEventType } from '../lib/realtime'
import { subscribeToRoom } from '../lib/realtime'
import { generateWaveEnemies } from './enemySpawner'
import { calculateScore } from './scoring'
import type {
  AmmoType,
  BrewSlot,
  BuilderAction,
  Enemy,
  GamePhase,
  GameState,
  Personnel,
  Role,
  Wall,
  WallId,
  Weapon,
} from './types'

// ── Helpers ─────────────────────────────────────────────────────────────────

const WALL_IDS: WallId[] = ['north', 'south', 'east', 'west']

function makeWall(id: WallId): Wall {
  return {
    id,
    hp: GAME_CONFIG.walls.startingHp,
    maxHp: GAME_CONFIG.walls.startingHp,
    weapons: [null, null],
  }
}

function makeWeapon(wallId: WallId, slot: 0 | 1): Weapon {
  return {
    id: `${wallId}-slot${slot}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    wallId,
    slot,
    durability: GAME_CONFIG.weapons.startingDurability,
    ammoLoaded: null,
    exists: true,
  }
}

function initialState(roomCode: string, role: Role): GameState {
  const walls = Object.fromEntries(
    WALL_IDS.map((id) => [id, makeWall(id)])
  ) as Record<WallId, Wall>

  const personnel: [Personnel, Personnel, Personnel] = [
    { id: 0, weaponId: null, mode: 'idle' },
    { id: 1, weaponId: null, mode: 'idle' },
    { id: 2, weaponId: null, mode: 'idle' },
  ]

  const brewSlots: [BrewSlot, BrewSlot, BrewSlot] = [
    { slotIndex: 0, ammoType: null, completesAt: null },
    { slotIndex: 1, ammoType: null, completesAt: null },
    { slotIndex: 2, ammoType: null, completesAt: null },
  ]

  return {
    roomCode,
    role,
    phase: 'wave_active' as GamePhase,
    currentWave: 0,
    waveStartedAt: 0,
    nextWaveAt: null,
    resources: GAME_CONFIG.builder.startingResources,
    walls,
    enemies: [],
    enemiesDefeated: 0,
    totalEnemiesDefeated: 0,
    personnel,
    ammoInventory: { cannonballs: 0, arrows: 0, bolts: 0 },
    brewSlots,
    builderActions: [],
    score: 0,
    wavesCompleted: 0,
    weaponsDestroyed: 0,
    narrowBreaches: 0,
    radarAccuracy: GAME_CONFIG.alchemist.radarAccuracy.initial,
    correctAmmoKills: 0,
  }
}

// ── Ammo→EnemyType mapping ───────────────────────────────────────────────────

const CORRECT_AMMO: Record<string, AmmoType> = {
  sea: 'cannonballs',
  land: 'arrows',
  air: 'bolts',
}

// ── Public interfaces ────────────────────────────────────────────────────────

interface GameEngineParams {
  roomCode: string
  role: Role
  publish: (type: GameEventType, payload: Record<string, unknown>) => Promise<void>
  onStateChange: (state: GameState) => void
}

interface GameEngine {
  start: () => void
  stop: () => void
  getState: () => GameState
  actions: {
    startBuild: (wallId: WallId, slot: 0 | 1) => void
    reinforce: (wallId: WallId) => void
    assignPersonnel: (personnelId: 0 | 1 | 2, weaponId: string, mode: 'firing' | 'maintaining') => void
    unassignPersonnel: (personnelId: 0 | 1 | 2) => void
    loadAmmo: (weaponId: string, ammoType: AmmoType) => void
    startBrew: (slotIndex: 0 | 1 | 2, ammoType: AmmoType) => void
    dispatchAmmo: (ammoType: AmmoType, weaponId: string) => void
  }
}

// ── Factory ──────────────────────────────────────────────────────────────────

export function createGameEngine(params: GameEngineParams): GameEngine {
  const { roomCode, role, publish, onStateChange } = params
  const isBuilder = role === 'builder'

  let state = initialState(roomCode, role)
  let tickInterval: ReturnType<typeof setInterval> | null = null
  let unsubscribe: (() => void) | null = null
  let waveBreatherTimeout: ReturnType<typeof setTimeout> | null = null

  function emit() {
    onStateChange({ ...state })
  }

  // ── All-player event handler ────────────────────────────────────────────

  function handleEvent(event: { type: GameEventType; payload: Record<string, unknown> | null }) {
    const p = event.payload ?? {}

    switch (event.type) {
      case 'wave_start': {
        const wave = p['wave'] as number
        state.currentWave = wave
        state.phase = 'wave_active'
        state.waveStartedAt = Date.now()
        state.nextWaveAt = null
        state.enemiesDefeated = 0
        if (isBuilder) {
          // Builder generates and publishes spawns; non-builders wait for enemy_spawn
          const enemies = generateWaveEnemies(wave)
          state.enemies = enemies
          publish('enemy_spawn', { enemies: enemies as unknown as Record<string, unknown>[] })
        }
        break
      }

      case 'enemy_spawn': {
        if (!isBuilder) {
          state.enemies = (p['enemies'] as Enemy[]) ?? []
        }
        break
      }

      case 'enemy_defeated': {
        const enemyId = p['enemyId'] as string
        const ammoType = p['ammoType'] as AmmoType | undefined
        const enemy = state.enemies.find((e) => e.id === enemyId)
        if (enemy && enemy.alive) {
          enemy.alive = false
          state.enemiesDefeated++
          state.totalEnemiesDefeated++
          if (ammoType && enemy && CORRECT_AMMO[enemy.type] === ammoType) {
            state.correctAmmoKills++
          }
          state.score = calculateScore(state)
        }
        break
      }

      case 'wall_damage': {
        const wallId = p['wallId'] as WallId
        const newHp = p['newHp'] as number
        const wall = state.walls[wallId]
        if (wall) {
          const prevHp = wall.hp
          wall.hp = Math.max(0, newHp)
          if (prevHp > 10 && wall.hp <= 10 && wall.hp > 0) {
            state.narrowBreaches++
          }
          state.score = calculateScore(state)
        }
        break
      }

      case 'build_start': {
        const wallId = p['wallId'] as WallId
        const slot = p['slot'] as 0 | 1
        const completesAt = p['completesAt'] as number
        const actionType = p['actionType'] as BuilderAction['type']
        const cost = GAME_CONFIG.builder.costs[actionType] ?? GAME_CONFIG.builder.costs.build
        state.resources = Math.max(0, state.resources - cost)
        state.builderActions.push({ type: actionType, wallId, slot, completesAt })
        break
      }

      case 'build_complete': {
        const wallId = p['wallId'] as WallId
        const slot = p['slot'] as 0 | 1
        state.walls[wallId].weapons[slot] = makeWeapon(wallId, slot)
        break
      }

      case 'reinforce': {
        const wallId = p['wallId'] as WallId
        const amount = p['amount'] as number
        const wall = state.walls[wallId]
        if (wall) {
          wall.hp = Math.min(wall.maxHp, wall.hp + amount)
          state.resources = Math.max(
            0,
            state.resources - GAME_CONFIG.builder.costs.reinforce
          )
        }
        break
      }

      case 'weapon_assign': {
        const personnelId = p['personnelId'] as 0 | 1 | 2
        const weaponId = p['weaponId'] as string | null
        const mode = p['mode'] as 'firing' | 'maintaining' | 'idle'
        const person = state.personnel[personnelId]
        if (person) {
          person.weaponId = weaponId
          person.mode = mode
        }
        break
      }

      case 'brew_start': {
        const slotIndex = p['slotIndex'] as 0 | 1 | 2
        const ammoType = p['ammoType'] as AmmoType
        const completesAt = p['completesAt'] as number
        state.brewSlots[slotIndex] = { slotIndex, ammoType, completesAt }
        break
      }

      case 'brew_complete': {
        const slotIndex = p['slotIndex'] as 0 | 1 | 2
        const ammoType = p['ammoType'] as AmmoType
        state.brewSlots[slotIndex] = { slotIndex, ammoType: null, completesAt: null }
        state.ammoInventory[ammoType]++
        break
      }

      case 'ammo_dispatch': {
        const ammoType = p['ammoType'] as AmmoType
        const weaponId = p['weaponId'] as string
        if (state.ammoInventory[ammoType] > 0) {
          state.ammoInventory[ammoType]--
          for (const wall of Object.values(state.walls)) {
            for (const weapon of wall.weapons) {
              if (weapon && weapon.id === weaponId) {
                weapon.ammoLoaded = ammoType
              }
            }
          }
        }
        break
      }

      case 'wave_end': {
        const wave = p['wave'] as number
        state.wavesCompleted = wave
        state.phase = 'between_waves'
        state.score = calculateScore(state)
        state.radarAccuracy = Math.min(
          100,
          state.radarAccuracy +
            GAME_CONFIG.alchemist.radarAccuracy.increasePerCorrectKill * state.correctAmmoKills
        )
        state.correctAmmoKills = 0

        const nextWaveAt = Date.now() + GAME_CONFIG.betweenWaveBreatherSeconds * 1000
        state.nextWaveAt = nextWaveAt

        if (isBuilder) {
          if (waveBreatherTimeout) clearTimeout(waveBreatherTimeout)
          waveBreatherTimeout = setTimeout(() => {
            const lastWave = GAME_CONFIG.waves[GAME_CONFIG.waves.length - 1].wave
            if (wave >= lastWave) {
              const finalScore = calculateScore(state)
              publish('game_over', { reason: 'victory', finalScore })
            } else {
              publish('wave_start', { wave: wave + 1 })
            }
          }, GAME_CONFIG.betweenWaveBreatherSeconds * 1000)
        }
        break
      }

      case 'game_over': {
        state.phase = 'game_over'
        if (tickInterval) {
          clearInterval(tickInterval)
          tickInterval = null
        }
        break
      }

      default:
        break
    }

    emit()
  }

  // ── Tick (every second) ──────────────────────────────────────────────────

  function tick() {
    if (state.phase === 'game_over') return

    const now = Date.now()
    const { builder, weapons, alchemist } = GAME_CONFIG

    // Resource regen
    state.resources = Math.min(
      state.resources + builder.resourceRegenPerSecond,
      // No hard cap in config — use a sensible ceiling
      9999
    )

    // Enemy position advance
    if (state.phase === 'wave_active') {
      for (const enemy of state.enemies) {
        if (!enemy.alive) continue
        // position is 0–100; speed is px/sec; treat 100 units = full distance
        enemy.position = Math.min(100, enemy.position + enemy.speed / 100)
      }
    }

    // Builder action completion
    state.builderActions = state.builderActions.filter((action) => {
      if (action.completesAt <= now) {
        if (action.type === 'build' || action.type === 'emergencyRebuild') {
          if (action.slot !== undefined) {
            state.walls[action.wallId].weapons[action.slot] = makeWeapon(action.wallId, action.slot)
          }
        } else if (action.type === 'reinforce') {
          // reinforce immediate via event; nothing extra needed
        }
        return false
      }
      return true
    })

    // Brew completion
    for (const slot of state.brewSlots) {
      if (slot.completesAt !== null && slot.ammoType !== null && slot.completesAt <= now) {
        const ammoType = slot.ammoType
        slot.ammoType = null
        slot.completesAt = null
        state.ammoInventory[ammoType]++
        publish('brew_complete', { slotIndex: slot.slotIndex, ammoType })
      }
    }

    // Weapon durability: firing → lose, maintaining → gain
    for (const wall of Object.values(state.walls)) {
      for (const weapon of wall.weapons) {
        if (!weapon || !weapon.exists) continue
        const firingPersonnel = state.personnel.filter(
          (p) => p.weaponId === weapon.id && p.mode === 'firing'
        )
        const maintainingPersonnel = state.personnel.filter(
          (p) => p.weaponId === weapon.id && p.mode === 'maintaining'
        )
        if (firingPersonnel.length > 0) {
          weapon.durability = Math.max(0, weapon.durability - weapons.durabilityLossPerShot)
        }
        if (maintainingPersonnel.length > 0) {
          weapon.durability = Math.min(
            weapons.startingDurability,
            weapon.durability + weapons.maintenanceRestorePerSecond
          )
        }
        if (weapon.durability <= 0) {
          weapon.exists = false
          state.weaponsDestroyed++
          state.score = calculateScore(state)
        }
      }
    }

    // ── Builder-only logic ─────────────────────────────────────────────────

    if (isBuilder && state.phase === 'wave_active') {
      // Fire weapons at enemies
      for (const wall of Object.values(state.walls)) {
        for (const weapon of wall.weapons) {
          if (!weapon || !weapon.exists || !weapon.ammoLoaded) continue
          const hasFiringPersonnel = state.personnel.some(
            (p) => p.weaponId === weapon.id && p.mode === 'firing'
          )
          if (!hasFiringPersonnel) continue

          // Find nearest alive enemy on this wall
          const target = state.enemies
            .filter((e) => e.alive && e.targetWall === wall.id)
            .sort((a, b) => b.position - a.position)[0]

          if (!target) continue

          const isCorrectAmmo = CORRECT_AMMO[target.type] === weapon.ammoLoaded
          const damage =
            weapons.damagePerShot *
            (isCorrectAmmo ? 1 : GAME_CONFIG.artillery.wrongAmmoMultiplier)

          target.hp -= damage

          if (target.hp <= 0) {
            target.alive = false
            target.hp = 0
            state.enemiesDefeated++
            state.totalEnemiesDefeated++
            if (isCorrectAmmo) state.correctAmmoKills++
            state.score = calculateScore(state)
            publish('enemy_defeated', {
              enemyId: target.id,
              ammoType: weapon.ammoLoaded,
            })
          }

          // Weapon durability already handled above; publish fire event if destroyed
          if (weapon.durability <= 0 || !weapon.exists) {
            publish('weapon_fire', {
              weaponId: weapon.id,
              destroyed: true,
            })
          }
        }
      }

      // Wall damage from enemies that reached the wall
      for (const enemy of state.enemies) {
        if (!enemy.alive || enemy.position < 100) continue
        const wall = state.walls[enemy.targetWall]
        if (!wall) continue
        const newHp = Math.max(0, wall.hp - GAME_CONFIG.enemies.baseDamagePerHit)
        publish('wall_damage', {
          wallId: wall.id,
          damage: GAME_CONFIG.enemies.baseDamagePerHit,
          newHp,
        })
        // Enemy bounces back
        enemy.position = 80

        // Check game over
        if (newHp <= 0) {
          const finalScore = calculateScore(state)
          publish('game_over', { reason: 'wall_destroyed', finalScore })
          return
        }
      }

      // Wave completion check
      const aliveEnemies = state.enemies.filter((e) => e.alive)
      if (state.enemies.length > 0 && aliveEnemies.length === 0) {
        publish('wave_end', { wave: state.currentWave, score: state.score })
      }
    }

    emit()
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  const actions: GameEngine['actions'] = {
    startBuild(wallId: WallId, slot: 0 | 1) {
      const cost = GAME_CONFIG.builder.costs.build
      if (state.resources < cost) return
      const completesAt = Date.now() + GAME_CONFIG.builder.timers.build * 1000
      publish('build_start', { wallId, slot, completesAt, actionType: 'build' })
    },

    reinforce(wallId: WallId) {
      const cost = GAME_CONFIG.builder.costs.reinforce
      if (state.resources < cost) return
      publish('reinforce', {
        wallId,
        amount: GAME_CONFIG.walls.startingHp * 0.2, // restore 20% max HP
      })
    },

    assignPersonnel(personnelId: 0 | 1 | 2, weaponId: string, mode: 'firing' | 'maintaining') {
      publish('weapon_assign', { personnelId, weaponId, mode })
    },

    unassignPersonnel(personnelId: 0 | 1 | 2) {
      publish('weapon_assign', { personnelId, weaponId: null, mode: 'idle' })
    },

    loadAmmo(weaponId: string, ammoType: AmmoType) {
      publish('ammo_dispatch', { ammoType, weaponId })
    },

    startBrew(slotIndex: 0 | 1 | 2, ammoType: AmmoType) {
      const brewTime = GAME_CONFIG.alchemist.brewTimePerAmmoType[ammoType]
      const completesAt = Date.now() + brewTime * 1000
      publish('brew_start', { slotIndex, ammoType, completesAt })
    },

    dispatchAmmo(ammoType: AmmoType, weaponId: string) {
      if (state.ammoInventory[ammoType] <= 0) return
      publish('ammo_dispatch', { ammoType, weaponId })
    },
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  function start() {
    state = initialState(roomCode, role)

    unsubscribe = subscribeToRoom(roomCode, (event) => {
      handleEvent({
        type: event.type,
        payload: event.payload,
      })
    })

    tickInterval = setInterval(tick, 1000)

    // Builder kicks off wave 1
    if (isBuilder) {
      setTimeout(() => {
        publish('wave_start', { wave: 1 })
      }, 500)
    }

    emit()
  }

  function stop() {
    if (tickInterval) {
      clearInterval(tickInterval)
      tickInterval = null
    }
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    if (waveBreatherTimeout) {
      clearTimeout(waveBreatherTimeout)
      waveBreatherTimeout = null
    }
  }

  function getState(): GameState {
    return { ...state }
  }

  return { start, stop, getState, actions }
}
