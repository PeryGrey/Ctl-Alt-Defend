import { GAME_CONFIG } from '../config/gameConfig'
import type { GameEventType } from '../lib/realtime'
import { fetchRoomEvents, subscribeToRoom } from '../lib/realtime'
import { generateWaveEnemies } from './enemySpawner'
import { calculateScore } from './scoring'
import type {
  AmmoType,
  BrewSlot,
  BuilderAction,
  Enemy,
  GamePhase,
  GameState,
  Lane,
  LaneId,
  Personnel,
  Role,
} from './types'

// ── Helpers ─────────────────────────────────────────────────────────────────

const LANE_IDS: LaneId[] = ['moat_left', 'bridge_left', 'bridge_right', 'moat_right']

function makeLane(id: LaneId): Lane {
  return {
    id,
    hp: GAME_CONFIG.lanes.startingHp,
    maxHp: GAME_CONFIG.lanes.startingHp,
    weapons: [null],
  }
}

function initialState(roomCode: string, role: Role): GameState {
  const lanes = Object.fromEntries(
    LANE_IDS.map((id) => [id, makeLane(id)])
  ) as Record<LaneId, Lane>

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
    lanes,
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

export interface GameEngine {
  start: () => void
  stop: () => void
  getState: () => GameState
  actions: {
    startBuild: (laneId: LaneId, slot: 0) => void
    reinforce: (laneId: LaneId) => void
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
  let replaying = false

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
          if (!replaying) {
            publish('enemy_spawn', { enemies: enemies as unknown as Record<string, unknown>[] })
          }
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

      case 'lane_damage': {
        const laneId = p['laneId'] as LaneId
        const newHp = p['newHp'] as number
        const lane = state.lanes[laneId]
        if (lane) {
          const prevHp = lane.hp
          lane.hp = Math.max(0, newHp)
          if (prevHp > 10 && lane.hp <= 10 && lane.hp > 0) {
            state.narrowBreaches++
          }
          state.score = calculateScore(state)
        }
        break
      }

      case 'build_start': {
        const laneId = p['laneId'] as LaneId
        const slot = p['slot'] as 0 | 1
        const completesAt = p['completesAt'] as number
        const actionType = p['actionType'] as BuilderAction['type']
        const cost = GAME_CONFIG.builder.costs[actionType] ?? GAME_CONFIG.builder.costs.build
        state.resources = Math.max(0, state.resources - cost)
        state.builderActions.push({ type: actionType, laneId, slot, completesAt })
        break
      }

      case 'build_complete': {
        const laneId = p['laneId'] as LaneId
        const slot = p['slot'] as 0 | 1
        const weaponId = p['weaponId'] as string
        state.lanes[laneId].weapons[slot] = {
          id: weaponId,
          laneId,
          slot,
          durability: GAME_CONFIG.weapons.startingDurability,
          ammoLoaded: null,
          exists: true,
        }
        break
      }

      case 'reinforce': {
        const laneId = p['laneId'] as LaneId
        const amount = p['amount'] as number
        const lane = state.lanes[laneId]
        if (lane) {
          lane.hp = Math.min(lane.maxHp, lane.hp + amount)
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
        if (state.ammoInventory[ammoType] <= 0) break
        for (const lane of Object.values(state.lanes)) {
          for (const weapon of lane.weapons) {
            if (!weapon || weapon.id !== weaponId) continue
            state.ammoInventory[ammoType]--
            weapon.ammoLoaded = ammoType  // old ammo silently lost
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

        // Reset all operational state — persists: lane HP, weapons, score, radar
        state.resources = GAME_CONFIG.builder.startingResources
        state.ammoInventory = { cannonballs: 0, arrows: 0, bolts: 0 }
        state.brewSlots = [
          { slotIndex: 0, ammoType: null, completesAt: null },
          { slotIndex: 1, ammoType: null, completesAt: null },
          { slotIndex: 2, ammoType: null, completesAt: null },
        ]
        state.builderActions = []
        state.personnel = [
          { id: 0, weaponId: null, mode: 'idle' },
          { id: 1, weaponId: null, mode: 'idle' },
          { id: 2, weaponId: null, mode: 'idle' },
        ]
        for (const lane of Object.values(state.lanes)) {
          for (const weapon of lane.weapons) {
            if (weapon) weapon.ammoLoaded = null
          }
        }

        const nextWaveAt = Date.now() + GAME_CONFIG.betweenWaveBreatherSeconds * 1000
        state.nextWaveAt = nextWaveAt

        if (isBuilder && !replaying) {
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

      case 'weapon_durability': {
        const laneId = p['laneId'] as LaneId
        const slot = p['slot'] as 0
        const durability = p['durability'] as number
        const exists = p['exists'] as boolean
        const weapon = state.lanes[laneId]?.weapons[slot]
        if (weapon) {
          weapon.durability = durability
          weapon.exists = exists
          if (!exists && !isBuilder) {
            state.weaponsDestroyed++
            state.score = calculateScore(state)
          }
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
    const { builder, weapons } = GAME_CONFIG

    // Resource regen
    state.resources = Math.min(
      state.resources + builder.resourceRegenPerSecond,
      9999
    )

    // Enemy position advance
    if (state.phase === 'wave_active') {
      for (const enemy of state.enemies) {
        if (!enemy.alive) continue
        enemy.position = Math.min(100, enemy.position + enemy.speed / 100)
      }
    }

    // Builder action completion — only Builder publishes (prevents duplicate build_complete events)
    if (isBuilder) {
      state.builderActions = state.builderActions.filter((action) => {
        if (action.completesAt <= now) {
          if (action.type === 'build' || action.type === 'emergencyRebuild') {
            if (action.slot !== undefined) {
              // Only publish if the slot isn't already occupied (e.g. restored via replay)
              const existingWeapon = state.lanes[action.laneId]?.weapons[action.slot]
              const slotOccupied = !!existingWeapon && existingWeapon.exists
              if (!slotOccupied) {
                const weaponId = `${action.laneId}-slot${action.slot}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
                publish('build_complete', { laneId: action.laneId, slot: action.slot, weaponId })
              }
            }
          }
          return false
        }
        return true
      })
    } else {
      // Non-builders discard expired actions without publishing
      state.builderActions = state.builderActions.filter((action) => action.completesAt > now)
    }

    // Brew completion — only Builder publishes (prevents duplicate brew_complete/ammo events)
    if (isBuilder) {
      for (const slot of state.brewSlots) {
        if (slot.completesAt !== null && slot.ammoType !== null && slot.completesAt <= now) {
          publish('brew_complete', { slotIndex: slot.slotIndex, ammoType: slot.ammoType })
        }
      }
    }

    // ── Builder-only maintenance restore ──────────────────────────────────
    if (isBuilder) {
      for (const lane of Object.values(state.lanes)) {
        for (const weapon of lane.weapons) {
          if (!weapon || !weapon.exists) continue
          const isMaintained = state.personnel.some(
            (p) => p.weaponId === weapon.id && p.mode === 'maintaining'
          )
          if (isMaintained) {
            const newDur = Math.min(
              weapons.startingDurability,
              weapon.durability + weapons.maintenanceRestorePerSecond
            )
            if (newDur !== weapon.durability) {
              weapon.durability = newDur
              publish('weapon_durability', {
                weaponId: weapon.id, laneId: weapon.laneId, slot: weapon.slot,
                durability: weapon.durability, exists: weapon.exists,
              })
            }
          }
        }
      }
    }

    // ── Builder-only logic ─────────────────────────────────────────────────

    if (isBuilder && state.phase === 'wave_active') {
      // Fire weapons at enemies
      for (const lane of Object.values(state.lanes)) {
        for (const weapon of lane.weapons) {
          if (!weapon || !weapon.exists || !weapon.ammoLoaded) continue
          const hasFiringPersonnel = state.personnel.some(
            (p) => p.weaponId === weapon.id && p.mode === 'firing'
          )
          if (!hasFiringPersonnel) continue

          // Find nearest alive enemy in this lane
          const target = state.enemies
            .filter((e) => e.alive && e.targetLane === lane.id)
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

          weapon.durability = Math.max(0, weapon.durability - weapons.durabilityLossPerShot)
          if (weapon.durability <= 0) {
            weapon.exists = false
            state.weaponsDestroyed++
            state.score = calculateScore(state)
          }
          publish('weapon_durability', {
            weaponId: weapon.id, laneId: weapon.laneId, slot: weapon.slot,
            durability: weapon.durability, exists: weapon.exists,
          })
        }
      }

      // Lane damage from enemies that reached the castle
      for (const enemy of state.enemies) {
        if (!enemy.alive || enemy.position < 100) continue
        const lane = state.lanes[enemy.targetLane]
        if (!lane) continue
        const newHp = Math.max(0, lane.hp - GAME_CONFIG.enemies.baseDamagePerHit)
        publish('lane_damage', {
          laneId: lane.id,
          damage: GAME_CONFIG.enemies.baseDamagePerHit,
          newHp,
        })

        if (newHp <= 0) {
          const finalScore = calculateScore(state)
          publish('game_over', { reason: 'lane_destroyed', finalScore })
          return
        }
      }

      // Wave completion check
      const aliveEnemies = state.enemies.filter((e) => e.alive)
      if (state.phase === 'wave_active' && state.enemies.length > 0 && aliveEnemies.length === 0) {
        state.phase = 'between_waves'
        publish('wave_end', { wave: state.currentWave, score: state.score })
      }
    }

    emit()
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  const actions: GameEngine['actions'] = {
    startBuild(laneId: LaneId, slot: 0) {
      const cost = GAME_CONFIG.builder.costs.build
      if (state.resources < cost) return
      const completesAt = Date.now() + GAME_CONFIG.builder.timers.build * 1000
      publish('build_start', { laneId, slot, completesAt, actionType: 'build' })
    },

    reinforce(laneId: LaneId) {
      const cost = GAME_CONFIG.builder.costs.reinforce
      if (state.resources < cost) return
      publish('reinforce', {
        laneId,
        amount: GAME_CONFIG.lanes.startingHp * 0.2, // restore 20% max HP
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

    const processedIds = new Set<string>()

    // Subscribe first so no new events are missed during the DB fetch
    unsubscribe = subscribeToRoom(roomCode, (event) => {
      if (!processedIds.has(event.id)) {
        processedIds.add(event.id)
        handleEvent({ type: event.type, payload: event.payload })
      }
    })

    // Replay historical events then start ticking
    fetchRoomEvents(roomCode)
      .then((events) => {
        // Scope replay to the most recent game session: find the last wave_start(wave=1)
        // and discard all events before it, so stale events from previous sessions are ignored.
        const lastSessionStart = [...events].reverse().findIndex(
          (e) => e.type === 'wave_start' && (e.payload as Record<string, unknown> | null)?.['wave'] === 1
        )
        const sessionEvents =
          lastSessionStart === -1
            ? events
            : events.slice(events.length - 1 - lastSessionStart)

        replaying = true
        let lastEventTs: number | null = null

        for (const event of sessionEvents) {
          const eventTs = new Date(event.created_at.replace(' ', 'T') + 'Z').getTime()
          // Apply regen for the time between events (matching what tick() would have done)
          if (lastEventTs !== null && state.phase !== 'game_over') {
            const elapsed = (eventTs - lastEventTs) / 1000
            state.resources = Math.min(
              state.resources + GAME_CONFIG.builder.resourceRegenPerSecond * elapsed,
              9999
            )
            if (state.phase === 'wave_active') {
              for (const enemy of state.enemies) {
                if (!enemy.alive) continue
                enemy.position = Math.min(100, enemy.position + (enemy.speed / 100) * elapsed)
              }
            }
          }
          processedIds.add(event.id)
          handleEvent({ type: event.type, payload: event.payload })
          lastEventTs = eventTs
        }

        // Regen from last event up to now
        if (lastEventTs !== null && state.phase !== 'game_over') {
          const elapsed = (Date.now() - lastEventTs) / 1000
          state.resources = Math.min(
            state.resources + GAME_CONFIG.builder.resourceRegenPerSecond * elapsed,
            9999
          )
          if (state.phase === 'wave_active') {
            for (const enemy of state.enemies) {
              if (!enemy.alive) continue
              enemy.position = Math.min(100, enemy.position + (enemy.speed / 100) * elapsed)
            }
          }
        }

        replaying = false

        // If the engine restarted (refresh or React StrictMode remount) while in the
        // between-waves breather, the wave_end was replayed but no timeout was set
        // (replaying=true blocks it). Resume the timeout so the next wave starts.
        if (isBuilder && state.phase === 'between_waves' && state.nextWaveAt !== null) {
          const remaining = Math.max(0, state.nextWaveAt - Date.now())
          waveBreatherTimeout = setTimeout(() => {
            const lastWave = GAME_CONFIG.waves[GAME_CONFIG.waves.length - 1].wave
            if (state.currentWave >= lastWave) {
              publish('game_over', { reason: 'victory', finalScore: calculateScore(state) })
            } else {
              publish('wave_start', { wave: state.currentWave + 1 })
            }
          }, remaining)
        }

        tickInterval = setInterval(tick, 1000)

        // Only publish wave_start on a brand-new game (no session events found)
        if (isBuilder && sessionEvents.length === 0) {
          setTimeout(() => publish('wave_start', { wave: 1 }), 500)
        }

        emit()
      })
      .catch(() => {
        // Fallback: start fresh if history fetch fails
        tickInterval = setInterval(tick, 1000)
        if (isBuilder) setTimeout(() => publish('wave_start', { wave: 1 }), 500)
        emit()
      })
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
