"use client";

import { useActionState, useState } from "react";
import { pinLogin, type LoginState } from "./actions";
import { PROFILES } from "@/lib/profiles";

const initialState: LoginState = { status: "idle" };

export default function LoginForm() {
  const [selected, setSelected] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(pinLogin, initialState);

  if (!selected) {
    return (
      <div className="space-y-3">
        {PROFILES.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => setSelected(profile.id)}
            className="control w-full py-3 font-medium text-[var(--text-primary)] bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--accent)] transition"
          >
            {profile.label}
          </button>
        ))}
      </div>
    );
  }

  const profile = PROFILES.find((p) => p.id === selected)!;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="profile" value={profile.id} />
      <div>
        <label
          htmlFor="pin"
          className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
        >
          PIN for {profile.label}
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          minLength={6}
          autoFocus
          required
          placeholder="••••••"
          className="control w-full px-4 py-3 border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] text-center tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>
      {state.status === "error" && (
        <p className="text-sm text-[var(--critical)]">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="control w-full py-3 font-medium text-[var(--accent-ink)] bg-[var(--accent)] hover:opacity-90 disabled:opacity-60 transition"
      >
        {pending ? "Checking..." : "Continue"}
      </button>
      <button
        type="button"
        onClick={() => setSelected(null)}
        className="w-full text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      >
        Not {profile.label}?
      </button>
    </form>
  );
}
