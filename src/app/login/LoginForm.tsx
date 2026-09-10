"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.status === "sent") {
    return (
      <div className="text-center space-y-3">
        <div className="mx-auto w-14 h-14 rounded-full bg-[color-mix(in_srgb,var(--good)_15%,transparent)] flex items-center justify-center text-2xl">
          ✉️
        </div>
        <p className="text-[var(--text-primary)] font-medium">
          We sent a sign-in link to
        </p>
        <p className="text-[var(--series-1)] font-semibold">{state.message}</p>
        <p className="text-sm text-[var(--text-secondary)]">
          Open your email and tap the link to sign in. You can close this tab.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="control w-full px-4 py-3 border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--series-1)]"
        />
      </div>
      {state.status === "error" && (
        <p className="text-sm text-[var(--critical)]">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="control w-full py-3 font-medium text-white bg-[var(--series-1)] hover:opacity-90 disabled:opacity-60 transition"
      >
        {pending ? "Sending..." : "Send sign-in link"}
      </button>
    </form>
  );
}
