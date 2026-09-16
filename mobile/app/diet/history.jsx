import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, FlatList } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/themed/Screen";
import Card from "../../components/ui/themed/Card";
import { Loading, EmptyState, ErrorState } from "../../components/ui/themed/States";
import dietApi, { normalizeDietList } from "../../services/dietApi";
import { getErrorMessage } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import useThemedHeader from "../../hooks/useThemedHeader";

function planDateLabel(item) {
  const raw = item.createdAt || item.generatedAt || item.updatedAt;
  if (!raw) return "";
  const d = new Date(raw);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// PART 4 — unchanged from before: the history list projection
// (backend/controllers/diet.controller.js getDietGuideHistory) only
// selects source, labReport, generatedAt, status, createdAt,
// healthContext.conditions — there is no calorie count anywhere in the
// DietGuide schema, so this reads real fields instead of guessing at
// ones that don't exist.
const SOURCE_LABELS = {
  manual: "From health information",
  lab_report: "From lab report",
  lab_report_and_manual: "Lab report + health information",
};

function planSummaryLine(item) {
  const conditions = item.healthContext?.conditions;
  if (conditions?.length) return conditions.slice(0, 2).join(", ");
  return SOURCE_LABELS[item.source] || "Diet guide";
}

function DietPlanCard({ item, onPress }) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <Card style={styles.rowCard}>
        <View style={[styles.iconBox, { backgroundColor: `${theme.colors.teal}17` }]}>
          <Ionicons name="restaurant" size={20} color={theme.colors.teal} />
        </View>
        <View style={styles.flex1}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {planSummaryLine(item)}
          </Text>
          {planDateLabel(item) ? (
            <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>{planDateLabel(item)}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
      </Card>
    </Pressable>
  );
}

/**
 * PART 4 — redesigned Diet Guide history screen. Same data source as
 * before: dietApi.history() + normalizeDietList — real saved diet
 * guides only, nothing invented. Each card navigates to the actual
 * saved detail via app/diet/[id].jsx, unchanged.
 */
export default function DietHistoryScreen() {
  const { theme } = useTheme();
  useThemedHeader();
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await dietApi.history();
      setPlans(normalizeDietList(raw));
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

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Diet Guide history</Text>
      </View>
      {state === "loading" ? (
        <Loading label="Loading diet plans..." />
      ) : state === "error" ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item, idx) => item._id || item.id || String(idx)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          renderItem={({ item }) => (
            <DietPlanCard item={item} onPress={() => router.push(`/diet/${item._id || item.id}`)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="restaurant-outline"
              title="No diet plans yet"
              message="Generate your first diet plan from the Diet Guide screen."
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, flexGrow: 1 },
  pressed: { opacity: 0.85 },
  flex1: { flex: 1 },
  rowCard: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12.5, marginTop: 2 },
});
