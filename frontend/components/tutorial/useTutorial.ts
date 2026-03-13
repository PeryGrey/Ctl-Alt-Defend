"use client";
import { useState, useCallback } from "react";
import type { TutorialStep } from "./tutorialSteps";

interface UseTutorialOptions {
  steps: TutorialStep[];
  onComplete: () => void;
}

export function useTutorial({ steps, onComplete }: UseTutorialOptions) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const advance = useCallback(() => {
    setCurrentStepIndex((i) => {
      if (i >= steps.length - 1) {
        onComplete();
        return i;
      }
      return i + 1;
    });
  }, [steps.length, onComplete]);

  const onAction = useCallback(
    (actionType: string) => {
      const step = steps[currentStepIndex];
      if (step?.trigger === "action" && step.actionType === actionType) {
        advance();
      }
    },
    [steps, currentStepIndex, advance],
  );

  return {
    currentStep: steps[currentStepIndex],
    currentStepIndex,
    totalSteps: steps.length,
    onAction,
    advanceGotIt: advance,
  };
}
