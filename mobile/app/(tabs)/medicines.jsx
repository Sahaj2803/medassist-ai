import { useCallback, useState } from "react";
import { View, FlatList, StyleSheet, Text } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MedicineCard } from "../../components/DataCards";
import { Loading, EmptyState, ErrorState } from "../../components/ui/States";
import medicineApi from "../../services/medicineApi";
import { getErrorMessage } from "../../services/api";
import { colors, typography, spacing } from "../../constants/theme";

export default function MedicinesScreen() {
  const router = useRouter();
  const [medicines, setMedicines] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={typography.h1}>Medicines</Text>
      </View>

      {state === "loading" ? (
        <Loading />
      ) : state === "error" ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={medicines}
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
            <EmptyState
              icon="medical-outline"
              title="No medicines yet"
              message="Medicines from your analyzed prescriptions will appear here."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink[950] },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
});
