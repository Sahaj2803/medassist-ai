import { View, StyleSheet } from "react-native";
import { colors, radii, shadows, spacing } from "../../constants/theme";

export default function Card({ children, style, glow = false }) {
  return <View style={[styles.card, glow && shadows.glow, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.ink[800],
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    ...shadows.card,
  },
});
