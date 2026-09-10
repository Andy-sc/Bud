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
          Categorías y subcategorías
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Agrega, edita o elimina lo que necesites. Los cambios se reflejan en
          el resumen mensual al instante.
        </p>
        <CategoryManager categories={categories} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Cuentas
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Las cuentas que aparecen al registrar gastos, ingresos y abonos.
        </p>
        <AccountManager accounts={accounts} />
      </div>
    </div>
  );
}
