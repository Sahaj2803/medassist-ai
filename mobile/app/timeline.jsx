import { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import Screen from "../components/ui/themed/Screen";
import Card from "../components/ui/themed/Card";
import { ThemedTimelineItem } from "../components/DataCards";
import { Loading, EmptyState, ErrorState } from "../components/ui/themed/States";
import useThemedHeader from "../hooks/useThemedHeader";
import { useTheme } from "../context/ThemeContext";
import healthApi from "../services/healthApi";
import { getErrorMessage } from "../services/api";

// Simple, presentation-only date bucketing of the real events returned by
// the backend — no new business logic, just grouping what's already there
// so a long history reads like a premium timeline instead of a flat log.
function groupByRecency(events) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const buckets = { Today: [], Yesterday: [], "Earlier this week": [], Older: [] };

  for (const event of events) {
    const d = event.date ? new Date(event.date) : null;
    if (!d || Number.isNaN(d.getTime())) {
      buckets.Older.push(event);
      continue;
    }
    if (d >= startOfToday) buckets.Today.push(event);
    else if (d >= startOfYesterday) buckets.Yesterday.push(event);
    else if (d >= startOfWeek) buckets["Earlier this week"].push(event);
    else buckets.Older.push(event);
  }

  return Object.entries(buckets).filter(([, items]) => items.length > 0);
}

export default function TimelineScreen() {
  useThemedHeader();
  const { theme } = useTheme();
  const [events, setEvents] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { events: data } = await healthApi.timeline({ limit: 50 });
      setEvents(data || []);
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

  const groups = useMemo(() => groupByRecency(events), [events]);

  if (state === "loading") return <Screen><Loading label="Loading your health history..." /></Screen>;
  if (state === "error") return <Screen><ErrorState message={error} onRetry={load} /></Screen>;

  return (
    <Screen>
      {events.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="Your health journey will appear here"
          message="Prescriptions, medicines, lab reports, and reminders will show up here as you use MedAssist."
        />
      ) : (
        groups.map(([label, items]) => (
          <View key={label} style={styles.group}>
            <Text style={[styles.groupLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
            <Card style={styles.card}>
              {items.map((event, idx) => (
                <ThemedTimelineItem key={event.id} event={event} isLast={idx === items.length - 1} />
              ))}
            </Card>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 4 },
  groupLabel: { fontSize: 12.5, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8, marginTop: 8 },
  card: { paddingBottom: 4 },
});
