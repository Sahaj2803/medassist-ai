import { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import Screen from "../../components/ui/Screen";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Loading, ErrorState } from "../../components/ui/States";
import medicineApi from "../../services/medicineApi";
import { getErrorMessage } from "../../services/api";
import { colors, typography, spacing } from "../../constants/theme";

function Section({ title, children }) {
  if (!children) return null;
  return (
    <View style={styles.section}>
      <Text style={typography.h3}>{title}</Text>
      <View style={styles.spacedTopSm}>{children}</View>
    </View>
  );
}

function BulletList({ items }) {
  if (!items || items.length === 0) return <Text style={typography.bodyMuted}>None noted.</Text>;
  return (
    <>
      {items.map((item, idx) => (
        <View key={idx} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={[typography.body, styles.flex1]}>{item}</Text>
        </View>
      ))}
    </>
  );
}

export default function MedicineDetailScreen() {
  const { id } = useLocalSearchParams();
  const [medicine, setMedicine] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { medicine: data } = await medicineApi.getById(id);
      setMedicine(data);
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
      const { medicine: updated } = await medicineApi.analyze(id);
      setMedicine(updated);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setAnalyzing(false);
    }
  };

  if (state === "loading") return <Screen><Loading /></Screen>;
  if (state === "error") return <Screen><ErrorState message={error} onRetry={load} /></Screen>;

  const analysis = medicine.aiAnalysis;

  return (
    <Screen>
      <Text style={typography.h1}>{medicine.name}</Text>
      <Text style={typography.bodyMuted}>
        {[medicine.dosage, medicine.frequency].filter(Boolean).join(" · ") || "No dosage extracted"}
      </Text>
      {medicine.instructions ? (
        <Text style={[typography.bodyMuted, styles.spacedTopSm]}>{medicine.instructions}</Text>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={analysis ? "Re-analyze with AI" : "Explain with AI"}
        onPress={handleAnalyze}
        loading={analyzing}
        style={styles.spacedTop}
      />

      {analysis ? (
        <Card style={styles.spacedTop}>
          <Section title="Summary">
            <Text style={typography.body}>{analysis.summary}</Text>
          </Section>
          <Section title="Common uses">
            <BulletList items={analysis.commonUses} />
          </Section>
          <Section title="Common side effects">
            <BulletList items={analysis.sideEffects?.common} />
          </Section>
          <Section title="Serious side effects">
            <BulletList items={analysis.sideEffects?.serious} />
          </Section>
          <Section title="Precautions">
            <BulletList items={analysis.precautions} />
          </Section>
          {analysis.disclaimer ? (
            <Text style={[typography.caption, styles.disclaimer]}>{analysis.disclaimer}</Text>
          ) : (
            <Text style={[typography.caption, styles.disclaimer]}>
              This is general information, not a substitute for advice from your doctor or pharmacist.
            </Text>
          )}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  spacedTop: { marginTop: spacing.lg },
  spacedTopSm: { marginTop: spacing.xs },
  section: { marginBottom: spacing.md },
  bulletRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xs },
  bulletDot: { color: colors.signal[400] },
  flex1: { flex: 1 },
  error: { color: colors.alert[400], marginTop: spacing.sm, fontSize: 13 },
  disclaimer: { marginTop: spacing.sm, fontStyle: "italic" },
});
