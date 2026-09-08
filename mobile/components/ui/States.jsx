import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "./Button";
import { colors, spacing, typography } from "../../constants/theme";

export function Loading({ label = "Loading..." }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.signal[400]} />
      <Text style={[typography.bodyMuted, styles.spacedTop]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon = "document-text-outline", title, message, action }) {
  return (
    <View style={styles.center}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={32} color={colors.mist[400]} />
      </View>
      <Text style={[typography.h3, styles.spacedTop, styles.centerText]}>{title}</Text>
      {message ? (
        <Text style={[typography.bodyMuted, styles.spacedTopSm, styles.centerText]}>{message}</Text>
      ) : null}
      {action ? <View style={styles.spacedTop}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <View style={styles.center}>
      <View style={[styles.iconCircle, styles.errorCircle]}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.alert[400]} />
      </View>
      <Text style={[typography.body, styles.spacedTop, styles.centerText]}>{message}</Text>
      {onRetry ? (
        <Button title="Try again" variant="secondary" onPress={onRetry} style={styles.spacedTop} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxxl, paddingHorizontal: spacing.lg },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.ink[800],
    alignItems: "center",
    justifyContent: "center",
  },
  errorCircle: { backgroundColor: "rgba(244,63,94,0.12)" },
  spacedTop: { marginTop: spacing.md },
  spacedTopSm: { marginTop: spacing.xs },
  centerText: { textAlign: "center" },
});

export default { Loading, EmptyState, ErrorState };
