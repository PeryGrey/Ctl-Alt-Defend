"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { GamePhase, Role } from "@/engine/types";

export function useGameOverRedirect(
  phase: GamePhase | undefined,
  roomCode: string,
  role: Role,
): void {
  const router = useRouter();
  useEffect(() => {
    if (phase === "game_over") {
      router.push(`/reveal/${roomCode}/${role}`);
    }
  }, [phase, roomCode, role, router]);
}
