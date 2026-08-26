import { useEffect, useRef } from "react";
import reminderService from "../services/reminderService.js";

const POLL_INTERVAL_MS = 60 * 1000; // matches the backend cron tick

/**
 * Polls GET /api/reminders/today and fires a browser Notification for
 * any dose that has newly become "due" since the last poll. Browser
 * push here is client-side polling rather than server push (no VAPID/
 * service-worker setup needed) — see README for the tradeoff.
 *
 * Call once near the app root while a user is logged in.
 */
export function useReminderNotifications(enabled) {
  const notifiedIds = useRef(new Set());

  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof window === "undefined" || !("Notification" in window)) return undefined;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const poll = async () => {
      if (Notification.permission !== "granted") return;
      try {
        const { occurrences } = await reminderService.today();
        occurrences
          .filter((o) => o.status === "due")
          .forEach((o) => {
            const key = `${o.reminderId}-${o.scheduledFor}`;
            if (notifiedIds.current.has(key)) return;
            notifiedIds.current.add(key);

            new Notification("Time to take your medicine", {
              body: `${o.medicineName}${o.dosage ? ` (${o.dosage})` : ""} — ${o.time}`,
              icon: "/favicon.svg",
            });
          });
      } catch {
        // silent — notifications are a nice-to-have, not critical path
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled]);
}

export default useReminderNotifications;
