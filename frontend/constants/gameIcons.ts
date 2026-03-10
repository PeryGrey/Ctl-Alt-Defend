import { Waves, Trees, Zap } from "lucide-react";
import type { EnemyType } from "@/engine/types";
import type { LucideIcon } from "lucide-react";

export const ENEMY_TYPE_LUCIDE_ICONS: Record<EnemyType, LucideIcon> = {
  sea: Waves,
  land: Trees,
  air: Zap,
};
