import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import AuthProvider from "../context/AuthContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import useAuth from "../hooks/useAuth";
import { Loading } from "../components/ui/themed/States";
import { View, StyleSheet } from "react-native";
import { ensureNotificationChannel } from "../services/notificationScheduler";
import { syncRemindersFromBackend } from "../services/reminderNotificationSync";

/**
 * Reconciles locally-scheduled notifications against the backend's
 * reminder list after login / cold start and every time the app returns to
 * the foreground (which also picks up notification permission granted in
 * system settings). syncAllReminders is idempotent (deterministic
 * notification ids), so repeated runs never duplicate anything.
 */
function useReminderNotificationSync(isAuthenticated) {
  useEffect(() => {
    // Android needs the channel to exist before the permission prompt and
    // before anything is scheduled.
    ensureNotificationChannel();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    syncRemindersFromBackend({ force: true });
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") syncRemindersFromBackend();
    });
    return () => sub.remove();
  }, [isAuthenticated]);
}

// Survives re-mounts so the same tapped notification is never handled twice.
let lastHandledResponseKey = null;

function responseKey(response) {
  const req = response?.notification?.request;
  return `${req?.identifier || ""}|${response?.notification?.date || ""}|${response?.actionIdentifier || ""}`;
}

/**
 * Tapping a medicine notification opens the Reminders screen, which lists
 * today's doses with the existing Taken / Missed controls. Opening the
 * notification never marks anything as taken. Taps that arrive before the
 * user is signed in (cold start) are held and handled after login.
 */
function useNotificationTapNavigation(isAuthenticated) {
  const router = useRouter();
  const authRef = useRef(isAuthenticated);
  const pendingRef = useRef(null);
  authRef.current = isAuthenticated;

  const open = useRef(null);
  open.current = (response) => {
    if (response?.notification?.request?.content?.data?.type !== "medicine-reminder") return;
    const key = responseKey(response);
    if (key === lastHandledResponseKey) return;
    if (!authRef.current) {
      pendingRef.current = response;
      return;
    }
    lastHandledResponseKey = key;
    // Small delay so the navigator is mounted when launched from a tap.
    setTimeout(() => router.push("/reminders"), 250);
  };

  useEffect(() => {
    Notifications.getLastNotificationResponseAsync()
      .then((response) => response && open.current(response))
      .catch((e) => console.warn("[notifications] Could not read launch notification", e?.message || ""));
    const sub = Notifications.addNotificationResponseReceivedListener((response) => open.current(response));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (isAuthenticated && pendingRef.current) {
      const response = pendingRef.current;
      pendingRef.current = null;
      open.current(response);
    }
  }, [isAuthenticated]);
}

/**
 * Route-guard: redirects between the (auth) group and the (tabs) group
 * based on session state, the mobile equivalent of client/src/router's
 * <ProtectedRoute> / <PublicOnlyRoute> wrappers.
 */
function AuthGate({ children }) {
  const { status, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useReminderNotificationSync(isAuthenticated);
  useNotificationTapNavigation(isAuthenticated);

  useEffect(() => {
    if (status === "loading") return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [status, isAuthenticated, segments, router]);

  if (status === "loading") {
    return (
      <View style={[styles.splash, { backgroundColor: theme.colors.background }]}>
        <Loading label="Starting MedAssist..." />
      </View>
    );
  }

  return children;
}

/**
 * PART 5 — thin theme-aware wrapper around the Stack so the screen
 * transition backdrop and status bar text follow the active light/dark
 * theme (previously always dark, which mismatched the new light-capable
 * Auth/Chat/Profile/Settings screens during navigation). The Stack.Screen
 * list itself — every route, title, and headerShown flag — is completely
 * unchanged, so this is a pure visual/theming change, not a navigation
 * change.
 */
function ThemedNavigator() {
  const { theme, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="prescription/[id]" options={{ headerShown: true, title: "Prescription" }} />
        <Stack.Screen name="prescription/upload" options={{ headerShown: true, title: "Upload Prescription" }} />
        <Stack.Screen name="medicine/[id]" options={{ headerShown: true, title: "Medicine" }} />
        <Stack.Screen name="lab-report/[id]" options={{ headerShown: true, title: "Lab Report" }} />
        <Stack.Screen name="lab-report/upload" options={{ headerShown: true, title: "Upload Lab Report" }} />
        <Stack.Screen name="reminders/index" options={{ headerShown: true, title: "Reminders" }} />
        <Stack.Screen name="reminders/create" options={{ headerShown: true, title: "New Reminder" }} />
        <Stack.Screen name="reminders/[id]" options={{ headerShown: true, title: "Reminder" }} />
        <Stack.Screen name="reminders/history" options={{ headerShown: true, title: "Dose History" }} />
        <Stack.Screen name="health-score" options={{ headerShown: true, title: "AI Health Score" }} />
        <Stack.Screen name="timeline" options={{ headerShown: true, title: "Health Timeline" }} />
        <Stack.Screen name="diet/index" options={{ headerShown: true, title: "Diet Guide" }} />
        <Stack.Screen name="diet/history" options={{ headerShown: true, title: "Diet Plan History" }} />
        <Stack.Screen name="diet/[id]" options={{ headerShown: true, title: "Diet Plan" }} />
        <Stack.Screen name="profile" options={{ headerShown: true, title: "Profile" }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemeProvider>
      <AuthProvider>
        <AuthGate>
          <ThemedNavigator />
        </AuthGate>
      </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  splash: { flex: 1, alignItems: "center", justifyContent: "center" },
});
