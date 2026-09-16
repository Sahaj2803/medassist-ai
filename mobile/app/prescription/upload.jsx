import { useState } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Screen from "../../components/ui/themed/Screen";
import Card from "../../components/ui/themed/Card";
import Button from "../../components/ui/themed/Button";
import prescriptionApi from "../../services/prescriptionApi";
import { getErrorMessage } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import useThemedHeader from "../../hooks/useThemedHeader";

export default function UploadPrescriptionScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  useThemedHeader();
  const [asset, setAsset] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const pickFromCamera = async () => {
    setError("");
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError("Camera permission is needed to scan a prescription. You can still use the gallery or file picker below.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85, base64: false });
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
      const { prescription } = await prescriptionApi.upload(asset, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
      });
      router.replace(`/prescription/${prescription._id}`);
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
      <Card variant="glass" style={styles.introCard}>
        <View style={styles.introRow}>
          <View style={[styles.introIcon, { backgroundColor: `${theme.colors.primary}22` }]}>
            <Ionicons name="scan" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.flex1}>
            <Text style={[styles.introTitle, { color: theme.colors.textPrimary }]}>Scan your prescription</Text>
            <Text style={[styles.introBody, { color: theme.colors.textSecondary }]}>
              Take a photo, choose from your gallery, or pick a file. MedAssist's AI reads the medicines, dosages,
              and instructions for you.
            </Text>
          </View>
        </View>
      </Card>

      {asset ? (
        <Card style={styles.previewCard}>
          {isPdf ? (
            <View style={[styles.pdfPreview, { backgroundColor: `${theme.colors.primary}12` }]}>
              <Ionicons name="document" size={36} color={theme.colors.primary} />
              <Text style={[styles.pdfName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {asset.name || "document.pdf"}
              </Text>
            </View>
          ) : (
            <Image source={{ uri: asset.uri }} style={styles.previewImage} resizeMode="cover" />
          )}
          <Button title="Choose a different file" variant="ghost" onPress={() => setAsset(null)} />
        </Card>
      ) : (
        <View style={styles.pickerGrid}>
          <PickerTile icon="camera" label="Camera" onPress={pickFromCamera} theme={theme} />
          <PickerTile icon="images" label="Gallery" onPress={pickFromGallery} theme={theme} />
          <PickerTile icon="folder" label="Files" onPress={pickFromFiles} theme={theme} />
        </View>
      )}

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: `${theme.colors.error}14`, borderColor: `${theme.colors.error}33` }]}>
          <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      ) : null}

      {uploading ? (
        <Card style={styles.uploadingCard}>
          <Text style={[styles.uploadingTitle, { color: theme.colors.textPrimary }]}>Uploading your prescription</Text>
          <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
            <View style={[styles.progressFill, { width: `${Math.max(progress, 6)}%`, backgroundColor: theme.colors.primary }]} />
          </View>
          <Text style={[styles.uploadingCaption, { color: theme.colors.textSecondary }]}>
            {progress ? `${progress}%` : "Starting..."}
          </Text>
        </Card>
      ) : (
        <Button title="Upload prescription" onPress={handleUpload} disabled={!asset} style={styles.spacedTop} />
      )}
    </Screen>
  );
}

function PickerTile({ icon, label, onPress, theme }) {
  return (
    <Pressable style={({ pressed }) => [styles.pickerTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, pressed && { opacity: 0.85 }]} onPress={onPress}>
      <LinearGradient colors={theme.gradients.teal} style={styles.pickerIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={icon} size={22} color="#FFFFFF" />
      </LinearGradient>
      <Text style={[styles.pickerLabel, { color: theme.colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  introCard: { marginBottom: 4 },
  introRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  introIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  introTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  introBody: { fontSize: 13.5, lineHeight: 19 },
  pickerGrid: { flexDirection: "row", gap: 12, marginTop: 20 },
  pickerTile: { flex: 1, borderRadius: 18, paddingVertical: 22, alignItems: "center", gap: 10, borderWidth: 1 },
  pickerIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  pickerLabel: { fontWeight: "600", fontSize: 13 },
  previewCard: { marginTop: 20, gap: 10 },
  previewImage: { width: "100%", height: 220, borderRadius: 14 },
  pdfPreview: { alignItems: "center", gap: 8, paddingVertical: 28, borderRadius: 14 },
  pdfName: { fontSize: 14, fontWeight: "600", maxWidth: "80%" },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 16, padding: 12, borderRadius: 12, borderWidth: 1 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  uploadingCard: { marginTop: 20 },
  uploadingTitle: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4 },
  uploadingCaption: { fontSize: 12, marginTop: 8 },
  spacedTop: { marginTop: 20 },
});
