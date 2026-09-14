"use client";

import { useEffect, useState, useTransition } from "react";
import {
  savePushSubscription,
  deletePushSubscription,
  updateNotificationPreferences,
} from "@/lib/actions/push";
import type { NotificationPreferences } from "@/lib/database.types";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "checking" | "unsupported" | "denied" | "off" | "on";
type PrefFlags = Omit<NotificationPreferences, "user_id" | "updated_at">;

const NOTIFICATION_TYPES: { key: keyof PrefFlags; label: string; hint: string }[] = [
  {
    key: "bill_reminders",
    label: "Upcoming bills",
    hint: "The day before a Fixed bill is due.",
  },
  {
    key: "next_income",
    label: "Next income",
    hint: "The day before a recurring paycheck or deposit is expected.",
  },
  {
    key: "low_balance",
    label: "Low balance warning",
    hint: "When your balance across accounts goes negative.",
  },
  {
    key: "category_limit",
    label: "Category near its limit",
    hint: "When a category hits 80% of what you planned for it this month.",
  },
  {
    key: "daily_balance",
    label: "Daily balance",
    hint: "A daily summary of your balance across accounts.",
  },
  {
    key: "goal_reached",
    label: "Goal reached",
    hint: "When you fully fund one of your goals.",
  },
];

export default function NotificationSettings({
  initialPrefs,
}: {
  initialPrefs: NotificationPreferences;
}) {
  const [status, setStatus] = useState<Status>("checking");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<PrefFlags>(initialPrefs);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      if (!cancelled) setStatus(sub ? "on" : "off");
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  function enable() {
    setError(null);
    startTransition(async () => {
      try {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          throw new Error("Notifications aren't configured for this deployment yet.");
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus("denied");
          return;
        }
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        const json = sub.toJSON();
        await savePushSubscription({
          endpoint: sub.endpoint,
          keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
        });
        setStatus("on");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't enable notifications.");
      }
    });
  }

  function disable() {
    setError(null);
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await deletePushSubscription(sub.endpoint);
          await sub.unsubscribe();
        }
        setStatus("off");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't disable notifications.");
      }
    });
  }

  function toggle(key: keyof PrefFlags) {
    const value = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: value }));
    startTransition(async () => {
      try {
        await updateNotificationPreferences({ [key]: value } as Partial<PrefFlags>);
      } catch (err) {
        setPrefs((p) => ({ ...p, [key]: !value }));
        setError(err instanceof Error ? err.message : "Couldn't save that.");
      }
    });
  }

  if (status === "checking") return null;

  if (status === "unsupported") {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        This browser doesn&apos;t support push notifications.
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Notifications are blocked for this site in your browser settings — enable
        them there if you want reminders.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-[var(--text-secondary)]">
          {status === "on"
            ? "Notifications are on for this device."
            : "Turn on notifications for this device, then choose what you want reminders for."}
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={status === "on" ? disable : enable}
          className={`control px-4 py-2 text-sm font-medium disabled:opacity-60 ${
            status === "on"
              ? "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]"
              : "text-[var(--accent-ink)] bg-[var(--accent)]"
          }`}
        >
          {pending ? "Working..." : status === "on" ? "Turn off notifications" : "Turn on notifications"}
        </button>
        {error && <p className="text-xs text-[var(--critical)]">{error}</p>}
      </div>

      {status === "on" && (
        <div className="space-y-1 border-t border-[var(--border)] pt-4">
          {NOTIFICATION_TYPES.map((t) => (
            <label
              key={t.key}
              className="flex items-start justify-between gap-3 py-1.5 cursor-pointer"
            >
              <span>
                <span className="block text-sm text-[var(--text-primary)]">{t.label}</span>
                <span className="block text-xs text-[var(--text-muted)]">{t.hint}</span>
              </span>
              <input
                type="checkbox"
                checked={prefs[t.key]}
                onChange={() => toggle(t.key)}
                className="mt-1 h-4 w-4 accent-[var(--accent)] shrink-0"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
