import { useCallback, useEffect, useState } from "react";
import { AppState, Linking } from "react-native";
import { getPermissionStatus, requestPermission } from "../services/notificationScheduler";

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

  const request = useCallback(async () => {
    const s = await requestPermission();
    setStatus(s);
    return s;
  }, []);

  return { status, request, refresh, openSettings: Linking.openSettings };
}
