import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedCard from "./ui/themed/Card";
import ThemedBadge from "./ui/themed/Badge";
import { useTheme } from "../context/ThemeContext";
import { getDisplayStatus } from "../services/doseTracking";

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// Reusable theme-aware list-row cards, shared across the app's list
// screens (Prescriptions, Medicines, Lab Reports).
export function PrescriptionCard({ item, onPress }) {
  const { theme } = useTheme();
  const medicineCount = Array.isArray(item.medicines) ? item.medicines.length : null;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <ThemedCard style={themedStyles.rowCard}>
        <View style={[themedStyles.iconBox, { backgroundColor: `${theme.colors.primary}17` }]}>
          <Ionicons name="document-text" size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.flex1}>
          <Text style={[themedStyles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {item.originalName || "Prescription"}
          </Text>
          <Text style={[themedStyles.meta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {formatDate(item.createdAt)}
            {medicineCount !== null ? `  ·  ${medicineCount} medicine${medicineCount === 1 ? "" : "s"}` : ""}
          </Text>
        </View>
        <ThemedBadge status={item.status} />
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} style={themedStyles.chevron} />
      </ThemedCard>
    </Pressable>
  );
}

export function MedicineCard({ item, onPress }) {
  const { theme } = useTheme();
  const needsReview = item.needsReview && !item.confirmedByUser;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <ThemedCard style={themedStyles.rowCard}>
        <View style={[themedStyles.iconBox, { backgroundColor: `${theme.colors.teal}17` }]}>
          <Ionicons name="medical" size={20} color={theme.colors.teal} />
        </View>
        <View style={styles.flex1}>
          <Text style={[themedStyles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[themedStyles.meta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {[item.dosage, item.frequency].filter(Boolean).join(" · ") || "No dosage info"}
          </Text>
        </View>
        {needsReview ? <ThemedBadge status="needs_review" label="Review" /> : null}
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} style={themedStyles.chevron} />
      </ThemedCard>
    </Pressable>
  );
}

// ----------------------------------------------------------------------------
// Theme-aware Lab Report card + Health Timeline event row.
// ----------------------------------------------------------------------------

// Report-level processing status -> a short, human status word for the list
// card. Falls back to the raw status so nothing is ever silently hidden.
const REPORT_STATUS_LABEL = {
  processing: "Processing",
  needs_review: "Needs review",
  processed: "Analyzed",
  failed: "Failed",
  pending: "Pending",
};

// Counts how many of a report's already-fetched per-test results are
// outside normal range, purely from real data already present on the item
// (never fetched or fabricated here). Returns null when there's nothing to
// summarize so the caller can omit the line entirely.
function summarizeAbnormalResults(results) {
  if (!Array.isArray(results) || results.length === 0) return null;
  const abnormal = results.filter((r) =>
    ["above_range", "below_range", "moderate", "severe"].includes(r.status)
  ).length;
  if (abnormal === 0) return "All results in range";
  return `${abnormal} of ${results.length} need attention`;
}

export function LabReportCard({ item, onPress }) {
  const { theme } = useTheme();
  const abnormalSummary = summarizeAbnormalResults(item.results);
  const testCount = Array.isArray(item.results) ? item.results.length : null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <ThemedCard style={themedStyles.rowCard}>
        <View style={[themedStyles.iconBox, { backgroundColor: `${theme.colors.teal}17` }]}>
          <Ionicons name="flask" size={20} color={theme.colors.teal} />
        </View>
        <View style={styles.flex1}>
          <Text style={[themedStyles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {item.labName || item.originalName || "Lab Report"}
          </Text>
          <Text style={[themedStyles.meta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {formatDate(item.createdAt)}
            {testCount ? `  ·  ${testCount} test${testCount === 1 ? "" : "s"}` : ""}
          </Text>
          {abnormalSummary ? (
            <Text
              style={[
                themedStyles.summary,
                { color: abnormalSummary.startsWith("All") ? theme.colors.teal : theme.colors.orange },
              ]}
              numberOfLines={1}
            >
              {abnormalSummary}
            </Text>
          ) : null}
        </View>
        <ThemedBadge status={item.status} label={REPORT_STATUS_LABEL[item.status]} />
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} style={themedStyles.chevron} />
      </ThemedCard>
    </Pressable>
  );
}

const TIMELINE_EVENT_STYLE = {
  prescriptions: { icon: "document-text", colorKey: "primary" },
  medicines: { icon: "medical", colorKey: "teal" },
  labReports: { icon: "flask", colorKey: "purple" },
  reminders: { icon: "alarm", colorKey: "orange" },
};

export function ThemedTimelineItem({ event, isLast }) {
  const { theme } = useTheme();
  const cfg = TIMELINE_EVENT_STYLE[event.type] || { icon: "ellipse", colorKey: "primary" };
  const color = theme.colors[cfg.colorKey] || theme.colors.primary;

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineIconWrap}>
        <View
          style={[
            themedStyles.timelineIcon,
            { backgroundColor: `${color}17`, borderColor: `${color}40` },
          ]}
        >
          <Ionicons name={cfg.icon} size={15} color={color} />
        </View>
        {!isLast ? <View style={[styles.timelineLine, { backgroundColor: theme.colors.border }]} /> : null}
      </View>
      <View style={[styles.flex1, styles.timelineContent]}>
        <Text style={[themedStyles.title, { color: theme.colors.textPrimary }]}>
          {event.detail || event.kind}
        </Text>
        <Text style={[themedStyles.meta, { color: theme.colors.textSecondary }]}>
          {formatTime(event.date)}
        </Text>
      </View>
    </View>
  );
}

const themedStyles = StyleSheet.create({
  rowCard: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10, paddingVertical: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12.5, marginTop: 2 },
  summary: { fontSize: 12.5, marginTop: 3, fontWeight: "600" },
  chevron: { marginLeft: 2 },
  timelineIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  flex1: { flex: 1 },
  timelineRow: { flexDirection: "row" },
  timelineIconWrap: { alignItems: "center", width: 32 },
  timelineLine: { flex: 1, width: 1, marginVertical: 2 },
  timelineContent: { paddingBottom: 16 },
});

// ----------------------------------------------------------------------------
// Theme-aware reminder card, used by the Reminders screens (list + history).
// Status (upcoming/taken/missed) always comes from getDisplayStatus(item.status)
// — the same real dose-tracking status the rest of the app already uses,
// never invented here.
// ----------------------------------------------------------------------------

function formatTimeThemed(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/**
 * item: a real occurrence from services/doseTracking.js
 *   { reminderId, medicineName, dosage, scheduledFor, status, frequency? }
 * highlight: renders the "Next dose" hero treatment (larger, accent border).
 */
export function ThemedReminderCard({ item, onMark, onPress, highlight = false }) {
  const { theme } = useTheme();
  const displayStatus = getDisplayStatus(item.status);
  const statusIconColor =
    displayStatus === "taken" ? theme.colors.teal : displayStatus === "missed" ? theme.colors.error : theme.colors.primary;

  return (
    <Pressable onPress={() => onPress?.(item)} disabled={!onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <ThemedCard
        variant={highlight ? "elevated" : "surface"}
        style={[
          themedReminderStyles.card,
          highlight && { borderColor: theme.colors.primary, borderWidth: 1.5 },
        ]}
      >
        <View style={themedReminderStyles.row}>
          <View style={[themedReminderStyles.iconBox, { backgroundColor: `${statusIconColor}17` }]}>
            <Ionicons name="alarm" size={highlight ? 24 : 20} color={statusIconColor} />
          </View>
          <View style={styles.flex1}>
            {highlight ? (
              <Text style={[themedReminderStyles.eyebrow, { color: theme.colors.primary }]}>NEXT DOSE</Text>
            ) : null}
            <Text
              style={[
                highlight ? themedReminderStyles.titleLg : themedReminderStyles.title,
                { color: theme.colors.textPrimary },
              ]}
              numberOfLines={1}
            >
              {item.medicineName}
            </Text>
            <Text style={[themedReminderStyles.meta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.dosage ? `${item.dosage} · ` : ""}
              {formatTimeThemed(item.scheduledFor)}
              {item.frequency ? ` · ${item.frequency}` : ""}
            </Text>
            <View style={themedReminderStyles.statusRow}>
              <ThemedBadge status={displayStatus} />
            </View>
          </View>
          {displayStatus === "upcoming" && onMark ? (
            <Pressable
              onPress={() => onMark(item, "taken")}
              style={[themedReminderStyles.markButton, { backgroundColor: theme.colors.teal }]}
              hitSlop={6}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>
      </ThemedCard>
    </Pressable>
  );
}

const themedReminderStyles = StyleSheet.create({
  card: { marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 2 },
  title: { fontSize: 15, fontWeight: "600" },
  titleLg: { fontSize: 18, fontWeight: "700" },
  meta: { fontSize: 12.5, marginTop: 2 },
  statusRow: { marginTop: 6, flexDirection: "row" },
  markButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});

export default {
  PrescriptionCard,
  MedicineCard,
  LabReportCard,
  ThemedTimelineItem,
  ThemedReminderCard,
};
