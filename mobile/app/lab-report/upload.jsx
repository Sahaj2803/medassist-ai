import { useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/Screen";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import labReportApi from "../../services/labReportApi";
import { getErrorMessage } from "../../services/api";
import { colors, typography, spacing, radii } from "../../constants/theme";

export default function UploadLabReportScreen() {
  const router = useRouter();
  const [asset, setAsset] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const pickFromCamera = async () => {
    setError("");
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError("Camera permission is needed. You can still use the gallery or file picker below.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!result.canceled) setAsset(result.assets[0]);
  };

  const pickFromGallery = async () => {
    setError("");
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Photo library permission is needed. You can still use the file picker below.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
    if (!result.canceled) setAsset(result.assets[0]);
  };

  const pickFromFiles = async () => {
    setError("");
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled) setAsset(result.assets[0]);
  };

  const handleUpload = async () => {
    if (!asset) return;
    setUploading(true);
    setError("");
    try {
      const { labReport } = await labReportApi.upload(asset, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
      });
      router.replace(`/lab-report/${labReport._id}`);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const isPdf = asset?.mimeType === "application/pdf" || asset?.name?.toLowerCase().endsWith(".pdf");

  return (
    <Screen>
      <Text style={typography.bodyMuted}>
        Upload a photo or file of your lab report. MedAssist's AI will extract the test
        results and explain what they mean.
      </Text>

      {asset ? (
        <Card style={styles.previewCard}>
          {isPdf ? (
            <View style={styles.pdfPreview}>
              <Ionicons name="document" size={40} color={colors.brand[400]} />
              <Text style={typography.body} numberOfLines={1}>{asset.name || "document.pdf"}</Text>
            </View>
          ) : (
            <Image source={{ uri: asset.uri }} style={styles.previewImage} resizeMode="cover" />
          )}
          <Button title="Choose a different file" variant="ghost" onPress={() => setAsset(null)} />
        </Card>
      ) : (
        <View style={styles.pickerGrid}>
          <Pressable style={styles.pickerTile} onPress={pickFromCamera}>
            <Ionicons name="camera" size={28} color={colors.signal[400]} />
            <Text style={styles.pickerLabel}>Camera</Text>
          </Pressable>
          <Pressable style={styles.pickerTile} onPress={pickFromGallery}>
            <Ionicons name="images" size={28} color={colors.signal[400]} />
            <Text style={styles.pickerLabel}>Gallery</Text>
          </Pressable>
          <Pressable style={styles.pickerTile} onPress={pickFromFiles}>
            <Ionicons name="folder" size={28} color={colors.signal[400]} />
            <Text style={styles.pickerLabel}>Files</Text>
          </Pressable>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {uploading ? (
        <View style={styles.uploadingBox}>
          <ActivityIndicator color={colors.signal[400]} />
          <Text style={typography.bodyMuted}>Uploading{progress ? ` · ${progress}%` : "..."}</Text>
        </View>
      ) : (
        <Button title="Upload lab report" onPress={handleUpload} disabled={!asset} style={styles.spacedTop} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pickerGrid: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  pickerTile: {
    flex: 1,
    backgroundColor: colors.ink[800],
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  pickerLabel: { color: colors.mist[100], fontWeight: "600", fontSize: 13 },
  previewCard: { marginTop: spacing.xl, gap: spacing.sm },
  previewImage: { width: "100%", height: 220, borderRadius: radii.md },
  pdfPreview: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  error: { color: colors.alert[400], marginTop: spacing.md, fontSize: 13 },
  uploadingBox: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xl, justifyContent: "center" },
  spacedTop: { marginTop: spacing.xl },
});
