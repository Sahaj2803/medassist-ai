import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/Screen";
import { ReminderCard } from "../../components/DataCards";
import { Loading, EmptyState, ErrorState } from "../../components/ui/States";
import Button from "../../components/ui/Button";
import reminderApi from "../../services/reminderApi";
import { getErrorMessage } from "../../services/api";
import { colors, typography, spacing } from "../../constants/theme";

export default function RemindersScreen() {
  const router = useRouter();
  const [occurrences, setOccurrences] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { occurrences: data } = await reminderApi.today();
      setOccurrences(data || []);
      setState("success");
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
    }, [load])
  );

  const handleMark = async (occurrence, status) => {
    // Optimistic update — matches the reminder card's instant-feedback pattern on web.
    setOccurrences((prev) =>
      prev.map((o) => (o.reminderId === occurrence.reminderId && o.scheduledFor === occurrence.scheduledFor ? { ...o, status } : o))
    );
    try {
      await reminderApi.mark(occurrence.reminderId, occurrence.scheduledFor, status);
    } catch (e) {
      setError(getErrorMessage(e));
      load();
    }
  };

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <Text style={typography.bodyMuted}>Today's schedule</Text>
        <Pressable onPress={() => router.push("/reminders/create")} style={styles.addButton}>
          <Ionicons name="add" size={20} color={colors.white} />
        </Pressable>
      </View>

      {state === "loading" ? (
        <Loading />
      ) : state === "error" ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={occurrences}
          keyExtractor={(item, idx) => `${item.reminderId}-${item.scheduledFor}-${idx}`}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          renderItem={({ item }) => (
            <ReminderCard item={item} onMark={handleMark} onPress={(r) => router.push(`/reminders/${r.reminderId}`)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="alarm-outline"
              title="No reminders today"
              message="Create a reminder to get notified by email when it's time for a dose."
              action={<Button title="New reminder" onPress={() => router.push("/reminders/create")} />}
            />
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.signal[500],
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
});
