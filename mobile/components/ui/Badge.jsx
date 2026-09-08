import { View, Text, StyleSheet } from "react-native";
import { statusColors, radii, spacing } from "../../constants/theme";

const LABELS = {
  within_range: "Within range",
  above_range: "Above range",
  below_range: "Below range",
  undetermined: "Undetermined",
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
  processing: "Processing",
  needs_review: "Needs review",
  processed: "Processed",
  failed: "Failed",
  pending: "Pending",
  due: "Due",
  taken: "Taken",
  missed: "Missed",
};

export default function Badge({ status, label }) {
  const color = statusColors[status] || statusColors.pending;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label || LABELS[status] || status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: "600" },
});
