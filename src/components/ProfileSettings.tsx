"use client";

import { useState, useTransition } from "react";
import { updateProfileName, updateProfilePin } from "@/lib/actions/profile";

export default function ProfileSettings({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [namePending, startNameTransition] = useTransition();
  const [nameStatus, setNameStatus] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinPending, startPinTransition] = useTransition();
  const [pinStatus, setPinStatus] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    setNameStatus(null);
    startNameTransition(async () => {
      try {
        await updateProfileName(name);
        setSavedName(name);
        setNameStatus("Saved.");
      } catch (err) {
        setNameError(err instanceof Error ? err.message : "Couldn't save that.");
      }
    });
  }

  function savePin(e: React.FormEvent) {
    e.preventDefault();
    setPinError(null);
    setPinStatus(null);
    if (pin !== pinConfirm) {
      setPinError("PINs don't match.");
      return;
    }
    startPinTransition(async () => {
      try {
        await updateProfilePin(pin);
        setPin("");
        setPinConfirm("");
        setPinStatus("PIN updated.");
      } catch (err) {
        setPinError(err instanceof Error ? err.message : "Couldn't update PIN.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={saveName} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[var(--text-secondary)]">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameStatus(null);
            }}
            className="control px-3 py-2 text-sm border border-[var(--border)] bg-[var(--surface)] w-48"
          />
        </label>
        <button
          type="submit"
          disabled={namePending || name.trim() === savedName || !name.trim()}
          className="control px-4 py-2 text-sm font-medium text-[var(--accent-ink)] bg-[var(--accent)] disabled:opacity-60"
        >
          {namePending ? "Saving..." : "Save name"}
        </button>
        {nameStatus && <p className="text-xs text-[var(--good)] w-full">{nameStatus}</p>}
        {nameError && <p className="text-xs text-[var(--critical)] w-full">{nameError}</p>}
      </form>

      <form onSubmit={savePin} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[var(--text-secondary)]">New PIN</span>
          <input
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            minLength={6}
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="6 digits"
            className="control px-3 py-2 text-sm border border-[var(--border)] bg-[var(--surface)] w-32"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[var(--text-secondary)]">Confirm PIN</span>
          <input
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            minLength={6}
            maxLength={6}
            value={pinConfirm}
            onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ""))}
            placeholder="6 digits"
            className="control px-3 py-2 text-sm border border-[var(--border)] bg-[var(--surface)] w-32"
          />
        </label>
        <button
          type="submit"
          disabled={pinPending || pin.length !== 6 || pinConfirm.length !== 6}
          className="control px-4 py-2 text-sm font-medium text-[var(--accent-ink)] bg-[var(--accent)] disabled:opacity-60"
        >
          {pinPending ? "Saving..." : "Update PIN"}
        </button>
        {pinStatus && <p className="text-xs text-[var(--good)] w-full">{pinStatus}</p>}
        {pinError && <p className="text-xs text-[var(--critical)] w-full">{pinError}</p>}
      </form>
    </div>
  );
}
