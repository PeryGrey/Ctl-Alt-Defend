"use client";
import { cn } from "@/_shadcn/lib/utils";
import { GAME_CONFIG } from "@/config/gameConfig";
import { AMMO_TYPES } from "@/constants/gameLabels";
import { ENEMY_TYPE_LUCIDE_ICONS } from "@/constants/gameIcons";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { BrewButton } from "@/components/alchemist/BrewButton";
import { useCountdown } from "@/components/shared/useCountdown";
import type { BrewSlot, AmmoType } from "@/engine/types";

interface BrewPanelProps {
  brewSlots: BrewSlot[];
  ammoInventory: Record<AmmoType, number>;
  onBrew: (slotIndex: 0 | 1 | 2, ammoType: AmmoType) => void;
}

const SLOT_COLORS: Record<
  AmmoType,
  { fill: string; border: string; icon: string }
> = {
  sea: {
    fill: "bg-blue-500/20",
    border: "border-blue-500/50",
    icon: "text-blue-300",
  },
  land: {
    fill: "bg-green-500/20",
    border: "border-green-500/50",
    icon: "text-green-300",
  },
  air: {
    fill: "bg-yellow-500/20",
    border: "border-yellow-500/50",
    icon: "text-yellow-300",
  },
};

function ActiveBrewSlot({
  slot,
}: {
  slot: BrewSlot & { completesAt: number; ammoType: AmmoType };
}) {
  const brewTimeSecs = GAME_CONFIG.alchemist.brewTimePerAmmoType[slot.ammoType];
  const secs = useCountdown(slot.completesAt);
  const pct = Math.min(100, ((brewTimeSecs - secs) / brewTimeSecs) * 100);
  const colors = SLOT_COLORS[slot.ammoType];
  const Icon = ENEMY_TYPE_LUCIDE_ICONS[slot.ammoType];

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 overflow-hidden",
        colors.border,
      )}
    >
      {/* bottom-to-top fill */}
      <div
        className={cn(
          "absolute inset-0 transition-transform duration-1000",
          colors.fill,
        )}
        style={{ transform: `translateY(${100 - pct}%)` }}
      />
      {/* content */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-around p-2 h-full",
          colors.icon,
        )}
      >
        <Icon className="size-6" />
        <span className="text-[10px] text-current/50 tabular-nums">
          {secs}s
        </span>
      </div>
    </div>
  );
}

function IdleBrewSlot({ slot }: { slot: BrewSlot }) {
  return (
    <div className="rounded-lg border-2 border-white/10 flex flex-col items-center justify-between p-2">
      <span className="text-[10px] text-muted-foreground/30">—</span>
      <div className="size-6" />
      <span className="text-[10px] text-muted-foreground/30">
        #{slot.slotIndex + 1}
      </span>
    </div>
  );
}

export function BrewPanel({
  brewSlots,
  ammoInventory,
  onBrew,
}: BrewPanelProps) {
  const freeSlot = brewSlots.find((s) => s.completesAt === null);
  const noFreeSlot = freeSlot === undefined;

  function handleBrew(ammoType: AmmoType) {
    if (!freeSlot) return;
    onBrew(freeSlot.slotIndex, ammoType);
  }

  return (
    <div className="space-y-3">
      <SectionLabel>Brew Slots</SectionLabel>
      <div className="h-18.5 grid grid-cols-3 gap-2" data-tutorial-id="alchemist-brew-slots">
        {brewSlots.map((slot) =>
          slot.completesAt !== null && slot.ammoType !== null ? (
            <ActiveBrewSlot
              key={slot.slotIndex}
              slot={
                slot as BrewSlot & { completesAt: number; ammoType: AmmoType }
              }
            />
          ) : (
            <IdleBrewSlot key={slot.slotIndex} slot={slot} />
          ),
        )}
      </div>

      <SectionLabel>Brew</SectionLabel>
      <div className="flex gap-2" data-tutorial-id="alchemist-brew-buttons">
        {AMMO_TYPES.map((ammoType) => (
          <BrewButton
            key={ammoType}
            ammoType={ammoType}
            brewTime={GAME_CONFIG.alchemist.brewTimePerAmmoType[ammoType]}
            stock={ammoInventory[ammoType]}
            disabled={noFreeSlot}
            onClick={() => handleBrew(ammoType)}
          />
        ))}
      </div>
    </div>
  );
}
