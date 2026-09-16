import { useCallback, useState } from "react";
import { View, Text, StyleSheet, SectionList } from "react-native";
import { useFocusEffect } from "expo-router";
import Screen from "../../components/ui/themed/Screen";
import Card from "../../components/ui/themed/Card";
import Badge from "../../components/ui/themed/Badge";
import AdherenceSummaryCard from "../../components/AdherenceSummaryCard";
import { Loading, EmptyState, ErrorState } from "../../components/ui/themed/States";
import { getDoseHistory, getAdherenceSummary, getDisplayStatus } from "../../services/doseTracking";
import { getErrorMessage } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import useThemedHeader from "../../hooks/useThemedHeader";

function formatDateHeading(key) {
  const today = new Date();
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  if (isToday) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return "Yesterday";
  }
  return date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

function formatTime(d) {
  return new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/**
 * PART 4 — redesigned Reminder History / Adherence History screen.
 * Data source unchanged: services/doseTracking.js#getDoseHistory and
 * #getAdherenceSummary — both built entirely from real backend/mark
 * data (see doseTracking.js header comment). Nothing here invents a
 * historical record.
 */
export default function DoseHistoryScreen() {
  const { theme } = useTheme();
  useThemedHeader();
  const [sections, setSections] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [groups, summary] = await Promise.all([getDoseHistory(), getAdherenceSummary()]);
      setSections(
        groups.map((g) => ({
          title: formatDateHeading(g.date),
          data: g.items,
        }))
      );
      setAdherence(summary);
      setState("success");
    } catch (e) {
      setError(getErrorMessage(e));
      setState("error");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (state === "loading") return <Screen><Loading label="Loading dose history..." /></Screen>;
  if (state === "error") return <Screen><ErrorState message={error} onRetry={load} /></Screen>;

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Dose history</Text>
      </View>
      <View style={styles.summaryWrap}>
        <AdherenceSummaryCard summary={adherence} />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item, idx) => `${item.reminderId}-${item.scheduledFor}-${idx}`}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={styles.flex1}>
              <Text style={[styles.medicineName, { color: theme.colors.textPrimary }]}>{item.medicineName}</Text>
              <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
                {item.dosage ? `${item.dosage} · ` : ""}
                {formatTime(item.scheduledFor)}
              </Text>
            </View>
            <Badge status={getDisplayStatus(item.status)} />
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="No dose history yet"
            message="Once you mark doses as taken (or a dose goes unmarked past its time), they'll show up here."
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: "700" },
  summaryWrap: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 6 },
  list: { paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 },
  sectionHeader: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  medicineName: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12.5, marginTop: 2 },
  flex1: { flex: 1 },
});
