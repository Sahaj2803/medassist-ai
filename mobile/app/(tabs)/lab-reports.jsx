import { useCallback, useState } from "react";
import { View, FlatList, StyleSheet, Text, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Loading, EmptyState, ErrorState } from "../../components/ui/States";
import labReportApi from "../../services/labReportApi";
import { getErrorMessage } from "../../services/api";
import { colors, typography, spacing } from "../../constants/theme";

function LabReportCard({ item, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.rowCard}>
        <View style={styles.iconBox}>
          <Ionicons name="flask" size={20} color={colors.signal[400]} />
        </View>
        <View style={styles.flex1}>
          <Text style={typography.h3} numberOfLines={1}>{item.labName || item.originalName || "Lab Report"}</Text>
          <Text style={typography.caption}>
            {new Date(item.createdAt).toLocaleDateString()}
            {item.results?.length ? ` · ${item.results.length} tests` : ""}
          </Text>
        </View>
        <Badge status={item.status} />
      </Card>
    </Pressable>
  );
}

export default function LabReportsScreen() {
  const router = useRouter();
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
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={typography.h1}>Lab Reports</Text>
        <Pressable onPress={() => router.push("/lab-report/upload")} style={styles.addButton}>
          <Ionicons name="add" size={22} color={colors.white} />
        </Pressable>
      </View>

      {state === "loading" ? (
        <Loading />
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
              message="Upload a lab report to get AI-powered explanations of your results."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink[950] },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.signal[500],
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
  rowCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(45,212,191,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  flex1: { flex: 1 },
});
