# 🏰 Ctrl + Alt + Defend — Game Design Spec

## Overview

A multiplayer mobile browser-based castle defence game for a career talk event, designed for groups of teenagers and young adults (15–30). Players defend a castle as a team of 3, each on their own device, without knowing their tech career counterparts upfront. After the game, a reveal screen maps each role to a real tech career.

**Core design principle:** One tight loop per role. Each loop produces output that becomes another role's input. The game is impossible to play without verbal communication.

**Lose condition:** Any lane's HP hits zero — enemies breach the castle and the game ends immediately. No recovery.

**Communication method:** Verbal, in the room. No in-app chat.

**Orientation:** Landscape only. Show a "please rotate your device" screen in portrait mode.

---

## Goals

- Make players experience what Cloud Engineers, Software Engineers, and AI Engineers actually do — through play, not explanation
- Create fun and intuitive game loop (~10 mins of gameplay) which relies on interaction between players to succeed
- Reveal the career metaphor after the game so the "aha!" moment lands harder
- Rank teams on a persistent leaderboard across all attempts at the event

---

## Team Structure

- Exactly 3 players per team, one per role
- Each player opens the game on their own device
- Players join the same team via a shared team name / room code

---

## The Battlefield

A bridge and moat view with **4 lanes** enemies advance through toward the castle:

```
[moat][bridge][bridge][moat]
```

- **Moat lanes (left + right)** — sea or air enemies
- **Bridge lanes (centre 2)** — land or air enemies
- **Air enemies** — can appear in any lane

Each lane has its own HP bar. If any lane HP hits zero — game over.

---

## Screen Layout (All Roles)

All three roles share the same split-screen layout in landscape:

```
┌─────────────────────────────┬──────────────────┐
│                             │                  │
│   BATTLEFIELD VIEW (70%)    │  ACTION PANEL    │
│                             │     (30%)        │
│  [moat][bridge][bridge][moat]│                 │
│                             │  context-aware   │
│   enemies approaching →     │  buttons based   │
│                             │  on selection    │
│   weapons along castle edge │                  │
│                             │                  │
└─────────────────────────────┴──────────────────┘
```

**Select + Act model:**

- Left side — tap a lane, weapon slot, or enemy group to select it
- Right side — action panel updates contextually based on selection

This layout is identical across all three roles. Each role sees the same battlefield but with different information filtered through their lens. Zero relearning when switching roles.

---

## The Three Roles

### 🏗️ Builder _(reveal: Cloud Engineer)_

Manages the castle's defensive infrastructure. Places, upgrades and repositions weapons along the castle edge. Monitors lane HP and reinforces under attack. Manages a slow-regenerating resource pool across all actions. No headcount concept — all actions are governed purely by the resource pool.

### 🎯 Artillery _(reveal: Software Engineer)_

Operates the weapons. Assigns X artillery people across multiple weapons, manages ammo types, and balances firing vs weapon durability. Each person can either **fire** or **maintain** a weapon — not both simultaneously. If a weapon hits zero durability it is destroyed and must be rebuilt from scratch by Builder.

### ⚗️ Alchemist _(reveal: AI Engineer)_

Monitors a radar showing incoming enemy signals. Brews ammo for 3 enemy types across 3 concurrent production slots. Calls out lane and enemy compositions to the team. The radar starts blind — lane only, no enemy type — and gets smarter as the team generates clean data by defeating enemies with correct ammo.

---

## The Three Enemy Types

| Enemy   | Lane              | Ammo Brewed |
| ------- | ----------------- | ----------- |
| 🌊 Sea  | Moat lanes only   | Cannonballs |
| 🏃 Land | Bridge lanes only | Arrows      |
| 🦅 Air  | Any lane          | Bolts       |

Wrong ammo type = weapon does significantly reduced damage. Getting the right ammo to the right weapon at the right time is the core Alchemist/Artillery coordination challenge.

---

## Information Asymmetry — What Each Role Sees

Same battlefield, different lenses. Nobody has the full picture — forcing constant communication as the default state.

### 🏗️ Builder sees:

- All weapon slots along the castle edge (built and empty)
- Lane HP bars
- Resource pool and regeneration rate
- Build queue timers

### 🏗️ Builder does NOT see:

- Enemies or their positions
- Ammo stock levels
- Artillery personnel assignments

### 🎯 Artillery sees:

- All built weapons and their status (durability bar, ammo loaded, assigned personnel)
- Ammo inventory per type
- Personnel tokens and assignments

### 🎯 Artillery does NOT see:

- Enemies or their positions
- Lane HP bars
- Builder's resource pool

### ⚗️ Alchemist sees:

- Enemy counts per lane (how many incoming)
- Enemy type per lane — revealed % based on radar accuracy
- Does NOT see enemy position within the lane
- Brew slots and timers
- Radar accuracy %

