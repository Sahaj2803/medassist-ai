import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, spacing } from "../../constants/theme";

/**
 * variant: "primary" (brand gradient) | "secondary" (outlined) | "ghost" (text only) | "danger"
 */
export default function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  icon,
}) {
  const isDisabled = disabled || loading;

  if (variant === "primary") {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} style={[styles.wrapper, style]}>
        <LinearGradient
          colors={isDisabled ? [colors.ink[700], colors.ink[700]] : ["#1D4ED8", "#3B82F6", "#2DD4BF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              {icon}
              <Text style={styles.primaryText}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === "danger") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.wrapper, styles.button, styles.dangerButton, isDisabled && styles.disabled, style]}
      >
        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>{title}</Text>}
      </Pressable>
    );
  }

  if (variant === "secondary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.wrapper, styles.button, styles.secondaryButton, isDisabled && styles.disabled, style]}
      >
        {loading ? (
          <ActivityIndicator color={colors.signal[400]} />
        ) : (
          <>
            {icon}
            <Text style={styles.secondaryText}>{title}</Text>
          </>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={[styles.ghostButton, style]}>
      <Text style={styles.ghostText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: radii.md, overflow: "hidden" },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    minHeight: 50,
  },
  primaryText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.signal[500],
  },
  secondaryText: { color: colors.signal[400], fontWeight: "700", fontSize: 15 },
  dangerButton: { backgroundColor: colors.alert[500] },
  ghostButton: { paddingVertical: 10, paddingHorizontal: spacing.md, alignItems: "center" },
  ghostText: { color: colors.mist[300], fontWeight: "600", fontSize: 14 },
  disabled: { opacity: 0.5 },
});
