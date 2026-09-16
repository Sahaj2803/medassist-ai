import { Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../../context/ThemeContext";

/**
 * Small circular icon-only touch target. size covers the whole hit area
 * (default 40 — comfortable for a thumb tap).
 */
export default function IconButton({ children, onPress, size = 40, variant = "surface", style, accessibilityLabel, disabled = false }) {
  const { theme } = useTheme();
  const bg = variant === "primary" ? theme.colors.primary : variant === "transparent" ? "transparent" : theme.colors.surface;
  const border = variant === "primary" ? "transparent" : theme.colors.border;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, borderColor: border, borderWidth: variant === "transparent" ? 0 : 1 },
        disabled && styles.disabled,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.45 },
});
