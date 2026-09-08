import { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/ui/Screen";
import Card from "../components/ui/Card";
import { Loading, EmptyState, ErrorState } from "../components/ui/States";
import HealthScoreRing from "../components/HealthScoreRing";
import healthApi from "../services/healthApi";
import { getErrorMessage } from "../services/api";
import { colors, typography, spacing } from "../constants/theme";

const POSITIVE_LABELS = {
  good_adherence: "Good reminder adherence",
  labs_within_range: "Lab results within range",
  no_interactions: "No flagged drug interactions",
};

const ATTENTION_LABELS = {
  low_adherence: "Low reminder adherence",
  interactions_flagged: "Drug interactions flagged",
  labs_out_of_range: "Some lab results out of range",
};

function IndicatorRow({ icon, color, text, detail }) {
  return (
    <View style={styles.indicatorRow}>
      <Ionicons name={icon} size={18} color={color} style={styles.indicatorIcon} />
      <View style={styles.flex1}>
        <Text style={typography.body}>{text}</Text>
        {detail ? <Text style={typography.caption}>{detail}</Text> : null}
      </View>
    </View>
  );
}

function summarizePositive(p) {
  if (p.key === "good_adherence") return `${p.taken ?? 0} of ${(p.taken ?? 0) + (p.missed ?? 0)} recent doses taken`;
  return null;
}
function summarizeAttention(n) {
  if (n.key === "interactions_flagged") {
    const parts = [];
    if (n.severe) parts.push(`${n.severe} severe`);
    if (n.moderate) parts.push(`${n.moderate} moderate`);
    if (n.mild) parts.push(`${n.mild} mild`);
    return parts.join(", ");
  }
  if (n.key === "low_adherence") return `Score ${n.score}% · ${n.missed ?? 0} missed doses`;
  return null;
}

export default function HealthScoreScreen() {
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await healthApi.score();
      setData(result.score ?? result);
      setState("success");
    } catch (e) {
      setError(getErrorMessage(e));
      setState("error");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (state === "loading") return <Screen><Loading /></Screen>;
  if (state === "error") return <Screen><ErrorState message={error} onRetry={load} /></Screen>;

  if (!data?.available) {
    return (
      <Screen>
        <EmptyState
          icon="pulse-outline"
          title="Not enough data yet"
          message="Upload a prescription or lab report, and set up reminders, to generate your AI Health Score."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.ringWrap}>
        <HealthScoreRing score={data.score} overall={data.overall} size={160} />
      </View>

      <Card style={styles.spacedTop}>
        <Text style={typography.h3}>What's going well</Text>
        {data.positives?.length === 0 ? (
          <Text style={[typography.bodyMuted, styles.spacedTopSm]}>Nothing to highlight yet.</Text>
        ) : (
          data.positives.map((p, idx) => (
            <IndicatorRow
              key={idx}
              icon="checkmark-circle"
              color={colors.success}
              text={POSITIVE_LABELS[p.key] || p.key}
              detail={summarizePositive(p)}
            />
          ))
        )}
      </Card>

      <Card style={styles.spacedTop}>
        <Text style={typography.h3}>Needs attention</Text>
        {data.needsAttention?.length === 0 ? (
          <Text style={[typography.bodyMuted, styles.spacedTopSm]}>Nothing flagged right now.</Text>
        ) : (
          data.needsAttention.map((n, idx) => (
            <IndicatorRow
              key={idx}
              icon="alert-circle"
              color={colors.warning}
              text={ATTENTION_LABELS[n.key] || n.key}
              detail={summarizeAttention(n)}
            />
          ))
        )}
      </Card>

      <Text style={styles.disclaimer}>
        This score is informational only, generated from your uploaded records. It is not a
        medical diagnosis or a guarantee of your health status — always consult a doctor for
        medical advice.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  ringWrap: { alignItems: "center", marginTop: spacing.md },
  spacedTop: { marginTop: spacing.lg },
  spacedTopSm: { marginTop: spacing.xs },
  indicatorRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, alignItems: "flex-start" },
  indicatorIcon: { marginTop: 2 },
  flex1: { flex: 1 },
  disclaimer: { ...typography.caption, marginTop: spacing.xl, fontStyle: "italic", lineHeight: 18 },
});
