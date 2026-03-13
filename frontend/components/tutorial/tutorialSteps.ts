import type { Role } from "@/engine/types";

export type TutorialTrigger = "action" | "got-it";

export interface TutorialStep {
  instruction: string;
  targetId: string; // data-tutorial-id value to spotlight
  trigger: TutorialTrigger;
  actionType?: string; // matches the string passed to onAction()
  bannerPosition?: "right"; // pin banner to right side instead of bottom/top
  unlockAfterMs?: number; // got-it button disabled for this many ms after step becomes active
}

export const TUTORIAL_STEPS: Record<Role, TutorialStep[]> = {
  builder: [
    {
      instruction:
        "Your castle has 4 lanes. Each has HP — if any hits zero, it's game over. Tap a lane to manage it.",
      targetId: "battlefield",
      trigger: "action",
      actionType: "lane-selected",
      bannerPosition: "right",
    },
    {
      instruction:
        "Artillery can't fire without a weapon. Build one here.",
      targetId: "builder-build-button",
      trigger: "action",
      actionType: "build",
    },
    {
      instruction:
        "Enemies damage lane HP. Reinforce to restore 20%. Don't let it reach zero.",
      targetId: "builder-reinforce-button",
      trigger: "action",
      actionType: "reinforce",
    },
    {
      instruction:
        "Every action costs resources. They regenerate slowly — running dry means you can't rebuild a destroyed weapon or reinforce under attack.",
      targetId: "resource-meter",
      trigger: "got-it",
    },
  ],
  artillery: [
    {
      instruction:
        "Tap a lane to see its weapon. No weapon? Tell Builder which lane needs one.",
      targetId: "battlefield",
      trigger: "action",
      actionType: "lane-selected",
      bannerPosition: "right",
    },
    {
      instruction:
        "Assign someone to fire. Each shot costs weapon durability — let it hit zero and Builder has to rebuild from scratch.",
      targetId: "artillery-man-button",
      trigger: "action",
      actionType: "man-weapon",
    },
    {
      instruction:
        "A second person can maintain instead of fire, restoring durability. Balance firing and maintenance under pressure.",
      targetId: "artillery-maintain-button",
      trigger: "action",
      actionType: "maintain-weapon",
    },
    {
      instruction:
        "Wrong ammo deals 80% less damage. Ask Alchemist which enemy type is coming, then load the right one before firing.",
      targetId: "artillery-load-ammo",
      trigger: "action",
      actionType: "load-ammo",
    },
  ],
  alchemist: [
    {
      instruction:
        "Your radar shows incoming enemies per lane. In wave 1, you can only see counts — not types. Call out which lanes have enemies.",
      targetId: "battlefield",
      trigger: "got-it",
      bannerPosition: "right",
    },
    {
      instruction:
        "You have 3 brew slots — you can brew up to 3 ammo types simultaneously. Watch them fill up as they complete.",
      targetId: "alchemist-brew-slots",
      trigger: "got-it",
    },
    {
      instruction:
        "Tap an enemy type to brew ammo for it. Wrong ammo deals 80% less damage — coordinate with Artillery!",
      targetId: "alchemist-brew-buttons",
      trigger: "action",
      actionType: "brew",
    },
    {
      instruction:
        "Watch the slot fill up. When it's ready, Artillery can load it. You can brew multiple types at once — keep the slots busy.",
      targetId: "alchemist-brew-slots",
      trigger: "got-it",
      unlockAfterMs: 8000,
    },
    {
      instruction:
        "Every enemy killed with the correct ammo improves your radar accuracy next wave. Start at 0% — make educated guesses early. The better your calls, the sharper your radar gets.",
      targetId: "radar-accuracy-badge",
      trigger: "got-it",
    },
  ],
};
