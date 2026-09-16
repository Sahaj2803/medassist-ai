import { useCallback, useMemo, useState } from "react";
import { View, FlatList, StyleSheet, Text, Pressable, TextInput } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrescriptionCard } from "../../components/DataCards";
import { Loading, EmptyState, ErrorState } from "../../components/ui/themed/States";
import Button from "../../components/ui/themed/Button";
import ThemeToggle from "../../components/ui/themed/ThemeToggle";
import prescriptionApi from "../../services/prescriptionApi";
import { getErrorMessage } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "processed", label: "Processed" },
  { key: "processing", label: "Processing" },
  { key: "needs_review", label: "Needs review" },
  { key: "failed", label: "Failed" },
];

export default function PrescriptionsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [prescriptions, setPrescriptions] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      const data = await prescriptionApi.list();
      setPrescriptions(data.prescriptions || []);
      setStatus("success");
    } catch (e) {
      setError(getErrorMessage(e));
      setStatus("error");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Only show filter pills for statuses that actually occur in the real
  // data, so we never present a filter for a status the user can't have.
  const availableStatuses = useMemo(() => {
    const set = new Set(prescriptions.map((p) => p.status).filter(Boolean));
    return FILTERS.filter((f) => f.key === "all" || set.has(f.key));
  }, [prescriptions]);

  const visible = useMemo(() => {
    let list = prescriptions;
    if (filter !== "all") list = list.filter((p) => p.status === filter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => (p.originalName || "").toLowerCase().includes(q));
    return list;
  }, [prescriptions, filter, query]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.h1, { color: theme.colors.textPrimary }]}>My Prescriptions</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {prescriptions.length > 0 ? `${prescriptions.length} on file` : "Scan or upload to get started"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <ThemeToggle size={38} style={styles.headerSpacing} />
          <Pressable
            onPress={() => router.push("/prescription/upload")}
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            accessibilityLabel="Scan or upload a prescription"
          >
            <Ionicons name="add" size={22} color={theme.colors.white} />
          </Pressable>
        </View>
      </View>

      {status === "success" && prescriptions.length > 0 ? (
        <View style={styles.toolbar}>
          <View style={[styles.searchWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="search" size={16} color={theme.colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search prescriptions"
              placeholderTextColor={theme.colors.textSecondary}
              style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            />
          </View>
          {availableStatuses.length > 2 ? (
            <FlatList
              horizontal
              data={availableStatuses}
              keyExtractor={(f) => f.key}
              showsHorizontalScrollIndicator={false}
              style={styles.pillsRow}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item: f }) => {
                const active = filter === f.key;
                return (
                  <Pressable
                    onPress={() => setFilter(f.key)}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.pillText, { color: active ? theme.colors.white : theme.colors.textSecondary }]}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          ) : null}
        </View>
      ) : null}

      {status === "loading" ? (
        <Loading />
      ) : status === "error" ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          renderItem={({ item }) => (
            <PrescriptionCard item={item} onPress={() => router.push(`/prescription/${item._id}`)} />
          )}
          ListEmptyComponent={
            prescriptions.length === 0 ? (
              <EmptyState
                icon="document-text-outline"
                title="No prescriptions yet"
                message="Scan or upload your first prescription and MedAssist will read the medicines for you."
                action={<Button title="Scan a prescription" onPress={() => router.push("/prescription/upload")} />}
              />
            ) : (
              <EmptyState icon="search-outline" title="No matches" message="Try a different search or filter." />
            )
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
    paddingBottom: 12,
  },
  h1: { fontSize: 26, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center" },
  headerSpacing: { marginRight: 10 },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  toolbar: { paddingHorizontal: 20, gap: 10, marginBottom: 6 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14 },
  pillsRow: { flexGrow: 0 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  pillText: { fontSize: 12.5, fontWeight: "600" },
  list: { paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 },
});
