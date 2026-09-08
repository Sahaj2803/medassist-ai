import { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import Screen from "../components/ui/Screen";
import Card from "../components/ui/Card";
import { TimelineItem } from "../components/DataCards";
import { Loading, EmptyState, ErrorState } from "../components/ui/States";
import healthApi from "../services/healthApi";
import { getErrorMessage } from "../services/api";
import { spacing } from "../constants/theme";

export default function TimelineScreen() {
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

  if (state === "loading") return <Screen><Loading /></Screen>;
  if (state === "error") return <Screen><ErrorState message={error} onRetry={load} /></Screen>;

  return (
    <Screen>
      {events.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="No activity yet"
          message="Your prescriptions, medicines, lab reports, and reminders will show up here as you use MedAssist."
        />
      ) : (
        <Card style={styles.card}>
          {events.map((event) => (
            <TimelineItem key={event.id} event={event} />
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { paddingBottom: spacing.xs },
});
