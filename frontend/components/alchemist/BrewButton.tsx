"use client";
import { cn } from "@/_shadcn/lib/utils";
import { ENEMY_TYPE_LUCIDE_ICONS } from "@/constants/gameIcons";
import type { AmmoType } from "@/engine/types";

const AMMO_COLOR: Record<AmmoType, { idle: string; active: string }> = {
  sea: {
    idle: "border-white/15 text-white/50 hover:border-white/30 hover:text-white/70",
    active: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  },
  land: {
    idle: "border-white/15 text-white/50 hover:border-white/30 hover:text-white/70",
    active: "border-green-500/40 bg-green-500/10 text-green-300",
  },
  air: {
    idle: "border-white/15 text-white/50 hover:border-white/30 hover:text-white/70",
    active: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
  },
};

interface BrewButtonProps {
  ammoType: AmmoType;
  brewTime: number;
  stock: number;
  disabled: boolean;
  onClick: () => void;
}

export function BrewButton({ ammoType, brewTime, stock, disabled, onClick }: BrewButtonProps) {
  const Icon = ENEMY_TYPE_LUCIDE_ICONS[ammoType];
  const colors = AMMO_COLOR[ammoType];

  return (
    <button
      className={cn(
        "flex-1 rounded-lg border-2 p-3 flex flex-col items-center justify-between gap-2",
        "transition-all select-none outline-none",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        disabled ? colors.idle : colors.active,
      )}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className="size-7" />
      <span className="text-xs tabular-nums text-current/70">
        {brewTime}s · {stock}
      </span>
    </button>
  );
}
