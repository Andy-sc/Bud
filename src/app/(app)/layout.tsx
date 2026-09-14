import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import Onboarding from "@/components/Onboarding";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: settings, error: settingsError } = await supabase
    .from("user_settings")
    .select("onboarded")
    .eq("user_id", user.id)
    .maybeSingle();

  // Falls back to the old "do you have any categories" check if the
  // `onboarded` column isn't there yet (schema.sql hasn't been re-run on
  // this project) — otherwise this would wrongly show Onboarding to
  // every existing account.
  const needsOnboarding = settingsError
    ? await (async () => {
        const { count } = await supabase
          .from("categories")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        return !count;
      })()
    : !settings?.onboarded;

  if (needsOnboarding) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav email={user.email ?? undefined} />
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8 pb-20 md:pb-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
