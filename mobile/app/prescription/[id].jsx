import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/Screen";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { Loading, ErrorState } from "../../components/ui/States";
import prescriptionApi from "../../services/prescriptionApi";
import { getErrorMessage } from "../../services/api";
import { FILE_BASE_URL } from "../../constants/config";
import { colors, typography, spacing, radii } from "../../constants/theme";

export default function PrescriptionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
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

  return (
    <Screen>
      {prescription.fileType === "image" ? (
        <Image source={{ uri: fileUri }} style={styles.image} resizeMode="cover" />
      ) : null}

      <View style={styles.headerRow}>
        <Text style={typography.h2} numberOfLines={1}>{prescription.originalName}</Text>
        <Badge status={prescription.status} />
      </View>
      <Text style={typography.caption}>
        Uploaded {new Date(prescription.createdAt).toLocaleDateString()}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {prescription.medicines?.length === 0 || prescription.status === "processing" ? null : (
        <Button
          title={prescription.medicines?.some((m) => !m.aiAnalyzedAt) ? "Analyze with AI" : "Re-analyze with AI"}
          onPress={handleAnalyze}
          loading={analyzing}
          style={styles.spacedTop}
        />
      )}

      {aiSummary ? (
        <Card style={styles.spacedTop}>
          <Text style={typography.h3}>Summary</Text>
          <Text style={[typography.body, styles.spacedTopSm]}>{aiSummary}</Text>
        </Card>
      ) : null}

      <Text style={[typography.h3, styles.spacedTop]}>Medicines</Text>
      {(prescription.medicines || []).length === 0 ? (
        <Text style={typography.bodyMuted}>No medicines extracted yet.</Text>
      ) : (
        prescription.medicines.map((med) => (
          <Card key={med._id} style={styles.medCard}>
            <View style={styles.medHeaderRow}>
              <Text style={typography.h3} numberOfLines={1}>{med.name}</Text>
              {med.needsReview && !med.confirmedByUser ? <Badge status="needs_review" label="Review" /> : null}
            </View>
            <Text style={typography.caption}>
              {[med.dosage, med.frequency, med.instructions].filter(Boolean).join(" · ") || "No details extracted"}
            </Text>
            {med.aiAnalysis ? (
              <View style={styles.spacedTopSm}>
                {med.aiAnalysis.summary ? <Text style={typography.body}>{med.aiAnalysis.summary}</Text> : null}
              </View>
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
          <Text style={[typography.h3, styles.spacedTop]}>Drug interactions</Text>
          {prescription.interactions.map((interaction, idx) => (
            <Card key={idx} style={styles.interactionCard}>
              <View style={styles.medHeaderRow}>
                <Text style={typography.body}>
                  {interaction.medicineA} + {interaction.medicineB}
                </Text>
                <Badge status={interaction.severity} />
              </View>
              <Text style={[typography.bodyMuted, styles.spacedTopSm]}>{interaction.description}</Text>
            </Card>
          ))}
        </>
      ) : null}

      {prescription.aiDoctorNotes ? (
        <Card style={styles.spacedTop}>
          <Text style={typography.h3}>Doctor's notes</Text>
          <Text style={[typography.body, styles.spacedTopSm]}>{prescription.aiDoctorNotes}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { width: "100%", height: 200, borderRadius: radii.md, marginBottom: spacing.lg },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  error: { color: colors.alert[400], marginTop: spacing.sm, fontSize: 13 },
  spacedTop: { marginTop: spacing.lg },
  spacedTopSm: { marginTop: spacing.xs },
  medCard: { marginTop: spacing.sm },
  medHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  viewButton: { alignSelf: "flex-start", paddingHorizontal: 0, marginTop: spacing.xs },
  interactionCard: { marginTop: spacing.sm, borderColor: "rgba(244,63,94,0.25)" },
});
