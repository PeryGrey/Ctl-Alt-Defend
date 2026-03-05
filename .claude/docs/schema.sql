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
  -- 'game_over'
  payload jsonb,
  created_at timestamp default now()
);

-- Leaderboard view
create view leaderboard as
  select team_name, score, waves_survived, created_at
  from game_sessions
  where status = 'complete'
  order by score desc, waves_survived desc;

-- Indexes for performance
create index game_events_room_code_idx on game_events (room_code);
create index game_events_created_at_idx on game_events (created_at);
create index game_sessions_room_code_idx on game_sessions (room_code);
create index game_sessions_status_idx on game_sessions (status);