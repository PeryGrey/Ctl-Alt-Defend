"use client";
import { cn } from "@/_shadcn/lib/utils";

interface GameScreenLayoutProps {
  battlefieldView: React.ReactNode;
  header: React.ReactNode;
  actions: React.ReactNode;
  /** When true: right panel content is scrollable (alchemist).
   *  When false (default): right panel content is non-scrollable (builder, artillery). */
  scrollable?: boolean;
}

export function GameScreenLayout({
  battlefieldView,
  header,
  actions,
  scrollable = false,
}: GameScreenLayoutProps) {
  return (
    <main className="h-screen flex overflow-hidden bg-background">
      {/* ── Left 70%: Battlefield ── */}
      <div className="flex-[7] min-w-0 overflow-hidden">{battlefieldView}</div>

      {/* ── Right 30%: Action Panel ── */}
      <div className=" min-w-62.5 flex-[3] min-w-0 border-l flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 border-b space-y-2 shrink-0">{header}</div>

        {/* Content */}
        <div
          className={cn(
            "flex-1",
            scrollable
              ? "overflow-y-auto p-3 space-y-3"
              : "overflow-hidden p-2 flex flex-col",
          )}
        >
          {actions}
        </div>
      </div>
    </main>
  );
}
