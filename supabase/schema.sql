-- Bud: Personal Budget App — Database Schema
-- Run this whole file once in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / CREATE OR REPLACE).

create extension if not exists "pgcrypto";

-- ============================================================================
-- TABLES
-- ============================================================================

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  starting_balance numeric(12,2) not null default 0,
  balance_as_of date,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  account_type text not null default 'checking'
    check (account_type in ('checking', 'savings', 'credit', 'investment', 'cash'))
);

alter table public.accounts add column if not exists account_type text not null default 'checking'
  check (account_type in ('checking', 'savings', 'credit', 'investment', 'cash'));

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_debt boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  owed_to text,
  original_amount numeric(12,2) not null default 0,
  interest_rate numeric(6,4) not null default 0,
  start_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  type text not null check (type in ('fixed', 'variable', 'debt')),
  planned_amount numeric(12,2) not null default 0,
  debt_id uuid references public.debts(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  -- Day of month this Fixed bill is due (1-31), used by the weekly/calendar
  -- cash-flow view. Null means "no set due date" — it just won't show up
  -- on the calendar.
  due_day int check (due_day between 1 and 31),
  -- Marks this as the "cushion" subcategory: each month, whatever was left
  -- unspent last month across every other non-debt subcategory gets added
  -- to THIS subcategory's planned amount (never to the original category).
  is_buffer boolean not null default false
);

alter table public.subcategories add column if not exists due_day int check (due_day between 1 and 31);
alter table public.subcategories add column if not exists is_buffer boolean not null default false;

-- Backfill: flag the starter template's cushion subcategory for existing
-- accounts that were seeded before is_buffer existed.
update public.subcategories set is_buffer = true
  where name = 'Buffer/extra cushion' and is_buffer = false;

create table if not exists public.monthly_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subcategory_id uuid not null references public.subcategories(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  planned_amount numeric(12,2) not null default 0,
  unique (subcategory_id, year, month)
);

