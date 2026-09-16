import { useCallback, useMemo, useState } from "react";
import { View, FlatList, StyleSheet, Text, TextInput, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { MedicineCard } from "../../components/DataCards";
import { Loading, EmptyState, ErrorState } from "../../components/ui/themed/States";
import ThemeToggle from "../../components/ui/themed/ThemeToggle";
import medicineApi from "../../services/medicineApi";
import { getErrorMessage } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

export default function MedicinesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [medicines, setMedicines] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [reviewOnly, setReviewOnly] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await medicineApi.list();
      setMedicines(data.medicines || []);
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

  const reviewCount = useMemo(
    () => medicines.filter((m) => m.needsReview && !m.confirmedByUser).length,
    [medicines]
  );

  const visible = useMemo(() => {
    let list = medicines;
    if (reviewOnly) list = list.filter((m) => m.needsReview && !m.confirmedByUser);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((m) => (m.name || "").toLowerCase().includes(q));
    return list;
  }, [medicines, query, reviewOnly]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.h1, { color: theme.colors.textPrimary }]}>My Medicines</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {medicines.length > 0 ? `${medicines.length} from your prescriptions` : "Extracted from your prescriptions"}
          </Text>
        </View>
        <ThemeToggle size={38} />
      </View>

      {state === "success" && medicines.length > 0 ? (
        <View style={styles.toolbar}>
          <View style={[styles.searchWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="search" size={16} color={theme.colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search medicines"
              placeholderTextColor={theme.colors.textSecondary}
              style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            />
          </View>
          {reviewCount > 0 ? (
            <View style={styles.pillsRow}>
              <Pressable
                onPress={() => setReviewOnly(false)}
                style={[
                  styles.pill,
                  { backgroundColor: !reviewOnly ? theme.colors.primary : theme.colors.surface, borderColor: !reviewOnly ? theme.colors.primary : theme.colors.border },
                ]}
              >
                <Text style={[styles.pillText, { color: !reviewOnly ? theme.colors.white : theme.colors.textSecondary }]}>All</Text>
              </Pressable>
              <Pressable
                onPress={() => setReviewOnly(true)}
                style={[
                  styles.pill,
                  { backgroundColor: reviewOnly ? theme.colors.orange : theme.colors.surface, borderColor: reviewOnly ? theme.colors.orange : theme.colors.border },
                ]}
              >
                <Text style={[styles.pillText, { color: reviewOnly ? theme.colors.white : theme.colors.textSecondary }]}>
                  Needs review ({reviewCount})
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      {state === "loading" ? (
        <Loading />
      ) : state === "error" ? (
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
            <MedicineCard item={item} onPress={() => router.push(`/medicine/${item._id}`)} />
          )}
          ListEmptyComponent={
            medicines.length === 0 ? (
              <EmptyState
                icon="medical-outline"
                title="No medicines yet"
                message="Medicines from your analyzed prescriptions will appear here."
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
  pillsRow: { flexDirection: "row", gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  pillText: { fontSize: 12.5, fontWeight: "600" },
  list: { paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 },
});
