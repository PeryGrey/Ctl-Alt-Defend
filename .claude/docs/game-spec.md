# 🏰 Ctrl + Alt + Defend — Game Design Spec

## Overview
A multiplayer mobile browser-based castle defence game for a career talk event, designed for groups of teenagers and young adults (15–30). Players defend a castle as a team of 3, each on their own device, without knowing their tech career counterparts upfront. After the game, a reveal screen maps each role to a real tech career.

**Core design principle:** One tight loop per role. Each loop produces output that becomes another role's input. The game is impossible to play without verbal communication.

**Lose condition:** Any wall's HP hits zero — the castle is breached and the game ends immediately. No recovery.

**Communication method:** Verbal, in the room. No in-app chat.

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

## Solution

### The Castle
A square castle with 4 walls — north, south, east, west. Each wall has:
- Its own HP bar — depletes when enemies attack that side
- Weapon slots — where Builder places weapons
- Breach state — if HP hits zero, wall is breached, game over

Enemies can attack from any direction. Teams must defend all 4 sides simultaneously.

---

## The Three Roles

### 🏗️ Builder *(reveal: Cloud Engineer)*
Manages the castle's infrastructure. Places, upgrades and repositions weapons around the walls. Monitors wall durability and reinforces under attack. Manages a slow-regenerating resource pool across all actions. There is no headcount concept for Builder — all actions are governed purely by the resource pool.

### 🎯 Artillery *(reveal: Software Engineer)*
Operates the weapons. Assigns X artillery people across multiple weapons, manages ammo types, and balances firing vs weapon durability. Each person can either **fire** or **maintain** a weapon — not both simultaneously. If a weapon hits zero durability it is destroyed and must be rebuilt from scratch by Builder.

### ⚗️ Alchemist *(reveal: AI Engineer)*
Monitors a radar showing incoming enemy signals. Brews ammo for 3 enemy types across 3 concurrent production slots. Calls out attack directions and enemy compositions to the team. The radar starts blind — direction only — and gets smarter as the team generates clean data by defeating enemies with correct ammo.

---

## The Three Enemy Types

| Enemy | Ammo Brewed |
|-------|------------|
| 🌊 Sea | Cannonballs |
| 🏃 Land | Arrows |
| 🦅 Air | Bolts |

Wrong ammo type = weapon does significantly reduced damage. Getting the right ammo to the right weapon at the right time is the core Alchemist/Artillery coordination challenge.

---

## Global Game Clock
Everything runs on a per-second tick driven by a single global game clock:
- Builder resource pool increments every second
- Alchemist brew slot timers decrement every second
- Builder action timers (build, upgrade, reposition, reinforce) decrement every second
- Enemy movement advances every second
- Wave progression driven by the same clock

---

## Game Loop — Interaction Web

```
Alchemist reads radar → calls direction + enemy type
Alchemist brews ammo → Artillery loads and fires
Builder places + upgrades weapons → Artillery mans them
Artillery fires → weapon durability drops → Builder monitors + rebuilds if zero
Enemy attacks wall → wall HP drops → Builder reinforces
Builder repositions weapon → Artillery reassigns people
```

### How Each Role Affects The Others

**⚗️ Alchemist**

| Action | Effect |
|--------|--------|
| Correct prediction | Builder pre-reinforces right wall, Artillery loads right ammo, team is ahead of attack |
| Wrong prediction | Wrong ammo brewed, wrong wall reinforced, team scrambling when attack hits |
| Spots deviation early | Team adapts before damage is done |
| Misses deviation | Wrong ammo loaded, wrong wall reinforced, wall HP drops fast |

**🏗️ Builder**

| Action | Effect |
|--------|--------|
| Pre-reinforces correct wall | Wall survives attack, HP stays healthy |
| Builds weapon on right wall | Artillery has firepower where it's needed |
| Lets wall HP drop to zero | Game over |
| Runs out of resources | Can't rebuild destroyed weapons or reinforce walls |

**🎯 Artillery**

| Action | Effect |
|--------|--------|
| Fires efficiently with right ammo | Enemies defeated before hitting wall, wall HP preserved, radar prediction % improves |
| Fires carelessly | Weapon durability drops fast, Builder forced into emergency rebuild |
| Weapon hits zero durability | Builder must rebuild from scratch, wall exposed during rebuild |
| Wrong ammo loaded | Reduced damage, more enemies reach the wall, wall HP drops faster, radar prediction % does not improve |

