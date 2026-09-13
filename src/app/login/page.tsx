import LoginForm from "./LoginForm";
import { LogoMark } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email")
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8 shadow-sm">
        <div className="text-center mb-8">
          <LogoMark className="w-9 h-9 mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Bud — Personal Budget
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Choose your profile and enter your PIN.
          </p>
        </div>
        <LoginForm profiles={profiles ?? []} />
      </div>
    </div>
  );
}
