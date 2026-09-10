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

  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (!count) {
    return <Onboarding />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Nav email={user.email ?? undefined} />
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8 pb-20 md:pb-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
