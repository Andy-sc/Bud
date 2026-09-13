"use client";

import { useActionState, useState } from "react";
import { pinLogin, createProfile, type LoginState } from "./actions";
import type { LoginProfile } from "@/lib/profiles";

const initialState: LoginState = { status: "idle" };

export default function LoginForm({ profiles }: { profiles: LoginProfile[] }) {
  const [mode, setMode] = useState<"list" | "create">("list");
  const [selected, setSelected] = useState<LoginProfile | null>(null);
  const [loginState, loginAction, loginPending] = useActionState(pinLogin, initialState);
  const [createState, createAction, createPending] = useActionState(
    createProfile,
    initialState
  );

  if (mode === "create") {
    return (
      <form action={createAction} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
          >
            Your name
          </label>
          <input
            id="name"
            name="name"
            required
            autoFocus
            placeholder="e.g. Alex"
            className="control w-full px-4 py-3 border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label
            htmlFor="new-pin"
            className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
          >
            Choose a PIN
          </label>
          <input
            id="new-pin"
            name="pin"
            type="password"
            inputMode="numeric"
            minLength={6}
            required
            placeholder="••••••"
            className="control w-full px-4 py-3 border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] text-center tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        {createState.status === "error" && (
          <p className="text-sm text-[var(--critical)]">{createState.message}</p>
        )}
        <button
          type="submit"
          disabled={createPending}
          className="control w-full py-3 font-medium text-[var(--accent-ink)] bg-[var(--accent)] hover:opacity-90 disabled:opacity-60 transition"
        >
          {createPending ? "Creating..." : "Create profile"}
        </button>
        <button
          type="button"
          onClick={() => setMode("list")}
          className="w-full text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          Back
        </button>
      </form>
    );
  }

  if (!selected) {
    return (
      <div className="space-y-3">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => setSelected(profile)}
            className="control w-full py-3 font-medium text-[var(--text-primary)] bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--accent)] transition"
          >
            {profile.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setMode("create")}
          className="control w-full py-3 font-medium text-[var(--text-secondary)] border border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
        >
          + Add profile
        </button>
      </div>
    );
  }

  return (
    <form action={loginAction} className="space-y-4">
      <input type="hidden" name="email" value={selected.email} />
      <div>
        <label
          htmlFor="pin"
          className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
        >
          PIN for {selected.name}
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
      {loginState.status === "error" && (
        <p className="text-sm text-[var(--critical)]">{loginState.message}</p>
      )}
      <button
        type="submit"
        disabled={loginPending}
        className="control w-full py-3 font-medium text-[var(--accent-ink)] bg-[var(--accent)] hover:opacity-90 disabled:opacity-60 transition"
      >
        {loginPending ? "Checking..." : "Continue"}
      </button>
      <button
        type="button"
        onClick={() => setSelected(null)}
        className="w-full text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      >
        Not {selected.name}?
      </button>
    </form>
  );
}
