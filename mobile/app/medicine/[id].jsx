import { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Screen from "../../components/ui/themed/Screen";
import Card from "../../components/ui/themed/Card";
import Button from "../../components/ui/themed/Button";
import { Loading, ErrorState } from "../../components/ui/themed/States";
import medicineApi from "../../services/medicineApi";
import { getErrorMessage } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import useThemedHeader from "../../hooks/useThemedHeader";

function Section({ title, theme, children }) {
  if (!children) return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
      <View style={{ marginTop: 6 }}>{children}</View>
    </View>
  );
}

function BulletList({ items, theme }) {
  if (!items || items.length === 0) {
    return <Text style={[styles.bodyMuted, { color: theme.colors.textSecondary }]}>None noted.</Text>;
  }
  return (
    <>
      {items.map((item, idx) => (
        <View key={idx} style={styles.bulletRow}>
          <Text style={[styles.bulletDot, { color: theme.colors.teal }]}>•</Text>
          <Text style={[styles.body, { color: theme.colors.textPrimary, flex: 1 }]}>{item}</Text>
        </View>
      ))}
    </>
  );
}

export default function MedicineDetailScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  useThemedHeader();
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
  const needsReview = medicine.needsReview && !medicine.confirmedByUser;

  return (
    <Screen onRefresh={load} refreshing={false}>
      <LinearGradient colors={theme.gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="medical" size={26} color="#FFFFFF" />
        </View>
        <Text style={styles.heroName} numberOfLines={2}>{medicine.name}</Text>
        <View style={styles.chipRow}>
          {medicine.dosage ? <HeroChip label={medicine.dosage} /> : null}
          {medicine.frequency ? <HeroChip label={medicine.frequency} /> : null}
          {needsReview ? <HeroChip label="Needs review" emphasis /> : null}
        </View>
      </LinearGradient>

      {medicine.instructions ? (
        <Card style={styles.spacedTop}>
          <View style={styles.rowStart}>
            <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.body, { color: theme.colors.textPrimary, flex: 1, marginLeft: 8 }]}>
              {medicine.instructions}
            </Text>
          </View>
        </Card>
      ) : null}

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: `${theme.colors.error}14`, borderColor: `${theme.colors.error}33` }]}>
          <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      ) : null}

      <Button
        title={analysis ? "Re-analyze with AI" : "Explain with AI"}
        onPress={handleAnalyze}
        loading={analyzing}
        style={styles.spacedTop}
      />

      {analysis ? (
        <Card style={styles.spacedTop}>
          <Section title="Summary" theme={theme}>
            <Text style={[styles.body, { color: theme.colors.textPrimary }]}>{analysis.summary}</Text>
          </Section>
          <Section title="Common uses" theme={theme}>
            <BulletList items={analysis.commonUses} theme={theme} />
          </Section>
          <Section title="Common side effects" theme={theme}>
            <BulletList items={analysis.sideEffects?.common} theme={theme} />
          </Section>
          <Section title="Serious side effects" theme={theme}>
            <BulletList items={analysis.sideEffects?.serious} theme={theme} />
          </Section>
          <Section title="Precautions" theme={theme}>
            <BulletList items={analysis.precautions} theme={theme} />
          </Section>
          <Text style={[styles.disclaimer, { color: theme.colors.textSecondary }]}>
            {analysis.disclaimer ||
              "This is general information, not a substitute for advice from your doctor or pharmacist."}
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

function HeroChip({ label, emphasis }) {
  return (
    <View style={[styles.chip, emphasis && styles.chipEmphasis]}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, padding: 20 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroName: { color: "#FFFFFF", fontSize: 22, fontWeight: "700" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: { backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipEmphasis: { backgroundColor: "rgba(255,179,71,0.9)" },
  chipText: { color: "#FFFFFF", fontSize: 12.5, fontWeight: "600" },
  spacedTop: { marginTop: 16 },
  rowStart: { flexDirection: "row", alignItems: "flex-start" },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 14, padding: 12, borderRadius: 12, borderWidth: 1 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  bulletRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  bulletDot: { fontSize: 15, lineHeight: 20 },
  body: { fontSize: 14.5, lineHeight: 20 },
  bodyMuted: { fontSize: 13.5, lineHeight: 19 },
  disclaimer: { fontSize: 12, fontStyle: "italic", marginTop: 4, lineHeight: 17 },
});
