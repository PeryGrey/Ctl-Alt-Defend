-- Teams / sessions
create table game_sessions (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  team_name text not null,
  status text default 'waiting', -- waiting | playing | complete
  current_wave int default 1,
  score int default 0,
  waves_survived int default 0,
  game_state jsonb default null, -- periodic snapshot for reconnection
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Real-time game events (event bus between players)
create table game_events (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  type text not null,
  -- 'brew_start' | 'brew_complete' | 'ammo_dispatch'
  -- 'build_start' | 'build_complete' | 'upgrade' | 'reposition' | 'reinforce'
  -- 'weapon_fire' | 'weapon_assign' | 'weapon_repair'
  -- 'enemy_spawn' | 'enemy_defeated' | 'lane_damage' | 'wave_start' | 'wave_end'
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

-- Auto-update updated_at on game_sessions
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger game_sessions_updated_at
  before update on game_sessions
  for each row execute function update_updated_at();

-- Indexes for performance
create index game_events_room_code_idx on game_events (room_code);
create index game_events_created_at_idx on game_events (created_at);
create index game_sessions_room_code_idx on game_sessions (room_code);
create index game_sessions_status_idx on game_sessions (status);