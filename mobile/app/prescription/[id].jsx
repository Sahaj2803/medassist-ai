import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/themed/Screen";
import Card from "../../components/ui/themed/Card";
import Badge from "../../components/ui/themed/Badge";
import Button from "../../components/ui/themed/Button";
import { Loading, ErrorState } from "../../components/ui/themed/States";
import prescriptionApi from "../../services/prescriptionApi";
import { getErrorMessage } from "../../services/api";
import { FILE_BASE_URL } from "../../constants/config";
import { useTheme } from "../../context/ThemeContext";
import useThemedHeader from "../../hooks/useThemedHeader";

function SectionTitle({ children, theme, style }) {
  return <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }, style]}>{children}</Text>;
}

export default function PrescriptionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  useThemedHeader();
  const [prescription, setPrescription] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { prescription: data } = await prescriptionApi.getById(id);
      setPrescription(data);
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
      const data = await prescriptionApi.analyze(id);
      setPrescription(data.prescription);
      setAiSummary(data.aiSummary);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setAnalyzing(false);
    }
  };

  if (state === "loading") return <Screen><Loading /></Screen>;
  if (state === "error") return <Screen><ErrorState message={error} onRetry={load} /></Screen>;

  const fileUri = prescription.fileUrl?.startsWith("http")
    ? prescription.fileUrl
    : `${FILE_BASE_URL}${prescription.fileUrl}`;

  const medicineCount = prescription.medicines?.length || 0;

  // Truthful processing state: prescription.status === "processing" is a
  // real backend value (see constants/theme.js statusColors), not an
  // invented stage. No fake progress percentage is shown here.
  if (prescription.status === "processing") {
    return (
      <Screen>
        <PrescriptionHero prescription={prescription} fileUri={fileUri} theme={theme} />
        <Card style={styles.processingCard}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.processingTitle, { color: theme.colors.textPrimary }]}>Reading your prescription</Text>
          <Text style={[styles.processingBody, { color: theme.colors.textSecondary }]}>
            MedAssist is extracting the medicines and instructions. This usually only takes a moment — pull to
            refresh in a bit if it's taking longer.
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen onRefresh={load} refreshing={false}>
      <PrescriptionHero prescription={prescription} fileUri={fileUri} theme={theme} medicineCount={medicineCount} />

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: `${theme.colors.error}14`, borderColor: `${theme.colors.error}33` }]}>
          <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      ) : null}

      {prescription.status === "failed" ? (
        <Card style={[styles.spacedTop, { borderColor: `${theme.colors.error}40` }]}>
          <Text style={[styles.body, { color: theme.colors.textPrimary }]}>
            MedAssist couldn't read this prescription automatically. You can try analyzing again, or upload a
            clearer photo.
          </Text>
        </Card>
      ) : null}

      {medicineCount === 0 && prescription.status !== "failed" ? null : (
        <Button
          title={prescription.medicines?.some((m) => !m.aiAnalyzedAt) ? "Analyze with AI" : "Re-analyze with AI"}
          onPress={handleAnalyze}
          loading={analyzing}
          style={styles.spacedTop}
        />
      )}

      {aiSummary ? (
        <Card style={styles.spacedTop}>
          <SectionTitle theme={theme}>Summary</SectionTitle>
          <Text style={[styles.body, { color: theme.colors.textPrimary, marginTop: 6 }]}>{aiSummary}</Text>
        </Card>
      ) : null}

      <SectionTitle theme={theme} style={styles.spacedTop}>Medicines</SectionTitle>
      {medicineCount === 0 ? (
        <Text style={[styles.bodyMuted, { color: theme.colors.textSecondary }]}>No medicines extracted yet.</Text>
      ) : (
        prescription.medicines.map((med) => (
          <Card key={med._id} style={styles.medCard}>
            <View style={styles.rowBetween}>
              <View style={[styles.medIcon, { backgroundColor: `${theme.colors.teal}17` }]}>
                <Ionicons name="medical" size={16} color={theme.colors.teal} />
              </View>
              <Text style={[styles.medName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {med.name}
              </Text>
              {med.needsReview && !med.confirmedByUser ? <Badge status="needs_review" label="Review" /> : null}
            </View>
            <Text style={[styles.bodyMuted, { color: theme.colors.textSecondary, marginTop: 6 }]}>
              {[med.dosage, med.frequency, med.instructions].filter(Boolean).join(" · ") || "No details extracted"}
            </Text>
            {med.aiAnalysis?.summary ? (
              <Text style={[styles.body, { color: theme.colors.textPrimary, marginTop: 8 }]}>{med.aiAnalysis.summary}</Text>
            ) : null}
            <Button
              title="View details"
              variant="ghost"
              onPress={() => router.push(`/medicine/${med._id}`)}
              style={styles.viewButton}
            />
          </Card>
        ))
      )}

      {prescription.interactions?.length > 0 ? (
        <>
          <SectionTitle theme={theme} style={styles.spacedTop}>Drug interactions</SectionTitle>
          {prescription.interactions.map((interaction, idx) => (
            <Card key={idx} style={[styles.medCard, { borderColor: `${theme.colors.error}40` }]}>
              <View style={styles.rowBetween}>
                <Text style={[styles.body, { color: theme.colors.textPrimary, flex: 1 }]}>
                  {interaction.medicineA} + {interaction.medicineB}
                </Text>
                <Badge status={interaction.severity} />
              </View>
              <Text style={[styles.bodyMuted, { color: theme.colors.textSecondary, marginTop: 6 }]}>
                {interaction.description}
              </Text>
            </Card>
          ))}
        </>
      ) : null}

      {prescription.aiDoctorNotes ? (
        <Card style={styles.spacedTop}>
          <SectionTitle theme={theme}>Doctor's notes</SectionTitle>
          <Text style={[styles.body, { color: theme.colors.textPrimary, marginTop: 6 }]}>{prescription.aiDoctorNotes}</Text>
        </Card>
      ) : null}

      <View style={[styles.metaFooter, { borderTopColor: theme.colors.border }]}>
        <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
        <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
          Uploaded {new Date(prescription.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </Screen>
  );
}

function PrescriptionHero({ prescription, fileUri, theme, medicineCount }) {
  return (
    <Card variant="glass" style={styles.heroCard}>
      {prescription.fileType === "image" ? (
        <Image source={{ uri: fileUri }} style={styles.heroImage} resizeMode="cover" />
      ) : (
        <View style={[styles.heroIconWrap, { backgroundColor: `${theme.colors.primary}1F` }]}>
          <Ionicons name="document-text" size={30} color={theme.colors.primary} />
        </View>
      )}
      <View style={styles.heroBody}>
        <View style={styles.rowBetween}>
          <Text style={[styles.heroTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {prescription.originalName}
          </Text>
          <Badge status={prescription.status} />
        </View>
        <Text style={[styles.heroCaption, { color: theme.colors.textSecondary }]}>
          Uploaded {new Date(prescription.createdAt).toLocaleDateString()}
          {typeof medicineCount === "number" ? `  ·  ${medicineCount} medicine${medicineCount === 1 ? "" : "s"}` : ""}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  heroCard: { marginBottom: 4, padding: 0, overflow: "hidden" },
  heroImage: { width: "100%", height: 180 },
  heroIconWrap: { width: "100%", height: 100, alignItems: "center", justifyContent: "center" },
  heroBody: { padding: 16 },
  heroTitle: { fontSize: 18, fontWeight: "700", flex: 1, marginRight: 8 },
  heroCaption: { fontSize: 12.5, marginTop: 4 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 14, padding: 12, borderRadius: 12, borderWidth: 1 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  spacedTop: { marginTop: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  body: { fontSize: 14.5, lineHeight: 20 },
  bodyMuted: { fontSize: 13.5, lineHeight: 19 },
  medCard: { marginTop: 10 },
  medIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", marginRight: 8 },
  medName: { fontSize: 15, fontWeight: "600", flex: 1 },
  viewButton: { alignSelf: "flex-start", paddingHorizontal: 0, marginTop: 6 },
  processingCard: { marginTop: 18, alignItems: "center", paddingVertical: 32, gap: 10 },
  processingTitle: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  processingBody: { fontSize: 13.5, textAlign: "center", lineHeight: 19, paddingHorizontal: 8 },
  metaFooter: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 24, paddingTop: 16, borderTopWidth: 1 },
  metaText: { fontSize: 12 },
});
