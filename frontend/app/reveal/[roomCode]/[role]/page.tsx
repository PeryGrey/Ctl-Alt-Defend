"use client";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/_shadcn/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { Role } from "@/engine/types";

const ROLE_REVEAL: Record<
  Role,
  { career: string; quote: string; learnMoreUrl: string }
> = {
  alchemist: {
    career: "AI Engineer",
    quote:
      "Every wrong ammo kill taught your radar nothing. Every correct one made it sharper. AI engineers make sure the right data flows into models and that what comes out actually makes sense. The data quality determines everything. Garbage in, garbage out.",
    learnMoreUrl: "https://roadmap.sh/ai-engineer",
  },
  builder: {
    career: "Cloud Engineer",
    quote:
      "Every action cost something. Build too fast and you'd run dry. Too slow and the lane collapsed. Cloud engineers manage real infrastructure the same way — the skill is knowing when to scale up, when to hold back, and how to recover when something breaks.",
    learnMoreUrl: "https://roadmap.sh/devops",
  },
  artillery: {
    career: "Software Engineer",
    quote:
      "You had the tools. You had the ammo. The hard part was deciding what to do with them and when. That's software engineering — it's rarely about knowing how to code, it's about knowing what to build, in what order, under pressure, with imperfect information.",
    learnMoreUrl: "https://roadmap.sh/full-stack",
  },
};

type LeaderboardRow = {
  room_code: string;
  team_name: string;
  score: number;
  waves_survived: number;
};

export default function RevealPage() {
  const { roomCode, role } = useParams<{ roomCode: string; role: string }>();
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const check = () => setIsPortrait(window.innerHeight > window.innerWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const typedRole = (role ?? "builder") as Role;
  const reveal = ROLE_REVEAL[typedRole] ?? ROLE_REVEAL.builder;

  const { data: session } = useQuery({
    queryKey: ["session", roomCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("team_name, score, waves_survived")
        .eq("room_code", roomCode)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: Infinity,
    retry: 1,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("team_name, score, waves_survived, room_code")
        .eq("status", "complete")
        .order("score", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LeaderboardRow[];
    },
    enabled: stage === 3,
  });

  const advance = () => {
    if (stage < 3) setStage((s) => s + 1);
  };

  const currentTeamRank =
    leaderboard?.findIndex((row) => row.room_code === roomCode) ?? -1;

  if (isPortrait) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-4 p-8 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
          <path d="M9 7l3-3 3 3" />
          <path d="M12 4v6" />
        </svg>
        <p className="text-lg font-semibold">
          Please rotate your device to landscape
        </p>
        <p className="text-sm text-muted-foreground">
          This game is designed for landscape mode.
        </p>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 select-none"
      onClick={stage < 3 ? advance : undefined}
    >
      {/* Stage 0: Game Over */}
      {stage === 0 && (
        <div className="flex flex-col items-center gap-8 animate-in fade-in duration-700">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground text-xs uppercase tracking-widest">
              Game Over
            </p>
            <h1 className="text-6xl font-bold">🏰</h1>
            {session?.team_name && (
              <p className="text-2xl font-semibold">{session.team_name}</p>
            )}
          </div>
          <div className="flex gap-12 text-center">
            <div>
              <p className="text-5xl font-mono font-bold">
                {session?.score ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                Score
              </p>
            </div>
            <div>
              <p className="text-5xl font-mono font-bold">
                {session?.waves_survived ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                Waves
              </p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-4">Tap to continue</p>
        </div>
      )}

      {/* Stage 1: The Hook */}
      {stage === 1 && (
        <div className="flex flex-col items-center gap-6 text-center max-w-md animate-in fade-in duration-700">
          <p className="text-3xl font-semibold leading-snug">
            You just defended a castle.
          </p>
          <p className="text-3xl font-bold leading-snug">But actually...</p>
          <p className="text-muted-foreground text-sm">Tap to continue</p>
        </div>
      )}

      {/* Stage 2: Role Reveal */}
      {stage === 2 && (
        <div className="flex flex-col items-center gap-6 text-center max-w-sm animate-in fade-in duration-700">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs uppercase tracking-widest">
              You were a
            </p>
            <a
              href={reveal.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-4xl font-bold underline underline-offset-4 decoration-muted-foreground/40"
            >
              {reveal.career}
              <ExternalLink className="inline-block ml-2 mb-1 w-5 h-5 text-muted-foreground" />
            </a>
          </div>
          <blockquote className="text-muted-foreground text-sm leading-relaxed italic border-l-2 border-muted pl-4 text-left">
            {reveal.quote}
          </blockquote>
          <p className="text-muted-foreground text-sm">
            Tap to see the leaderboard
          </p>
        </div>
      )}

      {/* Stage 3: Leaderboard */}
      {stage === 3 && (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm animate-in fade-in duration-700">
          <div className="text-center">
            <p className="text-muted-foreground text-xs uppercase tracking-widest">
              Leaderboard
            </p>
            <h2 className="text-2xl font-bold mt-1">Event Rankings</h2>
          </div>
          <div className="w-full space-y-1">
            {leaderboard && leaderboard.length > 0 && (
              <div className="flex items-center gap-3 px-3 pb-1 text-xs text-muted-foreground uppercase tracking-widest">
                <span className="w-6" />
                <span className="flex-1">Team</span>
                <span>Score</span>
                <span className="w-16 text-right">Waves</span>
              </div>
            )}
            {!leaderboard && (
              <p className="text-center text-muted-foreground text-sm">
                Loading...
              </p>
            )}
            {leaderboard?.length === 0 && (
              <p className="text-center text-muted-foreground text-sm">
                No results yet.
              </p>
            )}
            {leaderboard?.slice(0, 3).map((row, i) => {
              const isCurrentTeam = row.room_code === roomCode;
              return (
                <div
                  key={row.room_code}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                    isCurrentTeam
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-muted/40"
                  }`}
                >
                  <span className="w-6 text-center font-mono text-xs opacity-60">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate">{row.team_name}</span>
                  <span className="font-mono font-bold">{row.score}</span>
                  <span className="text-xs opacity-60 w-16 text-right">
                    {row.waves_survived}
                  </span>
                </div>
              );
            })}
            {leaderboard && currentTeamRank >= 3 && (
              <>
                <div className="flex items-center gap-2 py-2 px-3">
                  <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm bg-primary text-primary-foreground font-semibold">
                  <span className="w-6 text-center font-mono text-xs opacity-60">
                    {currentTeamRank + 1}
                  </span>
                  <span className="flex-1 truncate">
                    {leaderboard[currentTeamRank].team_name}
                  </span>
                  <span className="font-mono font-bold">
                    {leaderboard[currentTeamRank].score}
                  </span>
                  <span className="text-xs opacity-60 w-16 text-right">
                    {leaderboard[currentTeamRank].waves_survived}
                  </span>
                </div>
              </>
            )}
          </div>
          {currentTeamRank >= 0 && (
            <p className="text-muted-foreground text-xs">
              Your team ranked #{currentTeamRank + 1} of {leaderboard?.length}
            </p>
          )}
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="mt-2"
          >
            Play Again
          </Button>
        </div>
      )}
    </main>
  );
}
