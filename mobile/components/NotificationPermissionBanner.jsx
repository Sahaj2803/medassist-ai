import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

/**
 * PART 4 — redesigned, theme-aware version. Non-blocking notice shown on
 * reminder screens when the OS notification permission isn't granted.
 * Email reminders keep working regardless — this only affects the
 * on-device alert, so it never stops the user from creating/editing
 * reminders. Only used within Reminders screens, so redesigned in place.
 */
export default function NotificationPermissionBanner({ status, onRequest, onOpenSettings }) {
  const { theme } = useTheme();
  if (status === "granted") return null;
  const denied = status === "denied";

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: `${theme.colors.orange}12`, borderColor: `${theme.colors.orange}40` },
      ]}
    >
      <Ionicons name="notifications-off-outline" size={18} color={theme.colors.orange} />
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
        {denied
          ? "App notifications are off. You'll still get email reminders — enable notifications in system settings for on-device alerts too."
          : "Turn on notifications to also get an on-device alert alongside your email reminders."}
      </Text>
      <Pressable onPress={denied ? onOpenSettings : onRequest} style={styles.button} hitSlop={6}>
        <Text style={[styles.buttonText, { color: theme.colors.primary }]}>
          {denied ? "Open Settings" : "Enable"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  text: { flex: 1, fontSize: 12.5, lineHeight: 17 },
  button: { paddingHorizontal: 8, paddingVertical: 4 },
  buttonText: { fontWeight: "700", fontSize: 12.5 },
});
