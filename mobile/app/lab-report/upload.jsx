import { useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/themed/Screen";
import Card from "../../components/ui/themed/Card";
import Button from "../../components/ui/themed/Button";
import useThemedHeader from "../../hooks/useThemedHeader";
import { useTheme } from "../../context/ThemeContext";
import labReportApi from "../../services/labReportApi";
import { getErrorMessage } from "../../services/api";

export default function UploadLabReportScreen() {
  useThemedHeader();
  const router = useRouter();
  const { theme } = useTheme();
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
      <Text style={[styles.intro, { color: theme.colors.textSecondary }]}>
        Upload a photo or file of your lab report. MedAssist's AI will extract the test
        results and explain what they mean.
      </Text>

      {asset ? (
        <Card style={styles.previewCard}>
          {isPdf ? (
            <View style={styles.pdfPreview}>
              <View style={[styles.pdfIconWrap, { backgroundColor: `${theme.colors.primary}17` }]}>
                <Ionicons name="document" size={32} color={theme.colors.primary} />
              </View>
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
          <Pressable
            style={[styles.pickerTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={pickFromCamera}
          >
            <View style={[styles.pickerIconWrap, { backgroundColor: `${theme.colors.teal}17` }]}>
              <Ionicons name="camera" size={24} color={theme.colors.teal} />
            </View>
            <Text style={[styles.pickerLabel, { color: theme.colors.textPrimary }]}>Camera</Text>
          </Pressable>
          <Pressable
            style={[styles.pickerTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={pickFromGallery}
          >
            <View style={[styles.pickerIconWrap, { backgroundColor: `${theme.colors.teal}17` }]}>
              <Ionicons name="images" size={24} color={theme.colors.teal} />
            </View>
            <Text style={[styles.pickerLabel, { color: theme.colors.textPrimary }]}>Gallery</Text>
          </Pressable>
          <Pressable
            style={[styles.pickerTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={pickFromFiles}
          >
            <View style={[styles.pickerIconWrap, { backgroundColor: `${theme.colors.teal}17` }]}>
              <Ionicons name="folder" size={24} color={theme.colors.teal} />
            </View>
            <Text style={[styles.pickerLabel, { color: theme.colors.textPrimary }]}>Files</Text>
          </Pressable>
        </View>
      )}

      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

      {uploading ? (
        <View style={styles.uploadingBox}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={[styles.uploadingText, { color: theme.colors.textSecondary }]}>
            Uploading{progress ? ` · ${progress}%` : "..."}
          </Text>
        </View>
      ) : (
        <Button title="Upload lab report" onPress={handleUpload} disabled={!asset} style={styles.spacedTop} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 14, lineHeight: 20 },
  pickerGrid: { flexDirection: "row", gap: 12, marginTop: 24 },
  pickerTile: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
  },
  pickerIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  pickerLabel: { fontWeight: "600", fontSize: 13 },
  previewCard: { marginTop: 24, gap: 10 },
  previewImage: { width: "100%", height: 220, borderRadius: 14 },
  pdfPreview: { alignItems: "center", gap: 10, paddingVertical: 24 },
  pdfIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  pdfName: { fontSize: 14, fontWeight: "600" },
  error: { marginTop: 14, fontSize: 13 },
  uploadingBox: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24, justifyContent: "center" },
  uploadingText: { fontSize: 14 },
  spacedTop: { marginTop: 24 },
});
