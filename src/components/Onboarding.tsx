"use client";

import { useState, useTransition } from "react";
import { seedStarterBudget, skipOnboarding } from "@/app/(app)/actions";
import { LogoMark } from "@/components/icons";

export default function Onboarding() {
  const [pendingTemplate, startTemplate] = useTransition();
  const [pendingBlank, startBlank] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const pending = pendingTemplate || pendingBlank;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full p-8 text-center space-y-4">
        <LogoMark className="w-10 h-10 mx-auto" />
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          Welcome to your budget!
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Load the starter template (Home, Transportation, Daily Living,
          Personal, Savings/Investing, Travel, Debt, Buffer) with example
          amounts, or start from a blank slate and build your own — either
          way, everything can be added, renamed, or removed later from
          Settings.
        </p>
        {error && <p className="text-sm text-[var(--critical)]">{error}</p>}
        <div className="space-y-2">
          <button
            disabled={pending}
            onClick={() =>
              startTemplate(async () => {
                try {
                  await seedStarterBudget();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Something went wrong.");
                }
              })
            }
            className="control w-full py-3 font-medium text-[var(--accent-ink)] bg-[var(--accent)] hover:opacity-90 disabled:opacity-60 transition"
          >
            {pendingTemplate ? "Loading..." : "Load starter template"}
          </button>
          <button
            disabled={pending}
            onClick={() =>
              startBlank(async () => {
                try {
                  await skipOnboarding();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Something went wrong.");
                }
              })
            }
            className="control w-full py-3 font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] disabled:opacity-60 transition"
          >
            {pendingBlank ? "Setting up..." : "Start from scratch"}
          </button>
        </div>
      </div>
    </div>
  );
}
