"use client";
import { cn } from "@/_shadcn/lib/utils";
import type { ReactNode } from "react";

type ActionButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "destructive"
  | "blue"
  | "primary-ghost"
  | "blue-ghost";

interface ActionButtonProps {
  variant?: ActionButtonVariant;
  label: string;
  stat?: ReactNode;
  statClassName?: string;
  action: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

const variantBase: Record<ActionButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  outline: "border border-border bg-transparent hover:bg-input/50",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "bg-destructive text-white hover:bg-destructive/80",
  blue: "bg-blue-700 text-white hover:bg-blue-500",
  "primary-ghost": "bg-primary/15 text-primary hover:bg-primary/25",
  "blue-ghost": "bg-blue-700/15 text-blue-400 hover:bg-blue-700/25",
};

const headerColor: Record<ActionButtonVariant, string> = {
  default: "text-black/60",
  outline: "text-muted-foreground",
  secondary: "text-black/60",
  destructive: "text-white/70",
  blue: "text-white/60",
  "primary-ghost": "text-primary/60",
  "blue-ghost": "text-blue-400/60",
};

export function ActionButton({
  variant = "default",
  label,
  stat,
  statClassName,
  action,
  disabled,
  onClick,
  className,
}: ActionButtonProps) {
  return (
    <button
      className={cn(
        "flex-1 w-full rounded-lg p-3 flex flex-col justify-between",
        "transition-all select-none outline-none",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantBase[variant],
        className,
      )}
      disabled={disabled}
      onClick={onClick}
    >
      <div
        className={cn(
          "w-full flex justify-between text-xs font-medium uppercase",
          headerColor[variant],
          disabled && "text-muted-foreground",
        )}
      >
        <span>{label}</span>
        {stat !== undefined && (
          <span className={cn("tabular-nums", statClassName)}>{stat}</span>
        )}
      </div>
      <span className="self-start text-2xl font-semibold">{action}</span>
    </button>
  );
}
