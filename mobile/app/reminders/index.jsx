import { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/themed/Screen";
import Button from "../../components/ui/themed/Button";
import IconButton from "../../components/ui/themed/IconButton";
import { Loading, EmptyState, ErrorState } from "../../components/ui/themed/States";
import { ThemedReminderCard } from "../../components/DataCards";
import AdherenceSummaryCard from "../../components/AdherenceSummaryCard";
import reminderApi from "../../services/reminderApi";
import { getErrorMessage } from "../../services/api";
import { syncAllReminders } from "../../services/notificationScheduler";
import { fetchTodayOccurrences, getAdherenceSummary, getDisplayStatus } from "../../services/doseTracking";
import { useTheme } from "../../context/ThemeContext";
import useThemedHeader from "../../hooks/useThemedHeader";

/**
 * PART 4 — redesigned Reminders list. All data is real: `occurrences`
 * comes from services/doseTracking.js#fetchTodayOccurrences (backed by
 * GET /reminders/today + the existing mark endpoint), and adherence
 * comes from getAdherenceSummary(). Nothing here fabricates a status,
 * a next-dose time, or a percentage.
 */
export default function RemindersScreen() {
  const { theme } = useTheme();
  useThemedHeader();
  const router = useRouter();
  const [occurrences, setOccurrences] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      // Fetches today's real occurrences, auto-resolves any past their
      // grace period into "missed" (persisted via the existing mark
      // endpoint), and caches the real result for the History screen.
      const data = await fetchTodayOccurrences();
      setOccurrences(data || []);
      setState("success");
      // Adherence is fetched separately so a slow/failed stats call never
      // blocks today's list from rendering.
      getAdherenceSummary()
        .then(setAdherence)
        .catch(() => {});
    } catch (e) {
      setError(getErrorMessage(e));
      setState("error");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      // Reconcile local notification schedules with the full reminder
      // list whenever this screen is opened — idempotent (see
      // services/notificationScheduler.js), so it never creates
      // duplicates, it only picks up drift (e.g. a reminder changed
      // elsewhere).
      reminderApi
        .list()
        .then(({ reminders }) => syncAllReminders(reminders || []))
        .catch(() => {});
    }, [load])
  );

  const handleMark = async (occurrence, status) => {
    // Optimistic update — matches the reminder card's instant-feedback pattern on web.
    setOccurrences((prev) =>
      prev.map((o) => (o.reminderId === occurrence.reminderId && o.scheduledFor === occurrence.scheduledFor ? { ...o, status } : o))
    );
    try {
      await reminderApi.mark(occurrence.reminderId, occurrence.scheduledFor, status);
      // Refresh adherence + history cache now that a real status changed.
      fetchTodayOccurrences()
        .then(setOccurrences)
        .catch(() => {});
      getAdherenceSummary()
        .then(setAdherence)
        .catch(() => {});
    } catch (e) {
      setError(getErrorMessage(e));
      load();
    }
  };

  // The "next dose" hero is simply the earliest still-upcoming real
  // occurrence in today's already-fetched list — a plain client-side
  // sort/filter of real backend data, not an invented calculation. If
  // nothing is upcoming, there's no hero and the plain list still shows
  // everything (taken/missed included).
  const { nextDose, restOfList } = useMemo(() => {
    const upcoming = occurrences
      .filter((o) => getDisplayStatus(o.status) === "upcoming")
      .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
    const next = upcoming[0] || null;
    const rest = next
      ? occurrences.filter((o) => !(o.reminderId === next.reminderId && o.scheduledFor === next.scheduledFor))
      : occurrences;
    return { nextDose: next, restOfList: rest };
  }, [occurrences]);

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Reminders</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Today's schedule</Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton accessibilityLabel="View dose history" onPress={() => router.push("/reminders/history")}>
            <Ionicons name="time-outline" size={19} color={theme.colors.textPrimary} />
          </IconButton>
          <IconButton
            variant="primary"
            accessibilityLabel="Add a reminder"
            onPress={() => router.push("/reminders/create")}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </IconButton>
        </View>
      </View>

      {state === "loading" ? (
        <Loading />
      ) : state === "error" ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={restOfList}
          keyExtractor={(item, idx) => `${item.reminderId}-${item.scheduledFor}-${idx}`}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <AdherenceSummaryCard summary={adherence} onPress={() => router.push("/reminders/history")} compact />
              {nextDose ? (
                <View style={styles.nextDoseWrap}>
                  <ThemedReminderCard item={nextDose} onMark={handleMark} onPress={(r) => router.push(`/reminders/${r.reminderId}`)} highlight />
                </View>
              ) : null}
              {restOfList.length > 0 ? (
                <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                  {nextDose ? "REST OF TODAY" : "TODAY"}
                </Text>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <ThemedReminderCard item={item} onMark={handleMark} onPress={(r) => router.push(`/reminders/${r.reminderId}`)} />
          )}
          ListEmptyComponent={
            nextDose ? null : (
              <EmptyState
                icon="alarm-outline"
                title="No reminders today"
                message="Create a reminder to get notified by email when it's time for a dose."
                action={<Button title="New reminder" onPress={() => router.push("/reminders/create")} />}
              />
            )
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 13.5, marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  list: { paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 },
  listHeader: { marginBottom: 6 },
  nextDoseWrap: { marginTop: 14 },
  sectionLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginTop: 18, marginBottom: 8 },
});
