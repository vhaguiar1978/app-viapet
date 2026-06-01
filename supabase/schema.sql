create table if not exists profiles (
  id uuid primary key,
  email text unique not null,
  full_name text,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists sports (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  active boolean not null default true
);

create table if not exists leagues (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid references sports(id) on delete cascade,
  name text not null,
  country text,
  active boolean not null default true
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid references sports(id) on delete cascade,
  name text not null,
  short_name text
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete set null,
  sport_id uuid references sports(id) on delete cascade,
  name text not null,
  position text
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid references sports(id) on delete cascade,
  league_id uuid references leagues(id) on delete set null,
  home_team_id uuid references teams(id) on delete set null,
  away_team_id uuid references teams(id) on delete set null,
  external_source text,
  external_id text,
  start_time timestamptz not null,
  status text not null default 'scheduled',
  score_home integer,
  score_away integer,
  data_quality text not null default 'medium',
  created_at timestamptz not null default now()
);

create unique index if not exists matches_external_source_id_idx
  on matches(external_source, external_id)
  where external_source is not null and external_id is not null;

create table if not exists data_provider_syncs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  sync_type text not null,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_found integer not null default 0,
  records_saved integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'
);

create table if not exists bookmakers (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  authorized boolean not null default false,
  partner boolean not null default false,
  active boolean not null default true
);

create table if not exists markets (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid references sports(id) on delete cascade,
  name text not null,
  slug text not null,
  active boolean not null default true
);

create table if not exists odds (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  market_id uuid references markets(id) on delete cascade,
  bookmaker_id uuid references bookmakers(id) on delete cascade,
  selection text not null,
  odd numeric(8, 3) not null,
  captured_at timestamptz not null default now()
);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  market_id uuid references markets(id) on delete cascade,
  model_probability numeric(6, 5) not null,
  fair_odd numeric(8, 3) not null,
  edge numeric(8, 5) not null,
  confidence integer not null,
  risk text not null,
  value_label text not null,
  created_at timestamptz not null default now()
);

create table if not exists match_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  final_score_home integer,
  final_score_away integer,
  result_payload jsonb not null default '{}',
  settled_at timestamptz not null default now(),
  unique (match_id)
);

create table if not exists prediction_results (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid references predictions(id) on delete cascade,
  match_result_id uuid references match_results(id) on delete cascade,
  actual_outcome text not null,
  status text not null check (status in ('win', 'loss', 'push', 'void')),
  simulated_stake numeric(10, 2) not null default 1,
  simulated_profit numeric(10, 2) not null default 0,
  error_reason text,
  lesson text,
  settled_at timestamptz not null default now()
);

create table if not exists model_learning_events (
  id uuid primary key default gen_random_uuid(),
  prediction_result_id uuid references prediction_results(id) on delete cascade,
  sport_id uuid references sports(id) on delete set null,
  market_id uuid references markets(id) on delete set null,
  signal text not null,
  adjustment text not null,
  weight_delta numeric(8, 5) not null default 0,
  confidence_delta numeric(8, 5) not null default 0,
  applied boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists ai_analyses (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  prediction_id uuid references predictions(id) on delete set null,
  summary text not null,
  full_text text not null,
  responsible_notice text not null,
  created_at timestamptz not null default now()
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  criteria jsonb not null default '{}',
  channels jsonb not null default '["dashboard"]',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists user_favorites (
  user_id uuid references profiles(id) on delete cascade,
  match_id uuid references matches(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

create table if not exists user_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  match_id uuid references matches(id) on delete cascade,
  market_id uuid references markets(id) on delete cascade,
  selection text not null,
  odd numeric(8, 3),
  simulated_stake numeric(10, 2) not null default 1,
  result text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists rankings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  period text not null,
  sport_id uuid references sports(id) on delete set null,
  hit_rate numeric(6, 3) not null default 0,
  simulated_roi numeric(8, 4) not null default 0,
  position integer not null
);

create table if not exists affiliates (
  id uuid primary key default gen_random_uuid(),
  bookmaker_id uuid references bookmakers(id) on delete cascade,
  name text not null,
  url text not null,
  active boolean not null default true
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
