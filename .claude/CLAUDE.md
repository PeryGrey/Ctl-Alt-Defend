# Ctrl + Alt + Defend

## What This Is
A multiplayer mobile browser-based castle defence game built for a career talk event. 3 players per team, each on their own device, defending a castle together in real time using verbal communication only.

Full game design spec: `docs/game-spec.md`
Game config (all tunable values): `src/config/gameConfig.ts`
Supabase schema: `docs/schema.sql`

## Stack
- **Frontend:** Next.js (App Router)
- **Backend:** Supabase (Postgres + Realtime)
- **Styling:** Tailwind CSS
- **Language:** TypeScript throughout — strict mode, no `any`

## Key Architectural Decisions
- Game engine runs **client-side** — compute on player devices
- Supabase Realtime used as event bus — player actions insert rows into `game_events`, all players in a room subscribe and update local UI reactively
- No auth — teams join via room code only
- No in-app chat — all communication is verbal in the room
- All game values (costs, timers, HP, damage, wave config) live in `gameConfig.ts` — no magic numbers in game logic

## Project Structure
```
.claude/
  CLAUDE.md
  docs/
    game-spec.md        # Full game design spec
    schema.sql          # Supabase schema
.mcp.json               # MCP config — root level
frontend/               # Next.js app
  app/
    page.tsx                          # Landing — enter team name, room code, pick role
    lobby/[roomCode]/page.tsx         # Waiting room
    game/[roomCode]/builder/page.tsx  # Builder screen
    game/[roomCode]/artillery/page.tsx
    game/[roomCode]/alchemist/page.tsx
    reveal/[roomCode]/page.tsx        # Post-game reveal
    leaderboard/page.tsx
  components/
    builder/
    artillery/
    alchemist/
    shared/
  engine/
    gameEngine.ts       # Core game loop — runs client-side, ticks every second
    enemySpawner.ts     # Wave + enemy generation logic
    scoring.ts          # Score calculation
    types.ts            # All shared game types
  config/
    gameConfig.ts       # All tunable game values
  lib/
    supabase.ts         # Supabase client
    realtime.ts         # Realtime subscription helpers
```

## Coding Conventions
- Use `gameConfig.ts` for all numeric values — never hardcode game constants
- Game state is local — synced via Supabase Realtime events, not server-computed
- Keep game engine logic in `src/engine/` — completely separate from UI components
- All Supabase interactions go through `src/lib/`
- Mobile-first — all screens must be usable on a phone

## Commands
```bash
cd frontend
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
```