import { useCallback, useState } from "react";
import { View, FlatList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, Pressable } from "react-native";
import { PrescriptionCard } from "../../components/DataCards";
import { Loading, EmptyState, ErrorState } from "../../components/ui/States";
import prescriptionApi from "../../services/prescriptionApi";
import { getErrorMessage } from "../../services/api";
import { colors, typography, spacing } from "../../constants/theme";

export default function PrescriptionsScreen() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={typography.h1}>Prescriptions</Text>
        <Pressable onPress={() => router.push("/prescription/upload")} style={styles.addButton}>
          <Ionicons name="add" size={22} color={colors.white} />
        </Pressable>
      </View>

      {status === "loading" ? (
        <Loading />
      ) : status === "error" ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={prescriptions}
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
            <EmptyState
              icon="document-text-outline"
              title="No prescriptions yet"
              message="Scan or upload your first prescription to get started."
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
});
