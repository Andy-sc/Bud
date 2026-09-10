"use client";

import { useState, useTransition } from "react";
import { seedStarterBudget } from "@/app/(app)/actions";

export default function Onboarding() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full p-8 text-center space-y-4">
        <div className="text-4xl">🌱</div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          Welcome to your budget!
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          You don&apos;t have any categories set up yet. Load the starter
          template (Home, Transportation, Daily Living, Personal,
          Savings/Investing, Travel, Debt, Buffer) with example amounts —
          then edit, add, or remove anything from &quot;Categories&quot;.
        </p>
        {error && <p className="text-sm text-[var(--critical)]">{error}</p>}
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await seedStarterBudget();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Something went wrong.");
              }
            })
          }
          className="control w-full py-3 font-medium text-white bg-[var(--series-1)] hover:opacity-90 disabled:opacity-60 transition"
        >
          {pending ? "Loading..." : "Load starter template"}
        </button>
      </div>
    </div>
  );
}
