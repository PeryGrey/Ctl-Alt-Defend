export const GAME_CONFIG = {
  // ── ARTILLERY ──────────────────────────────────────────────────────────────
  artillery: {
    personnelCount: 3, // number of assignable artillery people
    wrongAmmoMultiplier: 0.2, // damage multiplier when wrong ammo is used (20% damage)
  },

  // ── BUILDER ────────────────────────────────────────────────────────────────
  builder: {
    resourceRegenPerSecond: 5,
    startingResources: 50,
    costs: {
      build: 30,
      upgrade: 20,
      reposition: 10,
      reinforce: 10,
      emergencyRebuild: 40,
    },
    timers: {
      build: 10, // seconds
      upgrade: 7,
      reposition: 5,
      reinforce: 3,
      emergencyRebuild: 15,
    },
  },

  // ── LANES ──────────────────────────────────────────────────────────────────
  lanes: {
    startingHp: 100,
    slotsPerLane: 1, // number of weapon slots per lane
  },

  // ── WEAPONS ────────────────────────────────────────────────────────────────
  weapons: {
    startingDurability: 100,
    durabilityLossPerShot: 5,
    damagePerShot: 20,
    fireRatePerSecond: 1, // shots per second when manned
    maintenanceRestorePerSecond: 10, // durability restored per second when maintained
  },

  // ── ALCHEMIST ──────────────────────────────────────────────────────────────
  alchemist: {
    brewSlots: 3,
    brewTimePerAmmoType: {
      cannonballs: 8, // seconds
      arrows: 6,
      bolts: 7,
    },
    radarAccuracy: {
      initial: 0, // 0% at start of game
      increasePerCorrectKill: 10, // applied after each wave
    },
  },

  // ── ENEMIES ────────────────────────────────────────────────────────────────
  enemies: {
    baseHp: 50,
    baseDamagePerHit: 10, // damage dealt to wall per hit
    baseSpeedPxPerSecond: 30,
    spawnStaggerMin: 10, // min position units between consecutive enemies in the same lane
    spawnStaggerMax: 20, // max position units between consecutive enemies in the same lane
  },

  // ── WAVES ──────────────────────────────────────────────────────────────────
  betweenWaveBreatherSeconds: 15,
  waves: [
    {
      wave: 1,
      enemyCount: 5,
      attackLanes: 1,
      speedMultiplier: 1.0,
      hpMultiplier: 1.0,
    },
    {
      wave: 2,
      enemyCount: 8,
      attackLanes: 2,
      speedMultiplier: 1.0,
      hpMultiplier: 1.5,
    },
    {
      wave: 3,
      enemyCount: 12,
      attackLanes: 2,
      speedMultiplier: 1.5,
      hpMultiplier: 2.0,
    },
    {
      wave: 4,
      enemyCount: 16,
      attackLanes: 3,
      speedMultiplier: 1.5,
      hpMultiplier: 2.5,
    },
    {
      wave: 5,
      enemyCount: 20,
      attackLanes: 3,
      speedMultiplier: 2.0,
      hpMultiplier: 3.0,
    },
    {
      wave: 6,
      enemyCount: 25,
      attackLanes: 4,
      speedMultiplier: 2.0,
      hpMultiplier: 3.5,
    },
    {
      wave: 7,
      enemyCount: 30,
      attackLanes: 4,
      speedMultiplier: 2.5,
      hpMultiplier: 4.0,
    },
  ],

  // ── SCORING ────────────────────────────────────────────────────────────────
  scoring: {
    perWaveSurvived: 100,
    perEnemyDefeated: 10,
    perLaneAlive: 50,
    penaltyPerWeaponDestroyed: 20,
    penaltyPerNarrowBreach: 5,
  },
} as const
