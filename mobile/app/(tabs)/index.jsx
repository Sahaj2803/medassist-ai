import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/themed/Screen";
import Card from "../../components/ui/themed/Card";
import { Loading, EmptyState } from "../../components/ui/themed/States";
import ThemeToggle from "../../components/ui/themed/ThemeToggle";
import HealthScoreRing from "../../components/ui/themed/HealthScoreRing";
import { ThemedTimelineItem } from "../../components/DataCards";
import useAuth from "../../hooks/useAuth";
import healthApi from "../../services/healthApi";
import { getErrorMessage } from "../../services/api";
import { fetchTodayOccurrences, getAdherenceSummary } from "../../services/doseTracking";
import { useTheme } from "../../context/ThemeContext";

const QUICK_ACTIONS = [
  { key: "scan", label: "Scan Prescription", icon: "camera", route: "/prescription/upload" },
  { key: "lab", label: "Upload Lab Report", icon: "flask", route: "/lab-report/upload" },
  { key: "meds", label: "View Medicines", icon: "medical", route: "/(tabs)/medicines" },
  { key: "reminders", label: "View Reminders", icon: "alarm", route: "/reminders" },
  { key: "diet", label: "Diet Plan", icon: "restaurant", route: "/diet" },
  { key: "chat", label: "Ask AI", icon: "chatbubble-ellipses", route: "/(tabs)/chat" },
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const [score, setScore] = useState(null);
  const [scoreError, setScoreError] = useState(null);
  const [nextDose, setNextDose] = useState(null);
  const [adherence, setAdherence] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [scoreRes, todayRes, timelineRes] = await Promise.allSettled([
        healthApi.score(),
        fetchTodayOccurrences(),
        healthApi.timeline({ limit: 3 }),
      ]);
      if (scoreRes.status === "fulfilled") {
        setScore(scoreRes.value);
        setScoreError(null);
      } else {
        setScore(null);
        setScoreError(getErrorMessage(scoreRes.reason));
      }
      if (todayRes.status === "fulfilled") {
        const upcoming = (todayRes.value || []).find(
          (o) => o.status === "pending" || o.status === "due"
        );
        setNextDose(upcoming || null);
      }
      if (timelineRes.status === "fulfilled") setEvents(timelineRes.value.events || []);
      getAdherenceSummary()
        .then(setAdherence)
        .catch(() => {});
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
          <Text style={[styles.bodyMuted, { color: theme.colors.textSecondary }]}>Welcome back</Text>
          <Text style={[styles.h1, { color: theme.colors.textPrimary }]}>{firstName}</Text>
        </View>
        <View style={styles.headerActions}>
          <ThemeToggle size={38} style={styles.headerSpacing} />
          <Pressable
            onPress={() => router.push("/profile")}
            style={[styles.avatarButton, { backgroundColor: theme.colors.primary }]}
            accessibilityLabel="Open profile"
          >
            <Ionicons name="person" size={20} color={theme.colors.white} />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <Loading label="Loading your dashboard..." />
      ) : (
        <>
          <Pressable onPress={() => router.push("/health-score")}>
            <Card style={styles.scoreCard}>
              {scoreError ? (
                <View style={styles.scoreEmpty}>
                  <Ionicons name="alert-circle-outline" size={28} color={theme.colors.error} />
                  <Text style={[styles.bodyMuted, { color: theme.colors.textSecondary }]}>
                    Unable to load your health score.
                  </Text>
                </View>
              ) : score?.available === false || !score ? (
                <View style={styles.scoreEmpty}>
                  <Ionicons name="pulse-outline" size={28} color={theme.colors.textSecondary} />
                  <Text style={[styles.bodyMuted, { color: theme.colors.textSecondary, textAlign: "center" }]}>
                    Upload a prescription or lab report to see your AI Health Score.
                  </Text>
                </View>
              ) : (
                <View style={styles.scoreRow}>
                  <HealthScoreRing score={score.score} overall={score.overall} size={88} />
                  <View style={styles.flex1}>
                    <Text style={[styles.h3, { color: theme.colors.textPrimary }]}>AI Health Score</Text>
                    <Text style={[styles.bodyMuted, { color: theme.colors.textSecondary }]}>
                      Based on your labs, interactions, and reminder adherence.
                    </Text>
                    <Text style={[styles.linkText, { color: theme.colors.primary }]}>View details →</Text>
                  </View>
                </View>
              )}
            </Card>
          </Pressable>

          <Card style={styles.spacedTop}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.h3, { color: theme.colors.textPrimary }]}>Next dose</Text>
              <Pressable onPress={() => router.push("/reminders")}>
                <Text style={[styles.linkText, { color: theme.colors.primary }]}>View all</Text>
              </Pressable>
            </View>
            {nextDose ? (
              <View style={styles.doseRow}>
                <Ionicons name="alarm" size={20} color={theme.colors.primary} />
                <View style={styles.flex1}>
                  <Text style={[styles.body, { color: theme.colors.textPrimary }]}>{nextDose.medicineName}</Text>
                  <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>
                    {new Date(nextDose.scheduledFor).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {nextDose.dosage ? ` · ${nextDose.dosage}` : ""}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.bodyMuted, { color: theme.colors.textSecondary }]}>No upcoming doses today.</Text>
            )}
            {typeof adherence?.percentage === "number" ? (
              <Pressable
                onPress={() => router.push("/reminders/history")}
                style={[styles.adherenceLine, { borderTopColor: theme.colors.border }]}
              >
                <Ionicons name="stats-chart" size={14} color={theme.colors.teal} />
                <Text style={[styles.adherenceText, { color: theme.colors.teal }]}>
                  {adherence.percentage}% medication adherence · View history
                </Text>
              </Pressable>
            ) : null}
          </Card>

          <View style={[styles.cardHeaderRow, styles.spacedTop]}>
            <Text style={[styles.h3, { color: theme.colors.textPrimary }]}>Quick actions</Text>
          </View>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.key}
                onPress={() => router.push(action.route)}
                style={[styles.actionTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: `${theme.colors.primary}17` }]}>
                  <Ionicons name={action.icon} size={22} color={theme.colors.primary} />
                </View>
                <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.cardHeaderRow, styles.spacedTop]}>
            <Text style={[styles.h3, { color: theme.colors.textPrimary }]}>Recent activity</Text>
            <Pressable onPress={() => router.push("/timeline")}>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>View timeline</Text>
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
              events.map((event, i) => (
                <ThemedTimelineItem key={event.id} event={event} isLast={i === events.length - 1} />
              ))
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerActions: { flexDirection: "row", alignItems: "center" },
  headerSpacing: { marginRight: 10 },
  h1: { fontSize: 28, fontWeight: "700" },
  h3: { fontSize: 18, fontWeight: "600" },
  body: { fontSize: 15, fontWeight: "400" },
  bodyMuted: { fontSize: 14, fontWeight: "400" },
  caption: { fontSize: 12, fontWeight: "400" },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreCard: {},
  scoreEmpty: { alignItems: "center", gap: 8, paddingVertical: 8 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  flex1: { flex: 1 },
  linkText: { fontSize: 13, fontWeight: "700", marginTop: 4 },
  spacedTop: { marginTop: 16 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  doseRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  adherenceLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  adherenceText: { fontSize: 12, fontWeight: "600" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionTile: {
    width: "31%",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 11, textAlign: "center", fontWeight: "600" },
});
