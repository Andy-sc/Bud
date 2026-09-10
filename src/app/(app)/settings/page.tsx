import { createClient } from "@/lib/supabase/server";
import { getAccounts, getCategoriesWithSubcategories } from "@/lib/budget";
import CategoryManager from "@/components/CategoryManager";
import AccountManager from "@/components/AccountManager";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [categories, accounts] = await Promise.all([
    getCategoriesWithSubcategories(supabase, userId),
    getAccounts(supabase, userId),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
          Categories &amp; subcategories
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Add, edit, or remove whatever you need — a whole new category or
          just a subcategory. Changes apply right away, this month and every
          future month, no need to redo them each time.
        </p>
        <CategoryManager categories={categories} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Accounts
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          The accounts that show up when logging expenses, income, and debt
          payments.
        </p>
        <AccountManager accounts={accounts} />
      </div>
    </div>
  );
}
