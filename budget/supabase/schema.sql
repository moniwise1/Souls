-- Budget Partner: cloud accounts
-- Run this once in your Supabase project (SQL Editor → New query → paste → Run).
-- Use a separate Supabase project from the Souls store: the store's project only
-- allows invited staff to sign up.
--
-- One private row per user holds their whole budget. Row-level security means
-- each signed-in user can read and write only their own row.

create table if not exists public.budget_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.budget_data enable row level security;

drop policy if exists "read own budget"   on public.budget_data;
drop policy if exists "insert own budget" on public.budget_data;
drop policy if exists "update own budget" on public.budget_data;
drop policy if exists "delete own budget" on public.budget_data;

create policy "read own budget"   on public.budget_data for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own budget" on public.budget_data for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own budget" on public.budget_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own budget" on public.budget_data for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.budget_data from anon;
grant select, insert, update, delete on public.budget_data to authenticated;
