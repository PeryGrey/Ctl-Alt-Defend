import { GAME_CONFIG } from "@/config/gameConfig";
import type { GameState, Role, LaneId, Weapon } from "@/engine/types";

function makeBaseLanes(
  overrides: Partial<Record<LaneId, { hp: number; hasWeapon: boolean }>> = {},
): GameState["lanes"] {
  const laneIds: LaneId[] = ["moat_left", "bridge_left", "bridge_right", "moat_right"];
  return Object.fromEntries(
    laneIds.map((id) => {
      const o = overrides[id];
      const hp = o?.hp ?? GAME_CONFIG.lanes.startingHp;
      const hasWeapon = o?.hasWeapon ?? false;
      return [
        id,
        {
          id,
          hp,
          maxHp: GAME_CONFIG.lanes.startingHp,
          weapons: [
            hasWeapon
              ? ({
                  id: `weapon-${id}`,
                  laneId: id,
                  slot: 0 as const,
                  durability: GAME_CONFIG.weapons.startingDurability,
                  ammoLoaded: null,
                  exists: true,
                } satisfies Weapon)
              : null,
          ] as [Weapon | null],
        },
      ];
    }),
  ) as GameState["lanes"];
}

const BASE_STATE: Omit<GameState, "lanes" | "role"> = {
  roomCode: "TUTORIAL",
  phase: "wave_active",
  currentWave: 1,
  waveStartedAt: Date.now(),
  nextWaveAt: null,
  resources: 80,
  enemies: [],
  enemiesDefeated: 0,
  totalEnemiesDefeated: 0,
  personnel: [
    { id: 0, weaponId: null, mode: "idle" },
    { id: 1, weaponId: null, mode: "idle" },
    { id: 2, weaponId: null, mode: "idle" },
  ],
  ammoInventory: { sea: 3, land: 3, air: 3 },
  brewSlots: [
    { slotIndex: 0, ammoType: null, completesAt: null },
    { slotIndex: 1, ammoType: null, completesAt: null },
    { slotIndex: 2, ammoType: null, completesAt: null },
  ],
  builderActions: [],
  score: 0,
  wavesCompleted: 0,
  weaponsDestroyed: 0,
  narrowBreaches: 0,
  radarAccuracy: 0,
  correctAmmoKills: 0,
};

export const MOCK_GAME_STATES: Record<Role, GameState> = {
  // Builder: bridge_left at 60% HP to demo Reinforce; no weapons anywhere to demo Build
  builder: {
    ...BASE_STATE,
    role: "builder",
    lanes: makeBaseLanes({ bridge_left: { hp: 60, hasWeapon: false } }),
  },

  // Artillery: bridge_left has a built weapon; 3 idle personnel; ammo stocked
  artillery: {
    ...BASE_STATE,
    role: "artillery",
    lanes: makeBaseLanes({ bridge_left: { hp: GAME_CONFIG.lanes.startingHp, hasWeapon: true } }),
  },

  // Alchemist: enemies in 2 lanes at 0% radar; brew slots empty
  alchemist: {
    ...BASE_STATE,
    role: "alchemist",
    lanes: makeBaseLanes(),
    enemies: [
      {
        id: "e1",
        type: "sea",
        targetLane: "moat_left",
        hp: GAME_CONFIG.enemies.baseHp,
        maxHp: GAME_CONFIG.enemies.baseHp,
        speed: GAME_CONFIG.enemies.baseSpeedPxPerSecond,
        position: 30,
        alive: true,
      },
      {
        id: "e2",
        type: "land",
        targetLane: "bridge_right",
        hp: GAME_CONFIG.enemies.baseHp,
        maxHp: GAME_CONFIG.enemies.baseHp,
        speed: GAME_CONFIG.enemies.baseSpeedPxPerSecond,
        position: 50,
        alive: true,
      },
    ],
    radarAccuracy: 0,
  },
};
