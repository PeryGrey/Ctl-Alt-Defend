import type { LaneId, EnemyType, AmmoType, Role } from "@/engine/types";


export const LANE_LABELS: Record<LaneId, string> = {
  moat_left: "Left Moat",
  bridge_left: "Left Bridge",
  bridge_right: "Right Bridge",
  moat_right: "Right Moat",
};

// export const LANE_LABELS_SHORT: Record<LaneId, string> = {
//   moat_left: "Moat L",
//   bridge_left: "Bridge L",
//   bridge_right: "Bridge R",
//   moat_right: "Moat R",
// };

export const LANE_ICONS: Record<LaneId, string> = {
  moat_left: "🌊",
  bridge_left: "🌉",
  bridge_right: "🌉",
  moat_right: "🌊",
};

export const ENEMY_TYPE_LABELS: Record<EnemyType, string> = {
  sea: "Sea",
  land: "Land",
  air: "Air",
};


export const AMMO_LABELS: Record<AmmoType, string> = {
  sea: "Sea",
  land: "Land",
  air: "Air",
};

export const AMMO_TYPES: AmmoType[] = ["sea", "land", "air"];

export const ROLE_META: Record<
  Role,
  { label: string; emoji: string; description: string }
> = {
  builder: {
    label: "Builder",
    emoji: "🏗️",
    description: "Manage the castle — place weapons, reinforce walls",
  },
  artillery: {
    label: "Artillery",
    emoji: "🎯",
    description: "Operate the weapons — fire, assign personnel, maintain",
  },
  alchemist: {
    label: "Alchemist",
    emoji: "⚗️",
    description: "Read the radar — brew ammo, call out threats",
  },
};
