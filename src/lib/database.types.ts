// Hand-written types matching supabase/schema.sql.
// If you change the schema, update this file to match.

export type SubcategoryType = "fixed" | "variable" | "debt";
export type RecurrenceInterval = "weekly" | "biweekly" | "monthly";
export type AccountType = "checking" | "savings" | "credit" | "investment" | "cash";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  starting_balance: number;
  balance_as_of: string | null;
  sort_order: number;
  created_at: string;
  account_type: AccountType;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  is_debt: boolean;
  sort_order: number;
  created_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  owed_to: string | null;
  original_amount: number;
  interest_rate: number;
  start_date: string | null;
  created_at: string;
}

export interface Subcategory {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  type: SubcategoryType;
  planned_amount: number;
  debt_id: string | null;
  sort_order: number;
  created_at: string;
  due_day: number | null;
  is_buffer: boolean;
}

export interface MonthlyOverride {
  id: string;
  user_id: string;
  subcategory_id: string;
  year: number;
  month: number;
  planned_amount: number;
}

export interface FixedActual {
  id: string;
  user_id: string;
  subcategory_id: string;
  year: number;
  month: number;
  actual_amount: number;
  account_id: string | null;
}

export interface Expense {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  subcategory_id: string;
  account_id: string | null;
  note: string | null;
  created_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  source: string | null;
  account_id: string | null;
  note: string | null;
  created_at: string;
  is_recurring: boolean;
  recurrence_interval: RecurrenceInterval | null;
}

export interface IncomePlan {
  id: string;
  user_id: string;
  year: number;
  month: number;
  planned_amount: number;
}

export interface DebtPayment {
  id: string;
  user_id: string;
  debt_id: string;
  date: string;
  amount: number;
  account_id: string | null;
  note: string | null;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  default_income_planned: number;
  display_name: string | null;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  target_date: string | null;
  saved_so_far: number;
  created_at: string;
  notified_reached: boolean;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  bill_reminders: boolean;
  next_income: boolean;
  daily_balance: boolean;
  category_limit: boolean;
  low_balance: boolean;
  goal_reached: boolean;
  updated_at: string;
}

// Minimal Database type so @supabase/ssr's generics are satisfied.
// (Not a full generated schema — good enough since we type query results ourselves.)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
