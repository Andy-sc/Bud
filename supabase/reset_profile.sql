-- UTILITY — wipes ALL data for one profile (by email) so it can be
-- reseeded from a clean slate. Use this when someone clicked "Load
-- starter template" by mistake before running their real seed script
-- (e.g. Jose clicking it before seed_jose_budget.sql ran), or any other
-- time you want to start a profile over from zero.
--
-- This does NOT delete the login itself (the auth.users row / PIN) —
-- only the budget data (accounts, categories, subcategories, debts,
-- expenses, income, settings) tied to it. After running this, the
-- profile is ready for a fresh "Load starter template" click or for
-- seed_jose_budget.sql / seed_my_real_data.sql to be run again.
--
-- HOW TO RUN: set target_email below to the profile you want to wipe,
-- then run the whole file.

do $$
declare
  target_email text := 'jose@bud.internal'; -- <-- change to the profile you want to wipe
  uid uuid;
begin
  select id into uid from auth.users where email = target_email;

  if uid is null then
    raise exception 'No user found with email %.', target_email;
  end if;

  delete from public.expenses where user_id = uid;
  delete from public.income where user_id = uid;
  delete from public.income_plan where user_id = uid;
  delete from public.debt_payments where user_id = uid;
  delete from public.fixed_actuals where user_id = uid;
  delete from public.monthly_overrides where user_id = uid;
  delete from public.subcategories where user_id = uid;
  delete from public.categories where user_id = uid;
  delete from public.debts where user_id = uid;
  delete from public.accounts where user_id = uid;
  delete from public.user_settings where user_id = uid;

  raise notice 'Wiped all budget data for %.', target_email;
end $$;
