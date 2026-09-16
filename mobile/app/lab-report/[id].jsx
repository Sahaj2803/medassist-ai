import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/themed/Screen";
import Card from "../../components/ui/themed/Card";
import Badge from "../../components/ui/themed/Badge";
import Button from "../../components/ui/themed/Button";
import { Loading, ErrorState } from "../../components/ui/themed/States";
import useThemedHeader from "../../hooks/useThemedHeader";
import { useTheme } from "../../context/ThemeContext";
import { statusColorFor } from "../../constants/theme";
import labReportApi from "../../services/labReportApi";
import { getErrorMessage } from "../../services/api";

// Parses reference ranges like "70-100", "70 - 100 mg/dL", "4.5-11" into
// numeric bounds so a subtle range indicator can be drawn. Anything that
// doesn't match a clean "min - max" shape (open-ended ranges like "<200",
// qualitative ranges, free text) is left as text-only — never guessed at.
function parseRange(rangeText) {
  if (!rangeText) return null;
  const match = String(rangeText).match(/(-?\d+(?:\.\d+)?)\s*[-–to]+\s*(-?\d+(?:\.\d+)?)/i);
  if (!match) return null;
  const min = parseFloat(match[1]);
  const max = parseFloat(match[2]);
  if (Number.isNaN(min) || Number.isNaN(max) || max <= min) return null;
  return { min, max };
}

function RangeIndicator({ value, referenceRange, color, trackColor, dotBorderColor }) {
  const range = parseRange(referenceRange);
  const numericValue = parseFloat(value);
  if (!range || Number.isNaN(numericValue)) return null;

  // Give a little headroom on either side of the reference band so a value
  // right at (or just past) the edge is still visible as a dot, not clipped.
  const span = range.max - range.min;
  const padding = span * 0.4;
  const lo = range.min - padding;
  const hi = range.max + padding;
  const clamped = Math.max(lo, Math.min(hi, numericValue));
  const positionPct = ((clamped - lo) / (hi - lo)) * 100;
  const bandStartPct = ((range.min - lo) / (hi - lo)) * 100;
  const bandEndPct = ((range.max - lo) / (hi - lo)) * 100;

  return (
    <View style={styles.rangeWrap}>
      <View style={[styles.rangeTrack, { backgroundColor: trackColor }]}>
        <View
          style={[
            styles.rangeBand,
            { left: `${bandStartPct}%`, width: `${bandEndPct - bandStartPct}%`, backgroundColor: `${color}33` },
          ]}
        />
        <View
          style={[
            styles.rangeDot,
            { left: `${positionPct}%`, backgroundColor: color, borderColor: dotBorderColor || color },
          ]}
        />
      </View>
    </View>
  );
}

