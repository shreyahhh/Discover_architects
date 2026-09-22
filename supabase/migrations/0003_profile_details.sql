-- Adds full name and location (city/state) to profiles, collected at
-- signup and shown to admins in the Users & Subscriptions table.
-- Run this against the same Supabase project 0001/0002 were already run
-- against — it only adds columns, so it's safe on a database with existing
-- rows (they'll just have NULL for these until a user updates their
-- profile or signs up fresh).

alter table profiles add column if not exists full_name text;
alter table profiles add column if not exists city text;
alter table profiles add column if not exists state text;
