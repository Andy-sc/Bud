"use client";

import { useEffect, useState, useTransition } from "react";
import { savePushSubscription, deletePushSubscription } from "@/lib/actions/push";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "checking" | "unsupported" | "denied" | "off" | "on";

export default function NotificationSettings() {
  const [status, setStatus] = useState<Status>("checking");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
        them there if you want bill reminders.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--text-secondary)]">
        {status === "on"
          ? "You'll get a reminder the day before a Fixed bill is due."
          : "Get a reminder the day before a Fixed bill is due."}
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
        {pending ? "Working..." : status === "on" ? "Turn off reminders" : "Turn on bill reminders"}
      </button>
      {error && <p className="text-xs text-[var(--critical)]">{error}</p>}
    </div>
  );
}
