-- Proposed development storage contract, 2026-11-14.
-- Review docs/storage-contract.md before applying in the Supabase SQL editor.
-- NOT applied by the coding agent. Does not alter questions or auth accounts.
-- Run once, in an approved development project. Existing names cause a safe failure;
-- do not drop existing tables to make this pass. All changes are transactional.
begin;

create table public.cfbd_rice_schedule (
  season integer not null check (season >= 1869),
  rice_team_id integer not null default 242 check (rice_team_id = 242),
  game_id text not null check (btrim(game_id) <> ''),
  week integer not null check (week >= 0),
  opponent text not null check (btrim(opponent) <> ''),
  home_away text not null check (home_away in ('home', 'away')),
  game_date timestamptz not null,
  start_time_tbd boolean not null,
  conference_game boolean not null,
  status text not null check (status in ('scheduled', 'completed')),
  rice_score integer check (rice_score >= 0),
  opponent_score integer check (opponent_score >= 0),
  fetched_at timestamptz not null,
  primary key (season, rice_team_id, game_id)
);

create table public.cfbd_conference_standings (
  season integer not null check (season >= 1869),
  conference text not null check (btrim(conference) <> ''),
  team text not null check (btrim(team) <> ''),
  conference_wins integer not null check (conference_wins >= 0),
  conference_losses integer not null check (conference_losses >= 0),
  overall_wins integer not null check (overall_wins >= 0),
  overall_losses integer not null check (overall_losses >= 0),
  fetched_at timestamptz not null,
  primary key (season, conference, team)
);

create table public.pff_franchises (
  id bigint primary key,
  name text not null check (btrim(name) <> ''),
  league_id bigint not null,
  league text not null,
  sportradar_id text,
  fetched_at timestamptz not null
);

create table public.hudl_games (
  competition_id bigint not null,
  season_id bigint not null,
  game_id bigint not null,
  name text not null check (btrim(name) <> ''),
  -- Original vendor date string: date-only/timezone semantics not yet confirmed.
  vendor_date text not null check (btrim(vendor_date) <> ''),
  home_team_id bigint not null,
  home_team_name text not null,
  away_team_id bigint not null,
  away_team_name text not null,
  fetched_at timestamptz not null,
  primary key (competition_id, season_id, game_id)
);

create table public.hudl_game_roster (
  competition_id bigint not null,
  season_id bigint not null,
  game_id bigint not null,
  -- Query scope, distinct from the nullable player.team returned by the vendor.
  requested_team_id bigint not null,
  player_id bigint not null,
  name text not null check (btrim(name) <> ''),
  reported_team_id bigint,
  reported_team_name text,
  most_common_number integer,
  general_position text,
  fetched_at timestamptz not null,
  primary key (competition_id, season_id, game_id, requested_team_id, player_id),
  foreign key (competition_id, season_id, game_id)
    references public.hudl_games (competition_id, season_id, game_id),
  check ((reported_team_id is null) = (reported_team_name is null))
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 4000),
  category text not null check (category in ('offense', 'defense', 'special-teams', 'player-personnel')),
  kind text not null check (kind in ('static', 'runnable')),
  file_type text not null,
  tags text[] not null default '{}'::text[] check (cardinality(tags) <= 8),
  -- Only approved existing sample paths, supplied by server code. Not uploaded files.
  file_url text check (file_url is null or file_url ~ '^/reports/[A-Za-z0-9_-]+\.(pdf|csv|html)$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (kind = 'static' and file_type in ('.pdf', '.csv', '.html')) or
    (kind = 'runnable' and file_type in ('.r', '.py'))
  ),
  check (file_url is null or (kind = 'static' and right(file_url, char_length(file_type)) = file_type))
);

-- No direct browser access. Server code using the privileged key must enforce
-- caller permissions independently; RLS does not authorize such server requests.
alter table public.cfbd_rice_schedule enable row level security;
alter table public.cfbd_conference_standings enable row level security;
alter table public.pff_franchises enable row level security;
alter table public.hudl_games enable row level security;
alter table public.hudl_game_roster enable row level security;
alter table public.reports enable row level security;

revoke all on table public.cfbd_rice_schedule, public.cfbd_conference_standings,
  public.pff_franchises, public.hudl_games, public.hudl_game_roster, public.reports
  from public, anon, authenticated;
grant select, insert, update on table public.cfbd_rice_schedule,
  public.cfbd_conference_standings, public.pff_franchises, public.hudl_games,
  public.hudl_game_roster, public.reports to service_role;

commit;
