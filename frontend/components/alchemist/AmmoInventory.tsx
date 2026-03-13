"use client";
import React from "react";
import { cn } from "@/_shadcn/lib/utils";
import { Button } from "@/_shadcn/components/ui/button";
import { Card, CardContent } from "@/_shadcn/components/ui/card";
import { Separator } from "@/_shadcn/components/ui/separator";
import { AMMO_LABELS, AMMO_TYPES } from "@/constants/gameLabels";
import { ENEMY_TYPE_LUCIDE_ICONS } from "@/constants/gameIcons";
import type { AmmoType } from "@/engine/types";

const AMMO_SELECTED_STYLE: Record<AmmoType, string> = {
  sea: "border-transparent bg-blue-500/20! text-blue-300",
  land: "border-transparent bg-green-500/20! text-green-300",
  air: "border-transparent bg-yellow-500/20! text-yellow-300",
};

interface AmmoInventoryProps {
  inventory: Record<AmmoType, number>;
  /** When provided, each ammo type renders as a button that calls this on click. */
  onSelect?: (ammoType: AmmoType) => void;
  /** Highlights the currently loaded ammo type when onSelect is provided. */
  loadedAmmo?: AmmoType | null;
  /** When true, unloaded buttons with stock pulse to prompt the user to load ammo. */
  isPulse?: boolean;
}

export function AmmoInventory({
  inventory,
  onSelect,
  loadedAmmo,
  isPulse,
}: AmmoInventoryProps) {
  if (onSelect) {
    return (
      <div
        className={cn("flex gap-1.5", isPulse && "animate-pulse")}
        data-tutorial-id="artillery-load-ammo"
      >
        {AMMO_TYPES.map((type) => {
          const Icon = ENEMY_TYPE_LUCIDE_ICONS[type];
          const isLoaded = loadedAmmo === type;
          const count = inventory[type];
          return (
            <Button
              key={type}
              size="sm"
              variant="outline"
              className={cn(
                "flex-1 h-auto py-2 flex flex-col gap-1 px-2 border-2 transition-colors",
                isLoaded
                  ? AMMO_SELECTED_STYLE[type]
                  : "border-white/15 text-white/50 hover:border-white/30 hover:text-white/70",
                count <= 0 && "cursor-not-allowed animate-none",
              )}
              disabled={!isLoaded && count <= 0}
              onClick={() => {
                if (!isLoaded) onSelect(type);
              }}
            >
              <Icon className="size-5" />
              <span className="text-xs font-bold tabular-nums">{count}</span>
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center justify-around text-base font-semibold">
          {AMMO_TYPES.map((type, i) => {
            const Icon = ENEMY_TYPE_LUCIDE_ICONS[type];
            return (
              <React.Fragment key={type}>
                {i > 0 && <Separator orientation="vertical" className="h-4" />}
                <span className="flex items-center gap-1">
                  <Icon className="size-4" /> {inventory[type]}
                </span>
              </React.Fragment>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-1">
          {AMMO_TYPES.map((t) => AMMO_LABELS[t]).join(" · ")}
        </p>
      </CardContent>
    </Card>
  );
}