---

## Individual Screens

### 🏗️ Builder Screen
**Vibe:** Construction management — methodical, strategic, satisfying.

- Castle map showing all 4 walls with HP bars and weapon slots
- Resource pool meter — slow regeneration, every action costs resources
- Action buttons per wall slot: Build / Upgrade / Reposition
- Wall HP bars — monitor all 4 simultaneously, reinforce weakening walls
- Build queue — shows time remaining on current builds
- Incoming resource rate indicator

**Actions & Costs:**

| Action | Resource Cost | Time |
|--------|--------------|------|
| Build new weapon | High | Long |
| Upgrade existing weapon | Medium | Medium |
| Reposition weapon | Low | Medium |
| Reinforce wall | Low | Short |
| Emergency rebuild | High | Long |

**Key tension:** Spending resources on reinforcement vs weapon development. Hoarding is punished — resources spent late are resources wasted.

### 🎯 Artillery Screen
**Vibe:** Tactical operations — frantic, high stakes, constantly prioritising.

- Weapon dashboard showing all built weapons around the castle
- Each weapon shows: ammo loaded, durability bar, assigned personnel
- X artillery people represented as assignable tokens — each can fire OR maintain, not both
- Ammo inventory — shows current stock of each ammo type from Alchemist
- Fire controls per manned weapon
- Durability warnings when weapons drop below threshold

**Key tension:** Who mans what vs who maintains what. Pulling someone off a weapon to repair means less firepower. Ignoring durability risks losing the weapon entirely.

### ⚗️ Alchemist Screen
**Vibe:** Intelligence analyst — tense, uncertain, high consequence decisions.

- Radar panel showing incoming enemy signals
- Round 1: direction only — no enemy type shown
- Subsequent rounds: enemy type revealed for a % of enemies based on radar accuracy
- 3 concurrent brew slots — each brewing one ammo type, timers decrement per second
- Ammo dispatch panel — send brewed ammo to Artillery

**Key tension:** Committing brew slots to a prediction before being certain. Cancelling a mid-brew wastes time and resources. Getting it wrong means Artillery has no effective ammo when the attack hits.

---

## Information Asymmetry
Nobody has the full picture — forcing constant communication as the default state.

| Role | Sees | Doesn't See |
|------|------|-------------|
| ⚗️ Alchemist | Radar signals, brew slots | Wall HP, weapon durability, Artillery assignments |
| 🏗️ Builder | Wall HP, weapon slots, resource pool | Radar signals, ammo stock, Artillery assignments |
| 🎯 Artillery | Weapon status, ammo inventory, personnel | Radar signals, wall HP, Builder's resource pool |

---

## Wave Structure
Waves are defined by enemy count, not time. Higher waves spawn more enemies with greater speed, strength and directional complexity. Between waves there is a short breather for the team to regroup.

| Wave | Enemies | Attack Directions | Enemy Speed | Enemy HP |
|------|---------|-------------------|-------------|----------|
| 1 | 5 | 1 wall | Slow | 1x |
| 2 | 8 | 2 walls | Slow | 1.5x |
| 3 | 12 | 2 walls | Medium | 2x |
| 4 | 16 | 3 walls | Medium | 2.5x |
| 5 | 20 | 3 walls | Fast | 3x |
| 6 | 25 | 4 walls | Fast | 3.5x |
| 7 | 30 | 4 walls | Very Fast | 4x |
| 8+ | Scaling mechanic TBD | | | |

**Enemy composition per wave:**
- Early waves: mostly one enemy type — easy for Alchemist to call
- Mid waves: two enemy types simultaneously — Alchemist must manage multiple brew slots
- Late waves: all three types at once — maximum brew slot pressure

---

## Radar Accuracy Formula

```
Next round accuracy = current round accuracy + (Enemies defeated with correct ammo / Total Enemies) × 10
```

- Starts at 0% — direction only in round 1
- Improves each round based on correct ammo kills only
- Wrong ammo kills do not contribute to accuracy improvement
- No cap — accuracy improves as long as team performs well

---

## Difficulty Scaling
Beyond enemy count, difficulty increases through:
- **Enemy strength** — later enemies deal more wall damage per hit
- **Enemy speed** — less time for Builder to pre-reinforce and less time for Alchemist to brew appropriate ammo type
- **Mixed compositions** — more brew slot juggling for Alchemist, more ammo switching for Artillery

