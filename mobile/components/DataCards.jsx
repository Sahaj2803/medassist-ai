import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "./ui/Card";
import Badge from "./ui/Badge";
import { colors, spacing, typography } from "../constants/theme";

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

export function PrescriptionCard({ item, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.rowCard}>
        <View style={styles.iconBox}>
          <Ionicons name="document-text" size={20} color={colors.brand[400]} />
        </View>
        <View style={styles.flex1}>
          <Text style={typography.h3} numberOfLines={1}>{item.originalName || "Prescription"}</Text>
          <Text style={typography.caption}>{formatDate(item.createdAt)}</Text>
        </View>
        <Badge status={item.status} />
      </Card>
    </Pressable>
  );
}

export function MedicineCard({ item, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.rowCard}>
        <View style={[styles.iconBox, { backgroundColor: "rgba(45,212,191,0.12)" }]}>
          <Ionicons name="medical" size={20} color={colors.signal[400]} />
        </View>
        <View style={styles.flex1}>
          <Text style={typography.h3} numberOfLines={1}>{item.name}</Text>
          <Text style={typography.caption} numberOfLines={1}>
            {[item.dosage, item.frequency].filter(Boolean).join(" · ") || "No dosage info"}
          </Text>
        </View>
        {item.needsReview && !item.confirmedByUser ? (
          <Badge status="needs_review" label="Review" />
        ) : null}
      </Card>
    </Pressable>
  );
}

export function LabResultRow({ result }) {
  return (
    <View style={styles.labRow}>
      <View style={styles.flex1}>
        <Text style={styles.labName}>{result.testName}</Text>
        <Text style={typography.caption}>
          {result.value ? `${result.value}${result.unit ? " " + result.unit : ""}` : "—"}
          {result.referenceRange ? `  ·  Ref: ${result.referenceRange}` : ""}
        </Text>
      </View>
      <Badge status={result.status} />
    </View>
  );
}

export function ReminderCard({ item, onMark, onPress }) {
  return (
    <Pressable onPress={() => onPress?.(item)} disabled={!onPress}>
      <Card style={styles.rowCard}>
        <View style={[styles.iconBox, { backgroundColor: "rgba(96,165,250,0.12)" }]}>
          <Ionicons name="alarm" size={20} color={colors.brand[400]} />
        </View>
        <View style={styles.flex1}>
          <Text style={typography.h3} numberOfLines={1}>{item.medicineName}</Text>
          <Text style={typography.caption}>
            {item.dosage ? `${item.dosage} · ` : ""}
            {formatTime(item.scheduledFor)}
          </Text>
        </View>
        {item.status === "due" || item.status === "pending" ? (
          <Pressable onPress={() => onMark?.(item, "taken")} style={styles.markButton}>
            <Ionicons name="checkmark" size={18} color={colors.white} />
          </Pressable>
        ) : (
          <Badge status={item.status} />
        )}
      </Card>
    </Pressable>
  );
}

const EVENT_ICONS = {
  prescriptions: "document-text",
  medicines: "medical",
  labReports: "flask",
  reminders: "alarm",
};

export function TimelineItem({ event }) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineIconWrap}>
        <View style={styles.timelineIcon}>
          <Ionicons name={EVENT_ICONS[event.type] || "ellipse"} size={16} color={colors.signal[400]} />
        </View>
        <View style={styles.timelineLine} />
      </View>
      <View style={[styles.flex1, styles.timelineContent]}>
        <Text style={typography.body}>{event.detail || event.kind}</Text>
        <Text style={typography.caption}>{formatDate(event.date)} · {formatTime(event.date)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  flex1: { flex: 1 },
  labRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  labName: { color: colors.white, fontSize: 14, fontWeight: "600" },
  markButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.signal[500],
    alignItems: "center",
    justifyContent: "center",
  },
  timelineRow: { flexDirection: "row" },
  timelineIconWrap: { alignItems: "center", width: 32 },
  timelineIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ink[800],
    borderWidth: 1,
    borderColor: "rgba(45,212,191,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: { flex: 1, width: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 2 },
  timelineContent: { paddingBottom: spacing.lg },
});

export default { PrescriptionCard, MedicineCard, LabResultRow, ReminderCard, TimelineItem };