### ⚗️ Alchemist does NOT see:

- Lane HP bars
- Weapon durability or status
- Artillery personnel assignments

---

## Global Game Clock

All game logic runs on client devices. The **Builder client acts as the session authority**:
- Publishes `wave_start` and `wave_end` events
- Fires weapons at enemies each tick, publishes `enemy_defeated` and `weapon_durability`
- Publishes `brew_complete` when a brew slot timer expires
- Manages the between-wave breather timer and triggers the next wave

All other clients (Artillery, Alchemist) consume these events reactively. Every client independently advances enemy positions each tick for smooth local rendering.

Per-second ticks per client:
- Builder resource pool, action timers, weapon firing, brew completion (Builder client)
- Enemy movement (all clients, local simulation)

---

## Game Loop — Interaction Web

```
Alchemist reads radar → calls lane + enemy type
Alchemist brews ammo → Artillery loads and fires
Builder places + upgrades weapons → Artillery mans them
Artillery fires → weapon durability drops → Builder monitors + rebuilds if zero
Enemy attacks lane → lane HP drops → Builder reinforces
Builder repositions weapon → Artillery reassigns people
```

### How Each Role Affects The Others

**⚗️ Alchemist**

| Action             | Effect                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------- |
| Correct prediction | Artillery loads right ammo, team is ahead of attack, radar accuracy improves next round |
| Wrong prediction   | Wrong ammo brewed, Artillery has no effective ammo when attack hits                     |

**🏗️ Builder**

| Action                      | Effect                                             |
| --------------------------- | -------------------------------------------------- |
| Builds weapon in right lane | Artillery has firepower where it's needed          |
| Pre-reinforces correct lane | Lane survives attack, HP stays healthy             |
| Lets lane HP drop to zero   | Game over                                          |
| Runs out of resources       | Can't rebuild destroyed weapons or reinforce lanes |

**🎯 Artillery**

| Action                            | Effect                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| Fires efficiently with right ammo | Enemies defeated before hitting castle, lane HP preserved, radar accuracy improves               |
| Fires carelessly                  | Weapon durability drops fast, Builder forced into emergency rebuild                              |
| Weapon hits zero durability       | Builder must rebuild from scratch, lane exposed during rebuild                                   |
| Wrong ammo loaded                 | Reduced damage, more enemies reach castle, lane HP drops faster, radar accuracy does not improve |

---

## Wave Structure

Waves are defined by enemy count, not time. Higher waves spawn more enemies across more lanes with greater speed and HP. Between waves there is a short breather for the team to regroup.

| Wave | Enemies              | Active Lanes | Enemy Speed | Enemy HP |
| ---- | -------------------- | ------------ | ----------- | -------- |
| 1    | 5                    | 1 lane       | Slow        | 1x       |
| 2    | 8                    | 2 lanes      | Slow        | 1.5x     |
| 3    | 12                   | 2 lanes      | Medium      | 2x       |
| 4    | 16                   | 3 lanes      | Medium      | 2.5x     |
| 5    | 20                   | 3 lanes      | Fast        | 3x       |
| 6    | 25                   | 4 lanes      | Fast        | 3.5x     |
| 7    | 30                   | 4 lanes      | Very Fast   | 4x       |
| 8+   | Scaling mechanic TBD |              |             |          |

**Between waves, the following reset:**
- Builder resources (back to starting amount)
- Ammo inventory (cleared)
- Brew slots (cleared)
- Personnel assignments (all unassigned)
- Loaded ammo on all weapons (cleared)

Lane HP, built weapons, and radar accuracy **persist** between waves.

**Enemy reach behaviour:**
When an enemy reaches the castle wall it deals `baseDamagePerHit` to that lane every tick until it is killed. A single enemy can deal multiple hits if not eliminated quickly.

**Enemy composition per wave:**

- Early waves: mostly one enemy type — easy for Alchemist to call
- Mid waves: two enemy types simultaneously — Alchemist must manage multiple brew slots
- Late waves: all three types at once — maximum brew slot pressure

---

## Radar Accuracy Formula

```
Next round accuracy = min(100, current accuracy + 10 × correct_ammo_kills_this_wave)
```

- Starts at 0% — lane only in round 1, no enemy type shown
- Each enemy defeated with correct ammo adds 10% accuracy for the next wave
- Wrong ammo kills do not contribute
- Capped at 100%

---

## Difficulty Scaling

Beyond enemy count, difficulty increases through:

- **Enemy strength** — later enemies deal more lane damage per hit
- **Enemy speed** — less time for Builder to reinforce and less time for Alchemist to brew
- **Mixed compositions** — more brew slot juggling for Alchemist, more ammo switching for Artillery

---

## Lose Condition

Any lane's HP hitting zero = immediate game over. No recovery.

