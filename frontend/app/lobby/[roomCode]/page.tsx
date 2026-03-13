"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { subscribeToRoom, publishEvent, type GameEvent } from "@/lib/realtime";
import { supabase } from "@/lib/supabase";
import { Button } from "@/_shadcn/components/ui/button";
import { Badge } from "@/_shadcn/components/ui/badge";
import { Card, CardContent } from "@/_shadcn/components/ui/card";
import { ROLE_META } from "@/constants/gameLabels";
import type { Role } from "@/engine/types";

const ALL_ROLES: Role[] = ["builder", "artillery", "alchemist"];

export default function LobbyPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const myRole = searchParams.get("role") as Role | null;

  const [realtimeJoined, setRealtimeJoined] = useState<Set<Role>>(new Set());
  const [realtimeReady, setRealtimeReady] = useState<Set<Role>>(new Set());
  const [redirectedToTutorial, setRedirectedToTutorial] = useState(false);

  const { data: lobbyData } = useQuery({
    queryKey: ["lobby", roomCode],
    queryFn: async () => {
      const [sessionRes, eventsRes] = await Promise.all([
        supabase
          .from("game_sessions")
          .select("team_name")
          .eq("room_code", roomCode)
          .single(),
        supabase
          .from("game_events")
          .select("type, payload")
          .eq("room_code", roomCode)
          .in("type", ["player_join", "player_ready"]),
      ]);

      const events = eventsRes.data ?? [];
      const joinedRoles = events
        .filter((e) => e.type === "player_join")
        .map((e) => (e.payload as { role?: string } | null)?.role)
        .filter((r): r is Role => ALL_ROLES.includes(r as Role));
      const readyRoles = events
        .filter((e) => e.type === "player_ready")
        .map((e) => (e.payload as { role?: string } | null)?.role)
        .filter((r): r is Role => ALL_ROLES.includes(r as Role));

      return {
        teamName: sessionRes.data?.team_name ?? "",
        joinedRoles,
        readyRoles,
      };
    },
  });

  const joined = useMemo(
    () => new Set([...(lobbyData?.joinedRoles ?? []), ...realtimeJoined]),
    [lobbyData?.joinedRoles, realtimeJoined],
  );

  const ready = useMemo(
    () => new Set([...(lobbyData?.readyRoles ?? []), ...realtimeReady]),
    [lobbyData?.readyRoles, realtimeReady],
  );

  // Redirect current player to tutorial once on join
  useEffect(() => {
    if (myRole && joined.has(myRole) && !ready.has(myRole) && !redirectedToTutorial) {
      setRedirectedToTutorial(true);
      router.push(`/tutorial/${roomCode}/${myRole}`);
    }
  }, [myRole, joined, ready, redirectedToTutorial, roomCode, router]);

  useEffect(() => {
    const unsub = subscribeToRoom(roomCode, (event: GameEvent) => {
      if (event.type === "player_join") {
        const role = (event.payload as { role?: string } | null)?.role;
        if (role && ALL_ROLES.includes(role as Role)) {
          setRealtimeJoined((prev) => new Set([...prev, role as Role]));
        }
      }
      if (event.type === "player_ready") {
        const role = (event.payload as { role?: string } | null)?.role;
        if (role && ALL_ROLES.includes(role as Role)) {
          setRealtimeReady((prev) => new Set([...prev, role as Role]));
        }
      }
      if (event.type === "wave_start") {
        if (myRole) router.push(`/game/${roomCode}/${myRole}`);
      }
    });
    return unsub;
  }, [roomCode, myRole, router]);

  const startGame = useMutation({
    mutationFn: async () => {
      await supabase
        .from("game_sessions")
        .update({ status: "playing" })
        .eq("room_code", roomCode);
      await publishEvent(roomCode, "wave_start", { wave: 1 });
    },
    onSuccess: () => {
      if (myRole) router.push(`/game/${roomCode}/${myRole}`);
    },
  });

  const allReady = ready.size === 3;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground text-xs uppercase tracking-widest">
            Room Code
          </p>
          <h1 className="text-6xl font-mono font-bold tracking-widest mt-1">
            {roomCode}
          </h1>
          {lobbyData?.teamName && (
            <p className="text-muted-foreground mt-2 text-sm">
              {lobbyData.teamName}
            </p>
          )}
        </div>

        <div className="space-y-2">
          {ALL_ROLES.map((r) => {
            const meta = ROLE_META[r];
            const isMe = r === myRole;
            const present = joined.has(r);
            const isReady = ready.has(r);
            return (
              <Card key={r}>
                <CardContent className="flex items-center gap-3 py-3">
                  <span className="text-2xl">{meta.emoji}</span>
                  <div className="flex-1">
                    <span className="font-semibold text-sm">{meta.label}</span>
                    {isMe && (
                      <Badge variant="secondary" className="ml-2">
                        you
                      </Badge>
                    )}
                  </div>
                  {isReady ? (
                    <Badge variant="default">Ready ✓</Badge>
                  ) : present ? (
                    <Badge variant="outline">In tutorial…</Badge>
                  ) : (
                    <Badge variant="outline">Waiting…</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!allReady && (
          <p className="text-center text-muted-foreground text-sm">
            {[...joined].length === 0
              ? "Share the room code with your teammates"
              : "Waiting for everyone to complete the tutorial"}
          </p>
        )}

        {allReady && (
          <Button
            onClick={() => startGame.mutate()}
            disabled={startGame.isPending}
            className="w-full h-14 text-lg font-bold"
          >
            {startGame.isPending ? "Starting…" : "⚔️ Start Game"}
          </Button>
        )}
      </div>
    </main>
  );
}
