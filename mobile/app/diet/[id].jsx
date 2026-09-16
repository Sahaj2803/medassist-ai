import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import Screen from "../../components/ui/themed/Screen";
import Button from "../../components/ui/themed/Button";
import { Loading, ErrorState } from "../../components/ui/themed/States";
import DietPlanView from "../../components/DietPlanView";
import dietApi, { normalizeDietPlan } from "../../services/dietApi";
import { getErrorMessage } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import useThemedHeader from "../../hooks/useThemedHeader";

/**
 * PART 4 — redesigned Diet Guide result/detail screen. Same data source
 * and same actions as before: dietApi.getById / regenerate / remove.
 * Uses the actual backend Diet Guide response shape already supported
 * by the app (see components/DietPlanView.jsx) — no invented structure,
 * no altered generated content.
 */
export default function DietPlanDetailScreen() {
  const { theme } = useTheme();
  useThemedHeader();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [dietGuide, setDietGuide] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await dietApi.getById(id);
      const normalized = normalizeDietPlan(raw);
      if (!normalized) throw new Error("Diet guide not found");
      setDietGuide(normalized);
      setState("success");
    } catch (e) {
      setError(getErrorMessage(e));
      setState("error");
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError("");
    try {
      const raw = await dietApi.regenerate(id);
      const updated = normalizeDietPlan(raw);
      if (updated) setDietGuide(updated);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setRegenerating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete diet plan", "This can't be undone. Delete this diet plan?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await dietApi.remove(id);
            router.back();
          } catch (e) {
            setError(getErrorMessage(e));
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (state === "loading") return <Screen><Loading /></Screen>;
  if (state === "error") return <Screen><ErrorState message={error} onRetry={load} /></Screen>;

  return (
    <Screen>
      <View style={styles.actionsRow}>
        <Button title="Regenerate" variant="secondary" onPress={handleRegenerate} loading={regenerating} style={styles.flex1} />
        <Button title="Delete" variant="danger" onPress={handleDelete} loading={deleting} style={styles.flex1} />
      </View>

      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

      <View style={styles.spacedTop}>
        <DietPlanView dietGuide={dietGuide} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: "row", gap: 10 },
  flex1: { flex: 1 },
  spacedTop: { marginTop: 16 },
  error: { fontSize: 13, marginTop: 10, fontWeight: "600" },
});