function ResultRow({ result, theme, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const hasExplanation = Boolean(result.explanation);
  const statusColor = statusColorFor(theme, result.status);

  return (
    <Pressable
      onPress={() => hasExplanation && setExpanded((v) => !v)}
      style={[styles.resultRow, !isLast && { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }]}
    >
      <View style={styles.resultHeader}>
        <View style={styles.flex1}>
          <Text style={[styles.resultName, { color: theme.colors.textPrimary }]}>{result.testName}</Text>
          <Text style={[styles.resultMeta, { color: theme.colors.textSecondary }]}>
            {result.value ? `${result.value}${result.unit ? " " + result.unit : ""}` : "No value"}
            {result.referenceRange ? `  ·  Ref: ${result.referenceRange}` : ""}
          </Text>
          <RangeIndicator
            value={result.value}
            referenceRange={result.referenceRange}
            color={statusColor}
            trackColor={theme.colors.border}
            dotBorderColor={theme.colors.surface}
          />
        </View>
        <Badge status={result.status} />
        {hasExplanation ? (
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={theme.colors.textSecondary}
            style={styles.chevron}
          />
        ) : null}
      </View>
      {expanded && result.explanation ? (
        <View style={[styles.explanationBox, { backgroundColor: `${theme.colors.primary}0D`, borderColor: `${theme.colors.primary}22` }]}>
          <View style={styles.explanationTitleRow}>
            <Ionicons name="sparkles" size={13} color={theme.colors.primary} />
            <Text style={[styles.explanationTitle, { color: theme.colors.primary }]}>AI insight</Text>
          </View>
          {result.explanation.simpleExplanation ? (
            <Text style={[styles.body, { color: theme.colors.textPrimary }]}>{result.explanation.simpleExplanation}</Text>
          ) : null}
          {result.explanation.whatItMeasures ? (
            <>
              <Text style={[styles.explanationLabel, { color: theme.colors.textSecondary }]}>What it measures</Text>
              <Text style={[styles.bodyMuted, { color: theme.colors.textSecondary }]}>{result.explanation.whatItMeasures}</Text>
            </>
          ) : null}
          {result.explanation.whyItMatters ? (
            <>
              <Text style={[styles.explanationLabel, { color: theme.colors.textSecondary }]}>Why it matters</Text>
              <Text style={[styles.bodyMuted, { color: theme.colors.textSecondary }]}>{result.explanation.whyItMatters}</Text>
            </>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

export default function LabReportDetailScreen() {
  useThemedHeader();
  const { theme } = useTheme();
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

  if (state === "loading") return <Screen><Loading label="Loading report..." /></Screen>;
  if (state === "error") return <Screen><ErrorState message={error} onRetry={load} /></Screen>;

  const results = report.results || [];

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={[styles.h2, { color: theme.colors.textPrimary }]} numberOfLines={2}>
          {report.labName || report.originalName}
        </Text>
        <Badge status={report.status} />
      </View>
      <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
        {report.reportDate ? new Date(report.reportDate).toLocaleDateString() : new Date(report.createdAt).toLocaleDateString()}
      </Text>

      {error ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text> : null}

      <Button
        title={report.analyzedAt ? "Re-analyze with AI" : "Analyze with AI"}
        onPress={handleAnalyze}
        loading={analyzing}
        style={styles.spacedTop}
      />

      {report.overallSummary ? (
        <Card style={styles.spacedTop} variant="elevated">
          <View style={styles.explanationTitleRow}>
            <Ionicons name="sparkles" size={14} color={theme.colors.primary} />
            <Text style={[styles.h3, { color: theme.colors.textPrimary }]}>Summary</Text>
          </View>
          <Text style={[styles.body, { color: theme.colors.textPrimary, marginTop: 6 }]}>{report.overallSummary}</Text>
        </Card>
      ) : null}

      <Text style={[styles.h3, styles.spacedTop, { color: theme.colors.textPrimary }]}>Test results</Text>
      {results.length === 0 ? (
        <Text style={[styles.bodyMuted, { color: theme.colors.textSecondary }]}>
          No results extracted yet. Run AI analysis to see your test values here.
        </Text>
      ) : (
        <Card style={styles.resultsCard}>
          {results.map((result, idx) => (
            <ResultRow key={idx} result={result} theme={theme} isLast={idx === results.length - 1} />
          ))}
        </Card>
      )}

      {report.uncertainNote ? (
        <Card style={styles.spacedTop} variant="elevated">
          <View style={styles.noteRow}>
            <Ionicons name="information-circle-outline" size={18} color={theme.colors.orange} />
            <Text style={[styles.caption, styles.flex1, { color: theme.colors.textSecondary }]}>
              {report.uncertainNote}
            </Text>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  h2: { fontSize: 20, fontWeight: "700", flex: 1 },
  h3: { fontSize: 17, fontWeight: "700" },
  body: { fontSize: 15, lineHeight: 21 },
  bodyMuted: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12.5 },
  dateText: { fontSize: 13, marginTop: 2 },
  errorText: { marginTop: 10, fontSize: 13 },
  spacedTop: { marginTop: 20 },
  resultsCard: { padding: 0, overflow: "hidden", marginTop: 12 },
  resultRow: { paddingHorizontal: 16, paddingVertical: 14 },
  resultHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  resultName: { fontSize: 14.5, fontWeight: "600" },
  resultMeta: { fontSize: 12.5, marginTop: 2 },
  flex1: { flex: 1 },
  chevron: { marginTop: 2, marginLeft: 2 },
  rangeWrap: { marginTop: 10, marginRight: 4 },
  rangeTrack: { height: 6, borderRadius: 3, width: "100%", position: "relative", overflow: "visible" },
  rangeBand: { position: "absolute", top: 0, bottom: 0, borderRadius: 3 },
  rangeDot: {
    position: "absolute",
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    borderWidth: 2,
  },
  explanationBox: { marginTop: 12, gap: 6, padding: 12, borderRadius: 12, borderWidth: 1 },
  explanationTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  explanationTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3, textTransform: "uppercase" },
  explanationLabel: { fontSize: 12, fontWeight: "700", marginTop: 4 },
  noteRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
});
