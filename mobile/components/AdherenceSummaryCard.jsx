import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "./ui/themed/Card";
import { useTheme } from "../context/ThemeContext";

/**
 * PART 4 — redesigned, theme-aware medication-adherence summary.
 * This component is only ever used by the Reminders list and Reminder
 * History screens (both in Part 4 scope), so it's redesigned directly in
 * place rather than kept as a separate "themed" copy.
 *
 * Built entirely from the real Taken/Missed dose data already computed
 * in services/doseTracking.js#getAdherenceSummary — nothing here invents
 * a percentage. If there isn't enough resolved dose history yet, it says
 * so instead of showing a fake number.
 */
function ringColor(theme, percentage) {
  if (percentage == null) return theme.colors.textSecondary;
  if (percentage >= 80) return theme.colors.teal;
  if (percentage >= 50) return theme.colors.orange;
  return theme.colors.error;
}

export default function AdherenceSummaryCard({ summary, onPress, compact = false }) {
  const { theme } = useTheme();
  const hasData = summary && typeof summary.percentage === "number";
  const color = ringColor(theme, summary?.percentage);

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card variant="elevated" style={compact ? styles.compactCard : styles.card}>
        <View style={styles.row}>
          <View style={[styles.ring, { borderColor: color }]}>
            <Text style={[styles.percentText, { color: hasData ? color : theme.colors.textSecondary }]}>
              {hasData ? `${summary.percentage}%` : "—"}
            </Text>
          </View>
          <View style={styles.flex1}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Adherence</Text>
            {hasData ? (
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: theme.colors.teal }]} />
                  <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
                    {summary.taken ?? 0} taken
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: theme.colors.error }]} />
                  <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
                    {summary.missed ?? 0} missed
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Not enough dose history yet.
              </Text>
            )}
          </View>
          {onPress ? <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} /> : null}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {},
  compactCard: { paddingVertical: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  flex1: { flex: 1 },
  ring: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  percentText: { fontSize: 14, fontWeight: "700" },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 3 },
  legendRow: { flexDirection: "row", gap: 14, marginTop: 5 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontSize: 12.5, fontWeight: "600" },
});
