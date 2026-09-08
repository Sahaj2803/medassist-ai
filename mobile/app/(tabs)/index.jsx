import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/Screen";
import Card from "../../components/ui/Card";
import { Loading, EmptyState } from "../../components/ui/States";
import HealthScoreRing from "../../components/HealthScoreRing";
import { TimelineItem } from "../../components/DataCards";
import useAuth from "../../hooks/useAuth";
import healthApi from "../../services/healthApi";
import reminderApi from "../../services/reminderApi";
import { colors, typography, spacing, radii } from "../../constants/theme";

const QUICK_ACTIONS = [
  { key: "scan", label: "Scan Prescription", icon: "camera", route: "/prescription/upload" },
  { key: "lab", label: "Upload Lab Report", icon: "flask", route: "/lab-report/upload" },
  { key: "meds", label: "View Medicines", icon: "medical", route: "/(tabs)/medicines" },
  { key: "reminders", label: "View Reminders", icon: "alarm", route: "/reminders" },
  { key: "chat", label: "Ask AI", icon: "chatbubble-ellipses", route: "/(tabs)/chat" },
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [score, setScore] = useState(null);
  const [nextDose, setNextDose] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [scoreRes, todayRes, timelineRes] = await Promise.allSettled([
        healthApi.score(),
        reminderApi.today(),
        healthApi.timeline({ limit: 3 }),
      ]);
      if (scoreRes.status === "fulfilled") setScore(scoreRes.value.score ?? scoreRes.value);
      if (todayRes.status === "fulfilled") {
        const upcoming = (todayRes.value.occurrences || []).find(
          (o) => o.status === "pending" || o.status === "due"
        );
        setNextDose(upcoming || null);
      }
      if (timelineRes.status === "fulfilled") setEvents(timelineRes.value.events || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <View style={styles.header}>
        <View>
          <Text style={typography.bodyMuted}>Welcome back</Text>
          <Text style={typography.h1}>{firstName}</Text>
        </View>
        <Pressable onPress={() => router.push("/profile")} style={styles.avatarButton}>
          <Ionicons name="person" size={20} color={colors.white} />
        </Pressable>
      </View>

      {loading ? (
        <Loading label="Loading your dashboard..." />
      ) : (
        <>
          <Pressable onPress={() => router.push("/health-score")}>
            <Card style={styles.scoreCard}>
              {score?.available === false || !score ? (
                <View style={styles.scoreEmpty}>
                  <Ionicons name="pulse-outline" size={28} color={colors.mist[400]} />
                  <Text style={typography.bodyMuted}>
                    Upload a prescription or lab report to see your AI Health Score.
                  </Text>
                </View>
              ) : (
                <View style={styles.scoreRow}>
                  <HealthScoreRing score={score.score} overall={score.overall} size={88} />
                  <View style={styles.flex1}>
                    <Text style={typography.h3}>AI Health Score</Text>
                    <Text style={typography.bodyMuted}>
                      Based on your labs, interactions, and reminder adherence.
                    </Text>
                    <Text style={styles.linkText}>View details →</Text>
                  </View>
                </View>
              )}
            </Card>
          </Pressable>

          <Card style={styles.spacedTop}>
            <View style={styles.cardHeaderRow}>
              <Text style={typography.h3}>Next dose</Text>
              <Pressable onPress={() => router.push("/reminders")}>
                <Text style={styles.linkText}>View all</Text>
              </Pressable>
            </View>
            {nextDose ? (
              <View style={styles.doseRow}>
                <Ionicons name="alarm" size={20} color={colors.brand[400]} />
                <View style={styles.flex1}>
                  <Text style={typography.body}>{nextDose.medicineName}</Text>
                  <Text style={typography.caption}>
                    {new Date(nextDose.scheduledFor).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {nextDose.dosage ? ` · ${nextDose.dosage}` : ""}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={typography.bodyMuted}>No upcoming doses today.</Text>
            )}
          </Card>

          <View style={[styles.cardHeaderRow, styles.spacedTop]}>
            <Text style={typography.h3}>Quick actions</Text>
          </View>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable key={action.key} onPress={() => router.push(action.route)} style={styles.actionTile}>
                <View style={styles.actionIconBox}>
                  <Ionicons name={action.icon} size={22} color={colors.signal[400]} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.cardHeaderRow, styles.spacedTop]}>
            <Text style={typography.h3}>Recent activity</Text>
            <Pressable onPress={() => router.push("/timeline")}>
              <Text style={styles.linkText}>View timeline</Text>
            </Pressable>
          </View>
          <Card>
            {events.length === 0 ? (
              <EmptyState
                icon="time-outline"
                title="No activity yet"
                message="Your prescriptions, labs, and reminders will show up here."
              />
            ) : (
              events.map((event) => <TimelineItem key={event.id} event={event} />)
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ink[800],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  scoreCard: {},
  scoreEmpty: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  flex1: { flex: 1 },
  linkText: { color: colors.signal[400], fontSize: 13, fontWeight: "700", marginTop: spacing.xs },
  spacedTop: { marginTop: spacing.lg },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  doseRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  actionTile: {
    width: "31%",
    backgroundColor: colors.ink[800],
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(45,212,191,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { color: colors.mist[100], fontSize: 11, textAlign: "center", fontWeight: "600" },
});
