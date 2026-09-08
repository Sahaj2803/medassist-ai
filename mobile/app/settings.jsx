import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/ui/Screen";
import Card from "../components/ui/Card";
import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";
import useAuth from "../hooks/useAuth";
import authApi from "../services/authApi";
import { getErrorMessage } from "../services/api";
import { SUPPORTED_LANGUAGES } from "../constants/config";
import { colors, typography, spacing, radii } from "../constants/theme";

export default function SettingsScreen() {
  const { user, updateProfile } = useAuth();
  const [language, setLanguage] = useState(user?.preferredLanguage || "en");
  const [savingLanguage, setSavingLanguage] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleLanguageChange = async (code) => {
    setLanguage(code);
    setSavingLanguage(true);
    try {
      await updateProfile({ preferredLanguage: code });
    } catch {
      // Non-fatal — the selection still reflects locally; retry happens
      // next time updateProfile is called (e.g. on the Profile screen).
    } finally {
      setSavingLanguage(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError("");
    setPwSuccess(false);
    if (!currentPassword || !newPassword) {
      setPwError("Both fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    setSavingPw(true);
    try {
      await authApi.updatePassword({ currentPassword, newPassword });
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch (e) {
      setPwError(getErrorMessage(e));
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={typography.h3}>Language</Text>
        <Text style={[typography.bodyMuted, styles.spacedTopSm]}>
          Used for AI explanations, summaries, and this app's interface.
        </Text>
        <View style={styles.languageRow}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => handleLanguageChange(lang.code)}
              style={[styles.langChip, language === lang.code && styles.langChipActive]}
            >
              <Text style={[styles.langChipText, language === lang.code && styles.langChipTextActive]}>
                {lang.label}
              </Text>
              {savingLanguage && language === lang.code ? (
                <Ionicons name="ellipsis-horizontal" size={14} color={colors.signal[400]} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={styles.spacedTop}>
        <Text style={typography.h3}>Notifications</Text>
        <View style={styles.notifRow}>
          <Ionicons name="mail-outline" size={18} color={colors.signal[400]} />
          <Text style={[typography.body, styles.flex1]}>
            Medicine reminders are sent to your email at the scheduled time.
          </Text>
        </View>
      </Card>

      <Card style={styles.spacedTop}>
        <Text style={typography.h3}>Change password</Text>
        <View style={styles.spacedTopSm}>
          <TextField
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <TextField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="At least 8 characters"
          />
        </View>
        {pwError ? <Text style={styles.error}>{pwError}</Text> : null}
        {pwSuccess ? <Text style={styles.success}>Password updated.</Text> : null}
        <Button title="Update password" onPress={handleChangePassword} loading={savingPw} />
      </Card>

      <Text style={styles.footer}>MedAssist Mobile · v1.0.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  spacedTop: { marginTop: spacing.lg },
  spacedTopSm: { marginTop: spacing.xs, marginBottom: spacing.sm },
  languageRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  langChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.graphite[600],
    backgroundColor: colors.ink[900],
  },
  langChipActive: { borderColor: colors.signal[500], backgroundColor: "rgba(45,212,191,0.12)" },
  langChipText: { color: colors.mist[300], fontSize: 13, fontWeight: "600" },
  langChipTextActive: { color: colors.signal[400] },
  notifRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", marginTop: spacing.sm },
  flex1: { flex: 1 },
  error: { color: colors.alert[400], fontSize: 13, marginBottom: spacing.sm },
  success: { color: colors.success, fontSize: 13, marginBottom: spacing.sm },
  footer: { ...typography.caption, textAlign: "center", marginTop: spacing.xxl },
});
