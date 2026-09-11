-- OPTIONAL — run this ONLY in Maria's own account, ONLY after she has:
--   1) Run schema.sql once in the SQL Editor
--   2) Signed in to the app at least once and clicked "Load starter template"
--      (this creates her categories/accounts/debt via seed_starter_budget())
--
-- Do NOT run this for the boyfriend's account — it contains Maria's real numbers.
--
-- This backfills the real account balances and the two paychecks she's
-- reported so far, so the app reflects reality instead of starting from
-- zero. Paychecks vary week to week (they're logged individually, not
-- assumed identical) — add future ones the same way via the Income screen.

update public.accounts
   set starting_balance = 789.04,
       balance_as_of = '2026-09-10'
 where user_id = auth.uid() and name = 'Chase Checking';

update public.accounts
   set starting_balance = 625,
       balance_as_of = '2026-09-10'
 where user_id = auth.uid() and name = 'Chase Savings';

insert into public.income (user_id, date, amount, source, account_id)
select auth.uid(), v.date, v.amount, 'Paycheck', a.id
  from public.accounts a
  cross join (values
    ('2026-09-04'::date, 1139.92),
    ('2026-09-11'::date, 1137.42)
  ) as v(date, amount)
 where a.user_id = auth.uid() and a.name = 'Chase Checking';
