"use client";
import { useEffect, useState } from "react";
import { Button } from "@/_shadcn/components/ui/button";
import type { TutorialStep } from "./tutorialSteps";

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;

interface TutorialOverlayProps {
  currentStep: TutorialStep;
  currentStepIndex: number;
  totalSteps: number;
  onGotIt: () => void;
}

export function TutorialOverlay({
  currentStep,
  currentStepIndex,
  totalSteps,
  onGotIt,
}: TutorialOverlayProps) {
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [unlocked, setUnlocked] = useState(!currentStep.unlockAfterMs);

  useEffect(() => {
    setUnlocked(!currentStep.unlockAfterMs);
    if (!currentStep.unlockAfterMs) return;
    const t = setTimeout(() => setUnlocked(true), currentStep.unlockAfterMs);
    return () => clearTimeout(t);
  }, [currentStepIndex, currentStep.unlockAfterMs]);

  useEffect(() => {
    function measure() {
      const el = document.querySelector(
        `[data-tutorial-id="${currentStep.targetId}"]`,
      );
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top - PAD,
        left: r.left - PAD,
        width: r.width + PAD * 2,
        height: r.height + PAD * 2,
      });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [currentStep.targetId]);

  const pinRight = currentStep.bannerPosition === "right";
  const spotlightMidY = rect ? rect.top + rect.height / 2 : 0;
  const viewportMid = typeof window !== "undefined" ? window.innerHeight / 2 : 400;
  const bannerAtTop = !pinRight && rect ? spotlightMidY > viewportMid : false;

  const dim = "rgba(0,0,0,0.78)";
  const blockerStyle: React.CSSProperties = {
    position: "fixed",
    background: dim,
    zIndex: 50,
    pointerEvents: "all",
  };

  return (
    <>
      {/* Step instruction banner */}
      <div
        style={{
          position: "fixed",
          ...(pinRight
            ? { top: 0, bottom: 0, right: 0, width: "30%" }
            : { ...(bannerAtTop ? { top: 0 } : { bottom: 0 }), left: 0, right: 0 }),
          zIndex: 60,
          pointerEvents: "none",
        }}
        className={`p-4 flex flex-col gap-3 ${pinRight ? "items-stretch justify-center" : "items-center"}`}
      >
        <div className="bg-card border rounded-xl px-4 py-3 max-w-sm w-full shadow-xl space-y-2">
          <div className={`flex ${pinRight ? "flex-col gap-1" : "items-center justify-between"}`}>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-4 rounded-full transition-colors ${
                    i <= currentStepIndex ? "bg-primary" : "bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm leading-snug">{currentStep.instruction}</p>
          {currentStep.trigger === "got-it" && (
            <div style={{ pointerEvents: "auto" }}>
              <Button
                size="sm"
                className="w-full h-10"
                onClick={onGotIt}
                disabled={!unlocked}
              >
                {unlocked ? "Got it" : "Brewing…"}
              </Button>
            </div>
          )}
          {currentStep.trigger === "action" && (
            <p className="text-xs text-muted-foreground italic">
              {pinRight ? "← Tap the highlighted area" : bannerAtTop ? "↓ Tap the highlighted area" : "↑ Tap the highlighted area"}
            </p>
          )}
        </div>
      </div>

      {/* Spotlight blockers — 4 rects surrounding the target */}
      {rect ? (
        <>
          {/* Top */}
          <div
            style={{
              ...blockerStyle,
              top: 0,
              left: 0,
              right: 0,
              height: rect.top,
            }}
          />
          {/* Bottom */}
          <div
            style={{
              ...blockerStyle,
              top: rect.top + rect.height,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* Left */}
          <div
            style={{
              ...blockerStyle,
              top: rect.top,
              left: 0,
              width: rect.left,
              height: rect.height,
            }}
          />
          {/* Right */}
          <div
            style={{
              ...blockerStyle,
              top: rect.top,
              left: rect.left + rect.width,
              right: 0,
              height: rect.height,
            }}
          />
        </>
      ) : (
        /* Fallback: full dim while locating element */
        <div style={{ ...blockerStyle, inset: 0 }} />
      )}
    </>
  );
}
