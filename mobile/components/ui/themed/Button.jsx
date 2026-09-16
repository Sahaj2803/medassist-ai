import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../context/ThemeContext";

/**
 * Theme-aware counterpart of components/ui/Button.jsx.
 * variant: "primary" (gradient) | "secondary" (outlined) | "ghost" (text only) | "danger"
 */
export default function Button({ title, onPress, variant = "primary", loading = false, disabled = false, style, icon }) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  if (variant === "primary") {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} style={[styles.wrapper, style]}>
        <LinearGradient
          colors={isDisabled ? [theme.colors.border, theme.colors.border] : theme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
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
        style={[styles.wrapper, styles.button, { backgroundColor: theme.colors.error }, isDisabled && styles.disabled, style]}
      >
        {loading ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.primaryText}>{title}</Text>}
      </Pressable>
    );
  }

  if (variant === "secondary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.wrapper,
          styles.button,
          { backgroundColor: "transparent", borderWidth: 1.5, borderColor: theme.colors.primary },
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <>
            {icon}
            <Text style={[styles.secondaryText, { color: theme.colors.primary }]}>{title}</Text>
          </>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={[styles.ghostButton, style]}>
      <Text style={[styles.ghostText, { color: theme.colors.textSecondary }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: 14, overflow: "hidden" },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    minHeight: 50,
  },
  primaryText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  secondaryText: { fontWeight: "700", fontSize: 15 },
  ghostButton: { paddingVertical: 10, paddingHorizontal: 12, alignItems: "center" },
  ghostText: { fontWeight: "600", fontSize: 14 },
  disabled: { opacity: 0.5 },
});
