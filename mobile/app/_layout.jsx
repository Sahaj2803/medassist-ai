import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AuthProvider from "../context/AuthContext";
import useAuth from "../hooks/useAuth";
import { colors } from "../constants/theme";
import { Loading } from "../components/ui/States";
import { View, StyleSheet } from "react-native";

/**
 * Route-guard: redirects between the (auth) group and the (tabs) group
 * based on session state, the mobile equivalent of client/src/router's
 * <ProtectedRoute> / <PublicOnlyRoute> wrappers.
 */
function AuthGate({ children }) {
  const { status, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

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
      <View style={styles.splash}>
        <Loading label="Starting MedAssist..." />
      </View>
    );
  }

  return children;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <AuthProvider>
        <AuthGate>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ink[950] } }}>
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
            <Stack.Screen name="health-score" options={{ headerShown: true, title: "AI Health Score" }} />
            <Stack.Screen name="timeline" options={{ headerShown: true, title: "Health Timeline" }} />
            <Stack.Screen name="profile" options={{ headerShown: true, title: "Profile" }} />
            <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings" }} />
          </Stack>
        </AuthGate>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  splash: { flex: 1, backgroundColor: colors.ink[950], alignItems: "center", justifyContent: "center" },
});
