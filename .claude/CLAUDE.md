# Ctrl + Alt + Defend

## What This Is

A multiplayer mobile browser-based castle defence game built for a career talk event. 3 players per team, each on their own device, defending a castle together in real time using verbal communication only.

Full game design spec: `.claude/docs/game-spec.md`
Game config (all tunable values): `frontend/config/gameConfig.ts`
Supabase schema: `.claude/docs/schema.sql`

## Stack

- **Frontend:** Next.js (App Router) + shadcn components + TanStack Query for fetching and mutating data
- **Backend:** Supabase (Postgres + Realtime)
- **Styling:** Tailwind CSS
- **Language:** TypeScript throughout — strict mode, no `any`

## Key Architectural Decisions

- Game engine runs **client-side** — compute on player devices
- Supabase Realtime used as event bus — player actions insert rows into `game_events`, all players in a room subscribe and update local UI reactively
- No auth — teams join via room code only
- No in-app chat — all communication is verbal in the room
- All game values (costs, timers, HP, damage, wave config) live in `gameConfig.ts` — no magic numbers in game logic
- **Landscape only** — all game screens are locked to landscape orientation. Show a "please rotate your device" screen in portrait mode

## UI Pattern — Select + Act

All three role screens share the same split layout in landscape:

- **Left 70%** — battlefield view (4 lanes: moat / bridge / bridge / moat). Tap a lane, weapon slot, or enemy group to select it
- **Right 30%** — action panel. Updates contextually based on what is selected on the left

This layout is identical across all roles. Each role sees the same battlefield filtered through their own information lens.

## Project Structure

```
.claude/
  CLAUDE.md
  docs/
    game-spec.md          # Full game design spec
    schema.sql            # Supabase schema
.mcp.json                 # MCP config — root level
frontend/                 # Next.js app
  _shadcn/
    components/
      ui/
  app/
    layout.tsx                          # Root layout
    providers.tsx                       # TanStack Query provider
    page.tsx                            # Landing — enter team name, room code, pick role
    lobby/[roomCode]/page.tsx           # Waiting room
    game/
      layout.tsx                        # Game route layout (landscape lock)
      [roomCode]/builder/page.tsx       # Builder screen
      [roomCode]/artillery/page.tsx     # Artillery screen
      [roomCode]/alchemist/page.tsx     # Alchemist screen
    reveal/[roomCode]/page.tsx          # Post-game reveal
    leaderboard/page.tsx                # Persistent leaderboard (not yet built)
  components/
    builder/
      CastleMap.tsx
      BuildQueue.tsx
      ResourceMeter.tsx
    artillery/
      WeaponDashboard.tsx
      PersonnelPool.tsx
    alchemist/
      BrewPanel.tsx
      AmmoInventory.tsx
      RadarPanel.tsx
    shared/
      BattlefieldView.tsx   # Shared 4-lane battlefield component
      PhaseBadge.tsx        # Wave/phase indicator badge
      useGameEngine.ts      # Game engine React hook (lives here, not in engine/)
  engine/
    gameEngine.ts           # Core game loop — runs client-side, ticks every second
    enemySpawner.ts         # Wave + enemy generation logic
    scoring.ts              # Score calculation
    types.ts                # All shared game types
  config/
    gameConfig.ts           # All tunable game values
  lib/
    supabase.ts             # Supabase client
    realtime.ts             # Realtime subscription helpers
```

## Coding Conventions

- Use `gameConfig.ts` for all numeric values — never hardcode game constants
- Game state is local — synced via Supabase Realtime events, not server-computed
- Keep game engine logic in `frontend/engine/` — completely separate from UI components
- All Supabase interactions go through `frontend/lib/`
- Always use shadcn components — if a component doesn't exist, install it
- More complex components can be standalone but must use shadcn components wherever possible
- Mobile-first, landscape-locked — all game screens must be usable on a phone in landscape

## Commands

```bash
cd frontend
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
```