---

## Lose Condition
Any wall's HP hits zero = immediate game over. No recovery. The castle is breached.

This makes every Builder reinforcement decision high stakes and gives Artillery a direct reason to care about which direction they're defending.

---

## Scoring Formula

```
Score = (Waves Survived × 100)
      + (Enemies Defeated × 10)
      + (Walls Alive At End × 50)
      - (Weapons Destroyed × 20)
      - (Narrow Breaches × 5)
```

Rewards clean, coordinated play. A team that survives all waves with no destroyed weapons and high ammo efficiency scores significantly higher than one that barely scrapes through.

---

## Leaderboard
- Persistent across sessions — all teams at the event compete on the same board
- Displays: Rank, Team Name, Score, Waves Survived
- Shown on the reveal screen after the role explanation
- Can be displayed on a big screen for the whole room

---

## Post-Game: The Reveal

After the game ends, a reveal screen flips the curtain:

> *"You just defended a castle. But actually..."*
> - ⚗️ Alchemist = **AI Engineer** — responsible for an AI system, feeding clean data into it, making it sharper each round. Irrelevant data points were noise — data the model couldn't learn from.
> - 🏗️ Builder = **Cloud Engineer** — building and scaling infrastructure under pressure, managing resources so everything else can function
> - 🎯 Artillery = **Software Engineer** — executing in real time, making fast decisions with available tools, shipping the solution under pressure

**Real-world parallels drawn from their game:**
- *"Remember how using the correct ammo type for the enemy made your radar better? Every wrong one didn't improve it. That's not a metaphor for AI engineering. That is AI engineering."*
- *"Remember when a weapon hit zero durability and Builder had to rebuild from scratch while the wall was exposed? That's what happens when a server goes down and the whole engineering team has to scramble."*
- *"Remember when Artillery had to decide between firing and repairing under pressure? That's a software engineer choosing between shipping a new feature and fixing technical debt — the same tradeoff, every day."*

---

## Tech Stack

### Frontend — Next.js (App Router)
- Browser-based, mobile-friendly (each player on their own device)
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

```sql
-- Teams / sessions
create table game_sessions (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  team_name text not null,
  status text default 'waiting', -- waiting | playing | complete
  current_wave int default 1,
  score int default 0,
  waves_survived int default 0,
  created_at timestamp default now()
);

-- Real-time game events (event bus between players)
create table game_events (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  type text not null,
  -- 'brew_start' | 'brew_complete' | 'ammo_dispatch'
  -- 'build_start' | 'build_complete' | 'upgrade' | 'reposition' | 'reinforce'
  -- 'weapon_fire' | 'weapon_assign' | 'weapon_repair'
  -- 'enemy_spawn' | 'enemy_defeated' | 'wall_damage' | 'wave_start' | 'wave_end'
  -- 'deviation' | 'game_over'
  payload jsonb,
  created_at timestamp default now()
);

-- Leaderboard view
create view leaderboard as
  select team_name, score, waves_survived, created_at
  from game_sessions
  where status = 'complete'
  order by score desc, waves_survived desc;
```

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
- Wall starting HP and weapon slots per wall
- Weapon durability, damage, fire rate and maintenance restore rate
- Alchemist brew slots, brew times per ammo type, and radar accuracy formula values
- Enemy base HP, damage and speed
- Per-wave configuration — enemy count, attack walls, speed multiplier, HP multiplier
- Between wave breather duration
- Scoring values and penalties

See `gameConfig.ts` for all values.

---

## Recommended Build Order
1. Supabase setup — create tables, enable Realtime on `game_events`, test pub/sub round trip
2. Room creation + lobby flow — landing page, room code generation, role selection, waiting room
3. Game engine — enemy spawning, wave progression, wall HP, weapon durability, scoring logic
4. Individual screens — build each with mocked data first, then wire up real events
5. Alchemist radar — signal generation, brew slot mechanic, deviation system, accuracy formula
6. Builder resource system — resource pool, build queue, wall reinforcement
7. Artillery assignment system — personnel tokens, fire/maintain toggle, ammo loading, durability management
8. Reveal + leaderboard — reads from DB, maps roles to careers with real-world parallels

---

## Support Pages + Components
- How to play? / Instructions
- Link to DIS recruitment page?