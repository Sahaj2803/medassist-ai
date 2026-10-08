import { useCallback, useEffect, useState } from "react";
import { AppState, Linking } from "react-native";
import { getPermissionStatus, requestPermission } from "../services/notificationScheduler";
import { syncRemindersFromBackend } from "../services/reminderNotificationSync";

/**
 * Tracks OS notification permission status for this app, refreshing
 * whenever the app returns to the foreground (e.g. after the user
 * changes it in system Settings) so the UI never shows a stale state.
 */
export default function useNotificationPermission() {
  const [status, setStatus] = useState("undetermined");

  const refresh = useCallback(async () => {
    const s = await getPermissionStatus();
    setStatus(s);
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  // When permission is newly granted, schedule the user's existing
  // reminders right away (no need to recreate them). Pass
  // { resync: false } from a flow that syncs the reminder itself.
  const request = useCallback(async ({ resync = true } = {}) => {
    const s = await requestPermission();
    setStatus(s);
    if (s === "granted" && resync) syncRemindersFromBackend({ force: true });
    return s;
  }, []);

  return { status, request, refresh, openSettings: Linking.openSettings };
}