create table if not exists public.fixed_actuals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subcategory_id uuid not null references public.subcategories(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  actual_amount numeric(12,2) not null default 0,
  account_id uuid references public.accounts(id) on delete set null,
  unique (subcategory_id, year, month)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  amount numeric(12,2) not null,
  subcategory_id uuid not null references public.subcategories(id) on delete restrict,
  account_id uuid references public.accounts(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  amount numeric(12,2) not null,
  source text,
  account_id uuid references public.accounts(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  -- When true, this entry represents a recurring paycheck/deposit — used
  -- to project future expected income onto the weekly cash-flow view.
  -- The most recent recurring row for a given `source` is treated as the
  -- current pattern (amount + interval) going forward.
  is_recurring boolean not null default false,
  recurrence_interval text check (recurrence_interval in ('weekly', 'biweekly', 'monthly'))
);

alter table public.income add column if not exists is_recurring boolean not null default false;
alter table public.income add column if not exists recurrence_interval text check (recurrence_interval in ('weekly', 'biweekly', 'monthly'));

create table if not exists public.income_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  planned_amount numeric(12,2) not null default 0,
  unique (user_id, year, month)
);

create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid not null references public.debts(id) on delete cascade,
  date date not null,
  amount numeric(12,2) not null,
  account_id uuid references public.accounts(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_income_planned numeric(12,2) not null default 0,
  display_name text
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null,
  target_date date,
  saved_so_far numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  -- Set once the "goal reached" push notification has fired for this goal,
  -- so it doesn't re-fire every day. Reset to false if saved_so_far drops
  -- back under the target, so a later re-reach notifies again.
  notified_reached boolean not null default false
);

alter table public.goals add column if not exists notified_reached boolean not null default false;

-- One row per browser/device that's enabled push notifications. A user
-- can have several (phone + laptop). Sent to by the daily bill-reminder
-- cron job using the Web Push standard (no third-party notification
-- service — just VAPID keys and each browser's own push endpoint).
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Per-profile toggles for which push notifications to receive. One row
-- per user; missing row means "use the defaults below" (the app treats
-- a missing row the same as one with these column defaults).
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  bill_reminders boolean not null default true,
  next_income boolean not null default true,
  daily_balance boolean not null default false,
  category_limit boolean not null default true,
  low_balance boolean not null default true,
  goal_reached boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Tracks which (subcategory, month) "category near its limit" alerts have
-- already been sent, so the cron doesn't re-notify every single day once
-- a category crosses 80%.
create table if not exists public.category_limit_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subcategory_id uuid not null references public.subcategories(id) on delete cascade,
  year int not null,
  month int not null,
  created_at timestamptz not null default now(),
  unique (subcategory_id, year, month)
);

-- One row per login profile shown on the login screen ("Vale", "Jose",
-- anyone else who self-adds one later). id is the same as the matching
-- auth.users id — the PIN is that account's password. email is an
-- internal, never-emailed address (a random id @bud.internal) generated
-- when the profile is created; it's only ever used to sign in.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index if not exists idx_subcategories_category on public.subcategories(category_id);
create index if not exists idx_expenses_user_date on public.expenses(user_id, date);
create index if not exists idx_expenses_subcategory on public.expenses(subcategory_id);
create index if not exists idx_income_user_date on public.income(user_id, date);
create index if not exists idx_debt_payments_debt on public.debt_payments(debt_id);
create index if not exists idx_debt_payments_user_date on public.debt_payments(user_id, date);

-- ============================================================================
-- ROW LEVEL SECURITY — every row is only visible/editable by its own owner
-- ============================================================================

alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.debts enable row level security;
alter table public.monthly_overrides enable row level security;
alter table public.fixed_actuals enable row level security;
alter table public.expenses enable row level security;
alter table public.income enable row level security;
alter table public.income_plan enable row level security;
alter table public.debt_payments enable row level security;
alter table public.user_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.category_limit_alerts enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'accounts','categories','subcategories','debts','monthly_overrides',
    'fixed_actuals','expenses','income','income_plan','debt_payments','goals',
    'push_subscriptions','notification_preferences','category_limit_alerts'
  ])
  loop
    execute format('drop policy if exists "owner_all" on public.%I;', t);
    execute format(
      'create policy "owner_all" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;

drop policy if exists "owner_all" on public.user_settings;
create policy "owner_all" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Profiles are readable by anyone (even signed-out visitors need to see
-- the list of names on the login screen). A profile can only ever be
-- created by the account it belongs to (right after that account signs
-- up). It can rename itself from Settings (only the `name` column is
-- grantable — id/email stay locked so the login identity can't change),
-- but never deleted through the API.
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all" on public.profiles for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

grant select on public.profiles to anon, authenticated;
grant insert on public.profiles to authenticated;
grant update (name) on public.profiles to authenticated;

-- ============================================================================
-- STARTER TEMPLATE — mirrors the structure of the original My_Budget.xlsx
-- Callable by any signed-in user (e.g. from the app's onboarding screen).
-- Safe to call only once per user: it no-ops if that user already has categories.
-- ============================================================================

create or replace function public.seed_starter_budget()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cat_home uuid;
  cat_transport uuid;
  cat_daily uuid;
  cat_personal uuid;
  cat_savings uuid;
  cat_travel uuid;
  cat_buffer uuid;
  cat_debt uuid;
  debt_hermana uuid;
  acc_checking uuid;
begin
  if uid is null then
    raise exception 'seed_starter_budget must be called by an authenticated user';
  end if;

  if exists (select 1 from public.categories where user_id = uid) then
    return; -- already seeded, do nothing
  end if;

  -- Accounts
  insert into public.accounts (user_id, name, sort_order) values
    (uid, 'Chase Checking', 1) returning id into acc_checking;
  insert into public.accounts (user_id, name, sort_order) values
    (uid, 'Chase Savings', 2),
    (uid, 'Chase Credit', 3),
    (uid, 'Vanguard', 4),
    (uid, 'Venmo', 5);

  -- Categories
  insert into public.categories (user_id, name, sort_order) values (uid, 'Home', 1) returning id into cat_home;
  insert into public.categories (user_id, name, sort_order) values (uid, 'Transportation', 2) returning id into cat_transport;
  insert into public.categories (user_id, name, sort_order) values (uid, 'Daily Living', 3) returning id into cat_daily;
  insert into public.categories (user_id, name, sort_order) values (uid, 'Personal', 4) returning id into cat_personal;
  insert into public.categories (user_id, name, sort_order) values (uid, 'Savings/Investing', 5) returning id into cat_savings;
  insert into public.categories (user_id, name, sort_order) values (uid, 'Travel', 6) returning id into cat_travel;
  insert into public.categories (user_id, name, sort_order, is_debt) values (uid, 'Debt', 7, true) returning id into cat_debt;
  insert into public.categories (user_id, name, sort_order) values (uid, 'Buffer', 8) returning id into cat_buffer;

  -- Debts
  -- A car loan is intentionally NOT seeded here: it needs a real balance and
  -- APR that only the signed-in user knows. Add it from the Debts screen
  -- ("+ New debt") with the real numbers — the app then computes the current
  -- balance, and an estimated payoff date from the monthly payment.
  insert into public.debts (user_id, name, owed_to, original_amount, interest_rate, start_date)
    values (uid, 'Hermana', 'Sara', 1700, 0, '2026-07-01') returning id into debt_hermana;

  -- Subcategories: Home
  insert into public.subcategories (user_id, category_id, name, type, planned_amount, sort_order) values
    (uid, cat_home, 'Rent + utilities', 'fixed', 1130, 1);

  -- Subcategories: Transportation
  -- Note: the car loan itself is NOT here — it's a Debt (balance + interest +
  -- payoff projection), added separately below as a linked debt/subcategory.
  insert into public.subcategories (user_id, category_id, name, type, planned_amount, sort_order) values
    (uid, cat_transport, 'Car insurance', 'fixed', 137.94, 2),
    (uid, cat_transport, 'Gas', 'variable', 135, 3),
    (uid, cat_transport, 'Maintenance', 'variable', 50, 4);

  -- Subcategories: Daily Living
  insert into public.subcategories (user_id, category_id, name, type, planned_amount, sort_order) values
    (uid, cat_daily, 'Groceries', 'variable', 450, 1),
    (uid, cat_daily, 'Eating out', 'variable', 310, 2),
    (uid, cat_daily, 'Shopping', 'variable', 110, 3);

  -- Subcategories: Personal
  insert into public.subcategories (user_id, category_id, name, type, planned_amount, sort_order) values
    (uid, cat_personal, 'Phone bill', 'fixed', 40, 1),
    (uid, cat_personal, 'Gifts', 'variable', 30, 2),
    (uid, cat_personal, 'Subscription: Claude', 'fixed', 20, 3),
    (uid, cat_personal, 'Subscription: Spotify', 'fixed', 1.25, 4),
    (uid, cat_personal, 'Subscription: other', 'fixed', 0, 5);

  -- Subcategories: Savings/Investing
  insert into public.subcategories (user_id, category_id, name, type, planned_amount, sort_order) values
    (uid, cat_savings, 'Vanguard', 'fixed', 400, 1),
    (uid, cat_savings, 'Emergency savings', 'fixed', 500, 2);

  -- Subcategories: Travel
  -- Lowered from 500 to 250 so the budget closes in a 4-paycheck month
  -- (see the balance math worked out with the user) while still leaving
  -- room in 5-paycheck months.
  insert into public.subcategories (user_id, category_id, name, type, planned_amount, sort_order) values
    (uid, cat_travel, 'Travel fund', 'fixed', 250, 1);

  -- Subcategories: Debt (linked to the debt above)
  insert into public.subcategories (user_id, category_id, name, type, planned_amount, debt_id, sort_order) values
    (uid, cat_debt, 'Hermana', 'debt', 150, debt_hermana, 1);

  -- Subcategories: Buffer — is_buffer=true means each month's leftover
  -- from every other non-debt subcategory automatically adds to this one.
  insert into public.subcategories (user_id, category_id, name, type, planned_amount, sort_order, is_buffer) values
    (uid, cat_buffer, 'Buffer/extra cushion', 'variable', 110, 1, true);

  -- Default monthly income target
  insert into public.user_settings (user_id, default_income_planned)
    values (uid, 4559.68)
    on conflict (user_id) do update set default_income_planned = excluded.default_income_planned;
end;
$$;

grant execute on function public.seed_starter_budget() to authenticated;

-- ============================================================================
-- MIGRATION — backfills profile rows for the two accounts created before the
-- self-service "+ Add profile" flow existed (Vale and Jose both originally
-- signed in via fixed internal addresses). No-ops if those accounts don't
-- exist (e.g. a brand-new project) or already have a profile row.
-- ============================================================================

insert into public.profiles (id, name, email)
select id, 'Vale', email from auth.users where email = 'vale@bud.internal'
on conflict (id) do nothing;

insert into public.profiles (id, name, email)
select id, 'Jose', email from auth.users where email = 'jose@bud.internal'
on conflict (id) do nothing;