---

## Scoring Formula

```
Score = (Waves Survived × 100)
      + (Enemies Defeated × 10)
      + (Lanes Alive At End × 50)
      - (Weapons Destroyed × 20)
      - (Narrow Breaches × 5)
```

Rewards clean, coordinated play. A team that survives all waves with no destroyed weapons scores significantly higher than one that barely scrapes through.

---

## Leaderboard

- Persistent across sessions — all teams at the event compete on the same board
- Displays: Rank, Team Name, Score, Waves Survived
- Shown on the reveal screen after the role explanation
- Can be displayed on a big screen for the whole room

---

## Post-Game: The Reveal

After the game ends, a reveal screen flips the curtain:

> _"You just defended a castle. But actually..."_
>
> - ⚗️ Alchemist = **AI Engineer** — responsible for an AI system, feeding clean data into it, making it sharper each round. Irrelevant data points were noise — data the model couldn't learn from.
> - 🏗️ Builder = **Cloud Engineer** — building and scaling infrastructure under pressure, managing resources so everything else can function
> - 🎯 Artillery = **Software Engineer** — executing in real time, making fast decisions with available tools, shipping the solution under pressure

**Real-world parallels drawn from their game:**

- _"Remember how using the correct ammo type made your radar better? Every wrong one didn't improve it. That's not a metaphor for AI engineering. That is AI engineering."_
- _"Remember when a weapon hit zero durability and Builder had to rebuild from scratch while the lane was exposed? That's what happens when a server goes down and the whole engineering team has to scramble."_
- _"Remember when Artillery had to decide between firing and repairing under pressure? That's a software engineer choosing between shipping a new feature and fixing technical debt — the same tradeoff, every day."_

---

## Tech Stack

### Frontend — Next.js (App Router)

- Browser-based, landscape-only, mobile-friendly (each player on their own device)
- No in-app chat — communication is purely verbal in the room
- Game engine runs **client-side** — compute on player devices, server used only for state persistence and signalling

**Routes:**
| Route | Purpose |
|-------|---------|
| `/` | Landing page — enter team name, generate room code, pick role |
| `/lobby/[roomCode]` | Waiting room — shows which roles have been picked, start when all 3 ready |
| `/game/[roomCode]/builder` | Builder screen |
| `/game/[roomCode]/artillery` | Artillery screen |
| `/game/[roomCode]/alchemist` | Alchemist screen |
| `/reveal/[roomCode]` | Post-game role reveal + career explanation |
| `/leaderboard` | Persistent leaderboard — can be shown on a big screen |

### Backend — Supabase

- **Postgres** — leaderboard, team records, game sessions
- **Realtime channels** — syncing game state between the 3 players in a team via DB writes
- **No auth** — teams join via room code only, keep it frictionless

---

## Supabase Schema

See `docs/schema.sql` for full schema.

---

## Realtime Strategy

Each player action inserts a row into `game_events`. All three players subscribe to their room's channel and update their local UI reactively.

### Reconnection Flow

```
Player disconnects → rejoins via same room code →
loads latest game state from DB → resubscribes to Realtime channel → back in game
```

---

## Game Config

All tunable game values are defined in a single `gameConfig.ts` file. The game engine reads exclusively from this config — no magic numbers anywhere in the codebase. This allows difficulty tuning without touching game logic.

Config covers:

- Artillery personnel count and wrong ammo damage multiplier
- Builder resource regen rate, starting resources, action costs and timers
- Lane starting HP and weapon slots per lane
- Weapon durability, damage, fire rate and maintenance restore rate
- Alchemist brew slots, brew times per ammo type, and radar accuracy formula values
- Enemy base HP, damage, speed, and spawn stagger range (random min/max position units between consecutive enemies in the same lane)
- Per-wave configuration — enemy count, active lanes, speed multiplier, HP multiplier
- Between wave breather duration
- Scoring values and penalties

See `frontend/config/gameConfig.ts` for all values.

---

## Recommended Build Order

1. Supabase setup — create tables, enable Realtime on `game_events`, test pub/sub round trip
2. Room creation + lobby flow — landing page, room code generation, role selection, waiting room
3. Game engine — enemy spawning, wave progression, lane HP, weapon durability, scoring logic
4. Shared battlefield component — 4 lane layout, select + act model, landscape layout
5. Individual role screens — build each with mocked data first, then wire up real events
6. Alchemist radar — signal generation, brew slot mechanic, accuracy formula
7. Builder resource system — resource pool, build queue, lane reinforcement
8. Artillery assignment system — personnel tokens, fire/maintain toggle, ammo loading, durability management
9. Reveal + leaderboard — reads from DB, maps roles to careers with real-world parallels

---

## Support Pages + Components

- How to play? / Instructions
- Link to DIS recruitment page?
