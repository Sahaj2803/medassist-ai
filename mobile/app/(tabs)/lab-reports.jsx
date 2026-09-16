import { useCallback, useState } from "react";
import { View, FlatList, StyleSheet, Text, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LabReportCard } from "../../components/DataCards";
import { Loading, EmptyState, ErrorState } from "../../components/ui/themed/States";
import Button from "../../components/ui/themed/Button";
import { useTheme } from "../../context/ThemeContext";
import labReportApi from "../../services/labReportApi";
import { getErrorMessage } from "../../services/api";

/**
 * Redesigned Lab Reports list (Part 3). Same data source, loading/refresh
 * flow, navigation, and empty/error handling as before — only the visual
 * presentation changed, and it's now theme-aware (light/dark/system).
 */
export default function LabReportsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [reports, setReports] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await labReportApi.list();
      setReports(data.labReports || []);
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Lab Reports</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            AI-explained results, all in one place
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/lab-report/upload")}
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Upload a lab report"
        >
          <Ionicons name="add" size={22} color={theme.colors.white} />
        </Pressable>
      </View>

      {state === "loading" ? (
        <Loading label="Loading your lab reports..." />
      ) : state === "error" ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          renderItem={({ item }) => (
            <LabReportCard item={item} onPress={() => router.push(`/lab-report/${item._id}`)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="flask-outline"
              title="No lab reports yet"
              message="Upload a lab report to get clear, AI-powered explanations of your results."
              action={
                <Button title="Upload a lab report" onPress={() => router.push("/lab-report/upload")} />
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: { fontSize: 26, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 2 },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 },
});
