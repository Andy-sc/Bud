-- OPTIONAL — run this ONLY in Vale's own account, ONLY after she has:
--   1) Run schema.sql once in the SQL Editor
--   2) Signed in to the app at least once (picked "Vale" on the login
--      screen and set her PIN) and clicked "Load starter template"
--      (this creates her categories/accounts/debt via seed_starter_budget())
--
-- Do NOT run this for Jose's account — it contains Vale's real numbers.
--
-- This backfills the real account balances and the two paychecks she's
-- reported so far, so the app reflects reality instead of starting from
-- zero. Paychecks vary week to week (they're logged individually, not
-- assumed identical) — add future ones the same way via the Income screen.
--
-- HOW TO RUN: the Supabase SQL Editor runs as an admin role, not as a
-- signed-in app user, so auth.uid() won't resolve here. This looks up her
-- account by its fixed internal login email instead — just run the whole
-- file as-is.

do $$
declare
  target_email text := 'vale@bud.internal';
  uid uuid;
begin
  select id into uid from auth.users where email = target_email;

  if uid is null then
    raise exception 'No user found with email %. Sign in to the app at least once first (pick "Vale" and set a PIN).', target_email;
  end if;

  update public.accounts
     set starting_balance = 789.04,
         balance_as_of = '2026-09-10'
   where user_id = uid and name = 'Chase Checking';

  update public.accounts
     set starting_balance = 625,
         balance_as_of = '2026-09-10'
   where user_id = uid and name = 'Chase Savings';

  insert into public.income (user_id, date, amount, source, account_id)
  select uid, v.date, v.amount, 'Paycheck', a.id
    from public.accounts a
    cross join (values
      ('2026-09-04'::date, 1139.92),
      ('2026-09-11'::date, 1137.42)
    ) as v(date, amount)
   where a.user_id = uid and a.name = 'Chase Checking';
end $$;
