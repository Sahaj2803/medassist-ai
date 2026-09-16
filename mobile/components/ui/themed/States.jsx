import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import Button from "./Button";

export function Loading({ label = "Loading..." }) {
  const { theme } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.bodyMuted, { color: theme.colors.textSecondary, marginTop: 12 }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon = "document-text-outline", title, message, action }) {
  const { theme } = useTheme();
  return (
    <View style={styles.center}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Ionicons name={icon} size={30} color={theme.colors.textSecondary} />
      </View>
      <Text style={[styles.title, { color: theme.colors.textPrimary, marginTop: 14 }]}>{title}</Text>
      {message ? (
        <Text style={[styles.bodyMuted, { color: theme.colors.textSecondary, marginTop: 4, textAlign: "center" }]}>{message}</Text>
      ) : null}
      {action ? <View style={{ marginTop: 18, alignSelf: "stretch" }}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  const { theme } = useTheme();
  return (
    <View style={styles.center}>
      <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.error}14`, borderColor: `${theme.colors.error}33` }]}>
        <Ionicons name="alert-circle-outline" size={30} color={theme.colors.error} />
      </View>
      <Text style={[styles.body, { color: theme.colors.textPrimary, marginTop: 14, textAlign: "center" }]}>{message}</Text>
      {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} style={{ marginTop: 14 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 16 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  title: { fontSize: 18, fontWeight: "600" },
  body: { fontSize: 15 },
  bodyMuted: { fontSize: 14 },
});

export default { Loading, EmptyState, ErrorState };
