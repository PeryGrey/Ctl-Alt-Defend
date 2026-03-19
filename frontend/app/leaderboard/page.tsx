"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Castle, ChevronLeft } from "lucide-react";

type LeaderboardRow = {
  team_name: string;
  score: number;
  waves_survived: number;
  created_at: string;
};

async function fetchSessionStart(): Promise<string | null> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "session_started_at")
    .maybeSingle();
  return data?.value ?? null;
}

async function fetchLeaderboard(
  sessionStart: string | null,
): Promise<LeaderboardRow[]> {
  let query = supabase
    .from("game_sessions")
    .select("team_name, score, waves_survived, created_at")
    .eq("status", "complete")
    .order("score", { ascending: false })
    .order("waves_survived", { ascending: false });

  if (sessionStart) {
    query = query.gte("created_at", sessionStart);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
}

export default function LeaderboardPage() {
  const queryClient = useQueryClient();

  const { data: sessionStart, isLoading: isSessionLoading } = useQuery({
    queryKey: ["app_settings", "session_started_at"],
    queryFn: fetchSessionStart,
    staleTime: 30_000,
  });

  const { data: leaderboard, isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ["leaderboard", sessionStart],
    queryFn: () => fetchLeaderboard(sessionStart ?? null),
    enabled: sessionStart !== undefined,
    staleTime: 10_000,
  });

  // Live updates: refetch when any game_session changes
  useEffect(() => {
    const channel = supabase
      .channel("leaderboard-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_sessions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
        },
      )
      // Also watch for session start changes from admin page
      // Only invalidate app_settings — leaderboard will re-query automatically
      // once sessionStart updates in state (new query key ["leaderboard", newStart])
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["app_settings"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full">
        <Link
          href="/"
          className="group inline-flex items-center gap-1 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-[color,background-color,transform] duration-150 ease-out"
        >
          <ChevronLeft className="w-4 h-4 transition-transform duration-150 ease-out group-hover:-translate-x-0.5" />
          Back
        </Link>
        <h1 className="pb-6 text-4xl font-bold tracking-tight">Leaderboard</h1>

        {/* Table */}
        {(isSessionLoading || isLeaderboardLoading) && (
          <p className="text-center text-muted-foreground">Loading…</p>
        )}

        {!isSessionLoading &&
          !isLeaderboardLoading &&
          leaderboard?.length === 0 && (
            <>
              <style>{`
                @keyframes castle-float {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(-7px); }
                }
                @keyframes ring-pulse {
                  0% { transform: scale(1); opacity: 0.35; }
                  100% { transform: scale(1.5); opacity: 0; }
                }
              `}</style>
              <div className="flex flex-col items-center text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative mb-8">
                  <div
                    className="w-20 h-20 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-center"
                    style={{
                      animation:
                        "castle-float 4s cubic-bezier(0.45, 0, 0.55, 1) infinite",
                    }}
                  >
                    <Castle className="w-9 h-9" />
                  </div>
                  <div
                    className="absolute inset-0 rounded-2xl border border-muted-foreground/25"
                    style={{
                      animation: "ring-pulse 3s ease-out infinite",
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded-2xl border border-muted-foreground/15"
                    style={{
                      animation: "ring-pulse 3s ease-out infinite 0.8s",
                    }}
                  />
                </div>

                <p
                  className="text-lg font-semibold tracking-tight mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: "150ms", animationFillMode: "both" }}
                >
                  No games completed yet
                </p>
                <p
                  className="text-sm text-muted-foreground max-w-[220px] leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: "250ms", animationFillMode: "both" }}
                >
                  Rankings will appear once teams finish defending their
                  castles.
                </p>
              </div>
            </>
          )}

        {leaderboard && leaderboard.length > 0 && (
          <div className="space-y-2">
            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 pb-1 text-xs text-muted-foreground uppercase tracking-widest">
              <span className="w-8" />
              <span className="flex-1">Team</span>
              <span className="w-20 text-right">Score</span>
              <span className="w-16 text-right">Waves</span>
            </div>

            {leaderboard.map((row, i) => (
              <div
                key={`${row.team_name}-${row.created_at}`}
                style={{
                  animationDelay: `${i * 50}ms`,
                  animationFillMode: "both",
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  i === 0
                    ? "bg-yellow-500/10 border border-yellow-500/30"
                    : i === 1
                    ? "bg-slate-400/10 border border-slate-400/20"
                    : i === 2
                    ? "bg-amber-700/10 border border-amber-700/20"
                    : "bg-muted/30"
                }`}
              >
                <span className="w-8 text-center text-lg">
                  {medals[i] ?? (
                    <span className="font-mono text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                  )}
                </span>
                <span className="flex-1 font-medium truncate">
                  {row.team_name}
                </span>
                <span className="w-20 text-right font-mono font-bold text-base">
                  {row.score}
                </span>
                <span className="w-16 text-right text-muted-foreground">
                  {row.waves_survived}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
