-- OPTIONAL — run this ONLY in Maria's own account, ONLY after she has:
--   1) Run schema.sql once in the SQL Editor
--   2) Signed in to the app at least once and clicked "Cargar plantilla inicial"
--      (this creates her categories/accounts/debt via seed_starter_budget())
--
-- Do NOT run this for the boyfriend's account — it contains Maria's real numbers.
--
-- This backfills the real account balances and the first paycheck she reported,
-- so the app reflects reality instead of starting from zero.

update public.accounts
   set starting_balance = 789.04,
       balance_as_of = '2026-09-10'
 where user_id = auth.uid() and name = 'Chase Checking';

update public.accounts
   set starting_balance = 625,
       balance_as_of = '2026-09-10'
 where user_id = auth.uid() and name = 'Chase Savings';

insert into public.income (user_id, date, amount, source, account_id)
select auth.uid(), '2026-09-04', 1139.92, 'Paycheck', a.id
  from public.accounts a
 where a.user_id = auth.uid() and a.name = 'Chase Checking';
