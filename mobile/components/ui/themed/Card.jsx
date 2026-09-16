import { View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "../../../context/ThemeContext";

/**
 * Theme-aware counterpart of components/ui/Card.jsx.
 * variant: "surface" (default flat card) | "elevated" (slightly lighter, more shadow) | "glass" (blurred, for hero/floating use — used selectively per the glassmorphism guidance)
 */
export default function Card({ children, style, variant = "surface" }) {
  const { theme, scheme } = useTheme();

  if (variant === "glass") {
    return (
      <View style={[styles.base, styles.glassWrap, theme.shadow, style]}>
        <BlurView intensity={scheme === "dark" ? 40 : 60} tint={scheme} style={StyleSheet.absoluteFill} />
        <View style={[styles.glassOverlay, { backgroundColor: scheme === "dark" ? "rgba(16,36,58,0.35)" : "rgba(255,255,255,0.45)" }]} />
        <View style={styles.glassContent}>{children}</View>
      </View>
    );
  }

  const bg = variant === "elevated" ? theme.colors.elevatedSurface : theme.colors.surface;

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: bg,
          borderColor: theme.colors.border,
        },
        variant === "elevated" && theme.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  glassWrap: { overflow: "hidden", borderWidth: 0, padding: 0 },
  glassOverlay: { ...StyleSheet.absoluteFillObject },
  glassContent: { padding: 16 },
});
