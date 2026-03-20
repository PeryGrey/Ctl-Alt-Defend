"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { publishEvent } from "@/lib/realtime";
import { Button } from "@/_shadcn/components/ui/button";
import { Input } from "@/_shadcn/components/ui/input";
import { Label } from "@/_shadcn/components/ui/label";
import { cn } from "@/_shadcn/lib/utils";
import { ROLE_META } from "@/constants/gameLabels";
import type { Role } from "@/engine/types";
import { ChevronLeft, Maximize } from "lucide-react";

type Mode = "home" | "create" | "join";

const ALL_ROLES: Role[] = ["builder", "artillery", "alchemist"];

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

export default function Page() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("home");
  const [teamName, setTeamName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [validationError, setValidationError] = useState("");

  function reset() {
    setValidationError("");
    setRole(null);
  }

  const createRoom = useMutation({
    mutationFn: async ({
      name,
      selectedRole,
    }: {
      name: string;
      selectedRole: Role;
    }) => {
      const code = generateRoomCode();
      const { error } = await supabase
        .from("game_sessions")
        .insert({ room_code: code, team_name: name, status: "waiting" });
      if (error) throw new Error("Failed to create room");
      await publishEvent(code, "player_join", { role: selectedRole });
      return { code, role: selectedRole };
    },
    onSuccess: ({ code, role: selectedRole }) => {
      router.push(`/lobby/${code}?role=${selectedRole}`);
    },
  });

  const joinRoom = useMutation({
    mutationFn: async ({
      code,
      selectedRole,
    }: {
      code: string;
      selectedRole: Role;
    }) => {
      const normalised = code.trim().toUpperCase();
      const { data, error } = await supabase
        .from("game_sessions")
        .select("status")
        .eq("room_code", normalised)
        .single();
      if (error || !data) throw new Error("Room not found");
      if (data.status !== "waiting") throw new Error("Game already started");
      await publishEvent(normalised, "player_join", { role: selectedRole });
      return { code: normalised, role: selectedRole };
    },
    onSuccess: ({ code, role: selectedRole }) => {
      router.push(`/lobby/${code}?role=${selectedRole}`);
    },
  });

  function handleCreate() {
    if (!teamName.trim()) {
      setValidationError("Enter a team name");
      return;
    }
    if (!role) {
      setValidationError("Pick a role");
      return;
    }
    setValidationError("");
    createRoom.mutate({ name: teamName.trim(), selectedRole: role });
  }

  function handleJoin() {
    if (!roomCode.trim()) {
      setValidationError("Enter a room code");
      return;
    }
    if (!role) {
      setValidationError("Pick a role");
      return;
    }
    setValidationError("");
    joinRoom.mutate({ code: roomCode, selectedRole: role });
  }

  const createError = validationError || createRoom.error?.message;
  const joinError = validationError || joinRoom.error?.message;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 landscape:py-3">
      <div className="w-full max-w-sm landscape:max-w-2xl space-y-6">
        {mode === "home" && (
          <>
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                🏰 Ctrl + Alt + Defend
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Defend the castle. Don&apos;t let the walls fall.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => setMode("create")}
                className="w-full h-12 text-base"
              >
                Create Room
              </Button>
              <Button
                variant="secondary"
                onClick={() => setMode("join")}
                className="w-full h-12 text-base"
              >
                Join Room
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/leaderboard")}
                className="w-full"
              >
                View Leaderboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => document.documentElement.requestFullscreen?.()}
                className="w-full"
              >
                <Maximize className="w-4 h-4 mr-2" />
                Full Screen
              </Button>
            </div>
          </>
        )}

        {mode === "create" && (
          <div>
            <button
              onClick={() => {
                setMode("home");
                reset();
              }}
              className="group inline-flex items-center gap-1 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-[color,background-color,transform] duration-150 ease-out animate-in fade-in slide-in-from-bottom-2 fill-mode-[both]"
            >
              <ChevronLeft className="w-4 h-4 transition-transform duration-150 ease-out group-hover:-translate-x-0.5" />
              Back
            </button>
            <div className="landscape:-mt-6 landscape:grid landscape:grid-cols-2 landscape:gap-8 landscape:items-center space-y-3 landscape:space-y-0">
              {/* Left column: title + input */}
              <div className="space-y-3">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 [animation-delay:50ms] fill-mode-[both]">
                  <h1 className="text-4xl landscape:text-2xl font-bold tracking-tight">
                    Create a Room
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your teammates will join using your room code.
                  </p>
                </div>
                <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300 [animation-delay:150ms] fill-mode-[both]">
                  <Label htmlFor="team-name">Team name</Label>
                  <Input
                    id="team-name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="The Debugging Dragons"
                    maxLength={30}
                    className="h-10"
                  />
                </div>
              </div>
              {/* Right column: role picker + submit */}
              <div className="space-y-3">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 [animation-delay:200ms] fill-mode-[both]">
                  <RolePicker selected={role} onSelect={setRole} />
                </div>
                {createError && (
                  <p className="text-destructive text-sm">{createError}</p>
                )}
                <Button
                  onClick={handleCreate}
                  disabled={createRoom.isPending}
                  className="w-full h-12 text-base animate-in fade-in slide-in-from-bottom-2 duration-300 [animation-delay:250ms] fill-mode-[both]"
                >
                  {createRoom.isPending ? "Creating…" : "Create Room"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div>
            <button
              onClick={() => {
                setMode("home");
                reset();
              }}
              className="group inline-flex items-center gap-1 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-[color,background-color,transform] duration-150 ease-out animate-in fade-in slide-in-from-bottom-2 fill-mode-[both]"
            >
              <ChevronLeft className="w-4 h-4 transition-transform duration-150 ease-out group-hover:-translate-x-0.5" />
              Back
            </button>
            <div className="landscape:-mt-6 landscape:grid landscape:grid-cols-2 landscape:gap-8 landscape:items-center space-y-3 landscape:space-y-0">
              {/* Left column: title + input */}
              <div className="space-y-3">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 [animation-delay:50ms] fill-mode-[both]">
                  <h1 className="text-4xl landscape:text-2xl font-bold tracking-tight">
                    Join a Room
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter the 4-letter code from your teammate.
                  </p>
                </div>
                <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300 [animation-delay:150ms] fill-mode-[both]">
                  <Label htmlFor="room-code">Room code</Label>
                  <Input
                    id="room-code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="ABCD"
                    maxLength={4}
                    className="h-12 text-center text-2xl font-mono tracking-widest uppercase"
                  />
                </div>
              </div>
              {/* Right column: role picker + submit */}
              <div className="space-y-3">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 [animation-delay:200ms] fill-mode-[both]">
                  <RolePicker selected={role} onSelect={setRole} />
                </div>
                {joinError && (
                  <p className="text-destructive text-sm">{joinError}</p>
                )}
                <Button
                  onClick={handleJoin}
                  disabled={joinRoom.isPending}
                  className="w-full h-12 text-base animate-in fade-in slide-in-from-bottom-2 duration-300 [animation-delay:250ms] fill-mode-[both]"
                >
                  {joinRoom.isPending ? "Joining…" : "Join Room"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function RolePicker({
  selected,
  onSelect,
}: {
  selected: Role | null;
  onSelect: (r: Role) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>Pick your role</Label>
      <div className="space-y-2">
        {ALL_ROLES.map((id) => {
          const r = ROLE_META[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={cn(
                "w-full text-left px-3 py-2.5 landscape:py-1.5 rounded-md border text-sm transition-colors",
                selected === id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              <span className="font-semibold text-foreground">
                {r.emoji} {r.label}
              </span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                {r.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
