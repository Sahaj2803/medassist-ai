import { useEffect, useRef } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import AuthProvider from "../context/AuthContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import useAuth from "../hooks/useAuth";
import { Loading } from "../components/ui/themed/States";
import { View, StyleSheet } from "react-native";
import reminderApi from "../services/reminderApi";
import { syncAllReminders } from "../services/notificationScheduler";

/**
 * Reconciles locally-scheduled notifications against the backend's
 * reminder list once per authenticated session-start. syncAllReminders is
 * idempotent (see services/notificationScheduler.js), so this is safe to
 * run on every cold start / login without ever duplicating notifications.
 */
function useReminderNotificationSync(isAuthenticated) {
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const { reminders } = await reminderApi.list();
        await syncAllReminders(reminders || []);
      } catch {
        // Non-fatal — email reminders are unaffected, and this retries
        // naturally on the next app start/login.
      }
    })();
  }, [isAuthenticated]);
}

/**
 * Handles taps on a delivered notification by opening that reminder's
 * detail screen, mirroring how the rest of the app navigates to a
 * reminder (see app/reminders/[id].jsx).
 */
function useNotificationTapNavigation() {
  const router = useRouter();
  const responseListener = useRef();

  useEffect(() => {
    // Covers the case where the app was launched *by* tapping a
    // notification (cold start), not just taps while already running.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      const reminderId = response?.notification?.request?.content?.data?.reminderId;
      if (reminderId) router.push(`/reminders/${reminderId}`);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const reminderId = response?.notification?.request?.content?.data?.reminderId;
      if (reminderId) router.push(`/reminders/${reminderId}`);
    });

    return () => {
      responseListener.current?.remove();
    };
  }, [router]);
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
  useNotificationTapNavigation();

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
