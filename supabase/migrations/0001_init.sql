-- Discover Architects — initial Supabase schema
-- Run this once against a fresh Supabase project (SQL Editor, or `supabase db push`).
--
-- Design notes:
--  * The Express backend (backend/server.ts, backend/dbService.ts) is the only
--    thing that talks to this database, using the Supabase SERVICE ROLE key.
--    The service role bypasses Row Level Security, so RLS below is enabled
--    with NO policies attached — this denies all access to the anon/authenticated
--    keys by default and is intentional defense-in-depth in case those keys
--    are ever exposed to a browser.
--  * IDs are bigserial (plain integers) to match the existing app/API shapes
--    instead of switching everything to UUIDs in one pass.
--  * This is a fresh-start schema — it does not import data from the old
--    backend/data/users.db SQLite file.

create extension if not exists pgcrypto;

-- Generic "touch updated_at" trigger, reused by several tables.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Auth: users / profiles / sessions
-- ---------------------------------------------------------------------------

create table users (
  id            bigserial primary key,
  email         text unique not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table profiles (
  id         bigint primary key references users(id) on delete cascade,
  username   text unique not null,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create table sessions (
  id         bigserial primary key,
  user_id    bigint not null references users(id) on delete cascade,
  token      text unique not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index idx_profiles_username on profiles(username);
create index idx_sessions_token on sessions(token);
create index idx_sessions_user_id on sessions(user_id);

-- ---------------------------------------------------------------------------
-- Gallery
-- ---------------------------------------------------------------------------

create table gallery (
  id           bigserial primary key,
  storage_path text not null, -- path inside the Supabase Storage "gallery" bucket
  title        text not null,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Plans / subscriptions
-- ---------------------------------------------------------------------------

create table plans (
  id              bigserial primary key,
  name            text unique not null check (name in ('Standard', 'Pro')),
  duration_months integer not null default 12
);

insert into plans (name, duration_months) values ('Standard', 12), ('Pro', 12);

create table subscriptions (
  id         bigserial primary key,
  user_id    bigint not null references users(id) on delete cascade,
  plan_id    bigint not null references plans(id) on delete cascade,
  start_date timestamptz not null default now(),
  unique (user_id, plan_id, start_date)
);

create table subscription_periods (
  id              bigserial primary key,
  subscription_id bigint not null references subscriptions(id) on delete cascade,
  start_date      timestamptz not null,
  end_date        timestamptz,
  status          text not null check (status in ('active', 'paused'))
);

create index idx_subscriptions_user_id on subscriptions(user_id);
create index idx_subscription_periods_subscription_id on subscription_periods(subscription_id);

-- ---------------------------------------------------------------------------
-- Job postings & applications (new)
-- ---------------------------------------------------------------------------

create table job_postings (
  id              bigserial primary key,
  title           text not null,
  description     text not null,
  location        text,
  employment_type text not null default 'full-time'
                    check (employment_type in ('full-time', 'part-time', 'contract', 'internship')),
  status          text not null default 'open' check (status in ('open', 'closed')),
  created_by      bigint references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger job_postings_set_updated_at
  before update on job_postings
  for each row execute function set_updated_at();

create index idx_job_postings_status on job_postings(status);

create table job_applications (
  id              bigserial primary key,
  -- Nullable: a null job_posting_id is a general / speculative application
  -- (a candidate uploading a resume when no specific role is open).
  job_posting_id  bigint references job_postings(id) on delete cascade,
  full_name       text not null,
  email           text not null,
  phone           text,
  cover_letter    text,
  resume_path          text not null, -- path inside the Supabase Storage "resumes" bucket
  resume_original_name text not null, -- original uploaded filename, used when zipping resumes
  status          text not null default 'new'
                    check (status in ('new', 'reviewed', 'rejected', 'hired')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger job_applications_set_updated_at
  before update on job_applications
  for each row execute function set_updated_at();

create index idx_job_applications_job_posting_id on job_applications(job_posting_id);
create index idx_job_applications_status on job_applications(status);

-- ---------------------------------------------------------------------------
-- Row Level Security — enabled everywhere, no policies (service role only).
-- ---------------------------------------------------------------------------

alter table users enable row level security;
alter table profiles enable row level security;
alter table sessions enable row level security;
alter table gallery enable row level security;
alter table plans enable row level security;
alter table subscriptions enable row level security;
alter table subscription_periods enable row level security;
alter table job_postings enable row level security;
alter table job_applications enable row level security;
