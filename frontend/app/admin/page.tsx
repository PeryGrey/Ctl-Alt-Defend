"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/_shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/_shadcn/components/ui/card";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [confirmed, setConfirmed] = useState(false);

  const { data: currentSession } = useQuery({
    queryKey: ["app_settings", "session_started_at"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "session_started_at")
        .maybeSingle();
      return data;
    },
  });

  const startSession = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "session_started_at", value: now });
      if (error) throw error;
      return now;
    },
    onSuccess: () => {
      setConfirmed(false);
      queryClient.invalidateQueries({ queryKey: ["app_settings"] });
    },
  });

  const formattedCurrent = currentSession?.value
    ? new Date(currentSession.value).toLocaleString()
    : null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">🏰 Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ctrl + Alt + Defend
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Session</CardTitle>
            <CardDescription>
              Starting a new session clears the leaderboard for all viewers.
              Games played before this time will not appear.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formattedCurrent && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Current session started:
                </span>{" "}
                {formattedCurrent}
              </div>
            )}

            {!confirmed ? (
              <Button
                className="w-full h-12 text-base"
                onClick={() => { startSession.reset(); setConfirmed(true); }}
              >
                Start New Session
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-destructive font-medium">
                  This will reset the leaderboard. Are you sure?
                </p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => startSession.mutate()}
                    disabled={startSession.isPending}
                  >
                    {startSession.isPending ? "Starting…" : "Confirm"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setConfirmed(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {startSession.isSuccess && (
              <p className="text-sm text-green-600">
                New session started successfully.
              </p>
            )}
            {startSession.isError && (
              <p className="text-sm text-destructive">
                Failed to start session. Try again.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
