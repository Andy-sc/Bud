-- OPTIONAL — sets up a second, fully separate budget profile (Jose's)
-- with the same category structure as Vale's, but with his own accounts
-- and blank planned amounts for him to fill in.
--
-- Requires:
--   1) schema.sql has already been run once (shared by all users).
--   2) Jose has signed in to the app at least once (picked "Jose" on the
--      login screen and set his PIN — this creates his auth.users row).
--      He doesn't need to click "Load starter template".
--
-- Do NOT have him click "Load starter template" before running this — that
-- button loads Vale's category structure with HER planned amounts. This
-- script builds Jose's structure directly. If he clicks it afterward by
-- mistake, it's harmless: that function skips itself once categories
-- already exist for a user.
--
-- Real numbers used below (from what Vale provided): Capital One card
-- balances, the Amex balance, and the student loan balance + monthly
-- payment. Everything else (rent, groceries, gas, etc.) is seeded at $0 so
-- Jose can fill in his own real amounts from "Categories" once he's signed
-- in. Account names for the two Capital One cards are left generic
-- ("Capital One Card 1/2") since we don't have his names for them — he can
-- rename any account from Categories -> Accounts.
--
-- HOW TO RUN: just run the whole file as-is, after Jose has picked his
-- profile and set a PIN at least once (his login uses a fixed internal
-- address, jose@bud.internal — no real email needed).

do $$
declare
  target_email text := 'jose@bud.internal';
  uid uuid;
  cat_home uuid;
  cat_transport uuid;
  cat_daily uuid;
  cat_personal uuid;
  cat_savings uuid;
  cat_travel uuid;
  cat_buffer uuid;
  cat_debt uuid;
  debt_student uuid;
  acc_checking uuid;
begin
  select id into uid from auth.users where email = target_email;

  if uid is null then
    raise exception 'No user found with email %. Have Jose pick his profile and set a PIN on the login screen first, then re-run this.', target_email;
  end if;

  if exists (select 1 from public.categories where user_id = uid) then
    raise notice 'This user already has categories — doing nothing (safe to ignore).';
    return;
  end if;

  -- Accounts (his real ones, as described)
  insert into public.accounts (user_id, name, sort_order) values
    (uid, 'Arvest Checking', 1) returning id into acc_checking;
  insert into public.accounts (user_id, name, sort_order) values
    (uid, 'Ally Savings', 2),
    (uid, 'Capital One Card 1', 3),
    (uid, 'Capital One Card 2', 4),
    (uid, 'American Express', 5),
    (uid, 'Robinhood', 6);

  -- Known credit card balances (what he currently owes), as of today.
  -- Update balance_as_of whenever he checks his real statement balance.
  update public.accounts set starting_balance = 1176, balance_as_of = current_date
    where user_id = uid and name = 'Capital One Card 1';
  update public.accounts set starting_balance = 2929, balance_as_of = current_date
    where user_id = uid and name = 'Capital One Card 2';
  update public.accounts set starting_balance = 575.73, balance_as_of = current_date
    where user_id = uid and name = 'American Express';

  -- Categories — same structure as Vale's
  insert into public.categories (user_id, name, sort_order) values (uid, 'Home', 1) returning id into cat_home;
  insert into public.categories (user_id, name, sort_order) values (uid, 'Transportation', 2) returning id into cat_transport;
  insert into public.categories (user_id, name, sort_order) values (uid, 'Daily Living', 3) returning id into cat_daily;
  insert into public.categories (user_id, name, sort_order) values (uid, 'Personal', 4) returning id into cat_personal;
  insert into public.categories (user_id, name, sort_order) values (uid, 'Savings/Investing', 5) returning id into cat_savings;
  insert into public.categories (user_id, name, sort_order) values (uid, 'Travel', 6) returning id into cat_travel;
  insert into public.categories (user_id, name, sort_order, is_debt) values (uid, 'Debt', 7, true) returning id into cat_debt;
  insert into public.categories (user_id, name, sort_order) values (uid, 'Buffer', 8) returning id into cat_buffer;

  -- Debts — his real student loan balance and payment. Interest rate is
  -- left at 0 as a placeholder (not provided) — he can add the real APR
  -- and who services the loan from Debts -> "Edit details".
  insert into public.debts (user_id, name, original_amount, interest_rate)
    values (uid, 'Student loans', 25950.39, 0) returning id into debt_student;

  -- Subcategories: Home
  insert into public.subcategories (user_id, category_id, name, type, planned_amount, sort_order) values
    (uid, cat_home, 'Rent + utilities', 'fixed', 0, 1);

  -- Subcategories: Transportation
  insert into public.subcategories (user_id, category_id, name, type, planned_amount, sort_order) values
    (uid, cat_transport, 'Car insurance', 'fixed', 0, 2),
    (uid, cat_transport, 'Gas', 'variable', 0, 3),
    (uid, cat_transport, 'Maintenance', 'variable', 0, 4);

  -- Subcategories: Daily Living
  insert into public.subcategories (user_id, category_id, name, type, planned_amount, sort_order) values
    (uid, cat_daily, 'Groceries', 'variable', 0, 1),
    (uid, cat_daily, 'Eating out', 'variable', 0, 2),
    (uid, cat_daily, 'Shopping', 'variable', 0, 3);

  -- Subcategories: Personal
  insert into public.subcategories (user_id, category_id, name, type, planned_amount, sort_order) values
    (uid, cat_personal, 'Phone bill', 'fixed', 0, 1),
    (uid, cat_personal, 'Gifts', 'variable', 0, 2),
    (uid, cat_personal, 'Subscriptions', 'fixed', 0, 3);

  -- Subcategories: Savings/Investing (Robinhood instead of Vanguard)
  insert into public.subcategories (user_id, category_id, name, type, planned_amount, sort_order) values
    (uid, cat_savings, 'Investments (Robinhood)', 'fixed', 0, 1),
    (uid, cat_savings, 'Emergency savings', 'fixed', 0, 2);

  -- Subcategories: Travel
  insert into public.subcategories (user_id, category_id, name, type, planned_amount, sort_order) values
    (uid, cat_travel, 'Travel fund', 'fixed', 0, 1);

  -- Subcategories: Debt (linked to the student loan above)
  insert into public.subcategories (user_id, category_id, name, type, planned_amount, debt_id, sort_order) values
    (uid, cat_debt, 'Student loans', 'debt', 155.19, debt_student, 1);

  -- Subcategories: Buffer
  insert into public.subcategories (user_id, category_id, name, type, planned_amount, sort_order) values
    (uid, cat_buffer, 'Buffer/extra cushion', 'variable', 0, 1);

  -- His last known paycheck (biweekly, ~$1,210 — approximate, correct the
  -- exact amount from Income if it's off once he checks his stub).
  insert into public.income (user_id, date, amount, source, account_id)
    values (uid, '2026-08-31', 1210, 'Paycheck', acc_checking);

  -- Default monthly income target: $1,210 biweekly x 26 pay periods/year
  -- / 12 months ≈ $2,621.67. Adjust from Categories once his real average
  -- is confirmed.
  insert into public.user_settings (user_id, default_income_planned)
    values (uid, 2621.67)
    on conflict (user_id) do update set default_income_planned = excluded.default_income_planned;
end $$;
