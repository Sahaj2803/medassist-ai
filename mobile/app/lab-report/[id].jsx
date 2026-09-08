import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/Screen";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { Loading, ErrorState } from "../../components/ui/States";
import labReportApi from "../../services/labReportApi";
import { getErrorMessage } from "../../services/api";
import { colors, typography, spacing, radii } from "../../constants/theme";

function ResultRow({ result }) {
  const [expanded, setExpanded] = useState(false);
  const hasExplanation = Boolean(result.explanation);

  return (
    <Pressable onPress={() => hasExplanation && setExpanded((v) => !v)} style={styles.resultRow}>
      <View style={styles.resultHeader}>
        <View style={styles.flex1}>
          <Text style={styles.resultName}>{result.testName}</Text>
          <Text style={typography.caption}>
            {result.value ? `${result.value}${result.unit ? " " + result.unit : ""}` : "No value"}
            {result.referenceRange ? `  ·  Ref: ${result.referenceRange}` : ""}
          </Text>
        </View>
        <Badge status={result.status} />
        {hasExplanation ? (
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.mist[400]}
            style={styles.chevron}
          />
        ) : null}
      </View>
      {expanded && result.explanation ? (
        <View style={styles.explanationBox}>
          {result.explanation.simpleExplanation ? (
            <Text style={typography.body}>{result.explanation.simpleExplanation}</Text>
          ) : null}
          {result.explanation.whatItMeasures ? (
            <>
              <Text style={styles.explanationLabel}>What it measures</Text>
              <Text style={typography.bodyMuted}>{result.explanation.whatItMeasures}</Text>
            </>
          ) : null}
          {result.explanation.whyItMatters ? (
            <>
              <Text style={styles.explanationLabel}>Why it matters</Text>
              <Text style={typography.bodyMuted}>{result.explanation.whyItMatters}</Text>
            </>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

export default function LabReportDetailScreen() {
  const { id } = useLocalSearchParams();
  const [report, setReport] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { labReport } = await labReportApi.getById(id);
      setReport(labReport);
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

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError("");
    try {
      const { labReport: updated } = await labReportApi.analyze(id);
      setReport(updated);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setAnalyzing(false);
    }
  };

  if (state === "loading") return <Screen><Loading /></Screen>;
  if (state === "error") return <Screen><ErrorState message={error} onRetry={load} /></Screen>;

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={typography.h2} numberOfLines={1}>{report.labName || report.originalName}</Text>
        <Badge status={report.status} />
      </View>
      <Text style={typography.caption}>
        {report.reportDate ? new Date(report.reportDate).toLocaleDateString() : new Date(report.createdAt).toLocaleDateString()}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={report.analyzedAt ? "Re-analyze with AI" : "Analyze with AI"}
        onPress={handleAnalyze}
        loading={analyzing}
        style={styles.spacedTop}
      />

      {report.overallSummary ? (
        <Card style={styles.spacedTop}>
          <Text style={typography.h3}>Summary</Text>
          <Text style={[typography.body, styles.spacedTopSm]}>{report.overallSummary}</Text>
        </Card>
      ) : null}

      <Text style={[typography.h3, styles.spacedTop]}>Test results</Text>
      {(report.results || []).length === 0 ? (
        <Text style={typography.bodyMuted}>No results extracted yet.</Text>
      ) : (
        <Card style={styles.resultsCard}>
          {report.results.map((result, idx) => (
            <ResultRow key={idx} result={result} />
          ))}
        </Card>
      )}

      {report.uncertainNote ? (
        <Card style={styles.spacedTop}>
          <View style={styles.noteRow}>
            <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
            <Text style={[typography.caption, styles.flex1]}>{report.uncertainNote}</Text>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  error: { color: colors.alert[400], marginTop: spacing.sm, fontSize: 13 },
  spacedTop: { marginTop: spacing.lg },
  spacedTopSm: { marginTop: spacing.xs },
  resultsCard: { padding: 0, overflow: "hidden" },
  resultRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  resultName: { color: colors.white, fontSize: 14, fontWeight: "600" },
  flex1: { flex: 1 },
  chevron: { marginLeft: spacing.xs },
  explanationBox: { marginTop: spacing.sm, gap: spacing.xs },
  explanationLabel: { color: colors.signal[400], fontSize: 12, fontWeight: "700", marginTop: spacing.xs },
  noteRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
});
