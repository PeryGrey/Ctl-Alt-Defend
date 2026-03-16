import { supabase } from "@/lib/supabase";
import type { Weapon } from "@/engine/types";

export function getHealthColorClass(pct: number, redBelow = 30): string {
  if (pct > 60) return "[&>div]:bg-green-500";
  if (pct > redBelow) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-red-500";
}

export function hashEnemyReveal(
  enemyId: string,
  radarAccuracy: number,
): boolean {
  let hash = 5381;
  for (let i = 0; i < enemyId.length; i++) {
    hash = ((hash << 5) + hash) ^ enemyId.charCodeAt(i);
  }
  const pseudo = Math.abs(hash % 100);
  return pseudo < radarAccuracy;
}

export function isActiveWeapon(
  w: Weapon | null | undefined,
): w is Weapon {
  return w !== null && w !== undefined && w.exists;
}

export async function finalizeSession(
  roomCode: string,
  score: number,
  wavesSurvived: number,
): Promise<void> {
  await supabase
    .from("game_sessions")
    .update({ status: "complete", score, waves_survived: wavesSurvived })
    .eq("room_code", roomCode);
}
