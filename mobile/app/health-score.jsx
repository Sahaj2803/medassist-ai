import { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/ui/themed/Screen";
import Card from "../components/ui/themed/Card";
import { Loading, EmptyState, ErrorState } from "../components/ui/themed/States";
import HealthScoreRing from "../components/ui/themed/HealthScoreRing";
import useThemedHeader from "../hooks/useThemedHeader";
import { useTheme } from "../context/ThemeContext";
import healthApi from "../services/healthApi";
import { getErrorMessage } from "../services/api";

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

function IndicatorRow({ icon, color, text, detail, theme, isLast }) {
  return (
    <View style={[styles.indicatorRow, !isLast && { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }]}>
      <View style={[styles.indicatorIconWrap, { backgroundColor: `${color}17` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.flex1}>
        <Text style={[styles.body, { color: theme.colors.textPrimary }]}>{text}</Text>
        {detail ? <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>{detail}</Text> : null}
      </View>
    </View>
  );
}

function BreakdownCard({ title, icon, iconColor, items, emptyMessage, renderDetail, theme }) {
  return (
    <Card style={styles.spacedTop}>
      <View style={styles.cardTitleRow}>
        <View style={[styles.cardIconWrap, { backgroundColor: `${iconColor}17` }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <Text style={[styles.h3, { color: theme.colors.textPrimary }]}>{title}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={[styles.bodyMuted, styles.spacedTopSm, { color: theme.colors.textSecondary }]}>
          {emptyMessage}
        </Text>
      ) : (
        <View style={styles.spacedTopSm}>
          {items.map((entry, idx) => renderDetail(entry, idx, idx === items.length - 1))}
        </View>
      )}
    </Card>
  );
}

export default function HealthScoreScreen() {
  useThemedHeader();
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await healthApi.score();
      setData(result);
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

  if (state === "loading") return <Screen><Loading label="Calculating your health score..." /></Screen>;
  if (state === "error") return <Screen><ErrorState message={error} onRetry={load} /></Screen>;

  if (!data?.available) {
    return (
      <Screen>
        <EmptyState
          icon="pulse-outline"
          title="Your Health Score will appear here"
          message="Upload a prescription or lab report, and set up reminders, so MedAssist has enough data to generate your AI Health Score."
        />
      </Screen>
    );
  }

  const positives = data.positives || [];
  const needsAttention = data.needsAttention || [];

  return (
    <Screen>
      <Card style={styles.heroCard} variant="elevated">
        <Text style={[styles.heroLabel, { color: theme.colors.textSecondary }]}>Health Score</Text>
        <View style={styles.ringWrap}>
          <HealthScoreRing score={data.score} overall={data.overall} size={172} />
        </View>
        <Text style={[styles.heroCaption, { color: theme.colors.textSecondary }]}>
          Based on your reminders, lab reports, and prescriptions
        </Text>
      </Card>

      <BreakdownCard
        title="What's going well"
        icon="checkmark-circle"
        iconColor={theme.colors.teal}
        items={positives}
        emptyMessage="Nothing to highlight yet."
        theme={theme}
        renderDetail={(p, idx, isLast) => (
          <IndicatorRow
            key={idx}
            icon="checkmark-circle"
            color={theme.colors.teal}
            text={POSITIVE_LABELS[p.key] || p.key}
            detail={summarizePositive(p)}
            theme={theme}
            isLast={isLast}
          />
        )}
      />

      <BreakdownCard
        title="Needs attention"
        icon="alert-circle"
        iconColor={theme.colors.orange}
        items={needsAttention}
        emptyMessage="Nothing flagged right now."
        theme={theme}
        renderDetail={(n, idx, isLast) => (
          <IndicatorRow
            key={idx}
            icon="alert-circle"
            color={theme.colors.orange}
            text={ATTENTION_LABELS[n.key] || n.key}
            detail={summarizeAttention(n)}
            theme={theme}
            isLast={isLast}
          />
        )}
      />

      <Text style={[styles.disclaimer, { color: theme.colors.textSecondary }]}>
        This score is informational only, generated from your uploaded records. It is not a
        medical diagnosis or a guarantee of your health status — always consult a doctor for
        medical advice.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { alignItems: "center", paddingVertical: 28 },
  heroLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  ringWrap: { marginTop: 16 },
  heroCaption: { fontSize: 13, marginTop: 16, textAlign: "center" },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  h3: { fontSize: 16, fontWeight: "700" },
  body: { fontSize: 14.5 },
  bodyMuted: { fontSize: 13.5 },
  caption: { fontSize: 12.5, marginTop: 1 },
  spacedTop: { marginTop: 16 },
  spacedTopSm: { marginTop: 8 },
  indicatorRow: { flexDirection: "row", gap: 10, paddingVertical: 10, alignItems: "flex-start" },
  indicatorIconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", marginTop: 1 },
  flex1: { flex: 1 },
  disclaimer: { fontSize: 12, marginTop: 24, fontStyle: "italic", lineHeight: 18 },
});
