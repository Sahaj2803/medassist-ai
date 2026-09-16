import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/ui/themed/Screen";
import Card from "../components/ui/themed/Card";
import TextField from "../components/ui/themed/TextField";
import Button from "../components/ui/themed/Button";
import useThemedHeader from "../hooks/useThemedHeader";
import authApi from "../services/authApi";
import { getErrorMessage } from "../services/api";
import { useTheme } from "../context/ThemeContext";

const APPEARANCE_OPTIONS = [
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Dark", icon: "moon-outline" },
  { value: "system", label: "System", icon: "phone-portrait-outline" },
];

export default function SettingsScreen() {
  useThemedHeader();
  const { theme, mode, setThemeMode } = useTheme();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

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
      <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>APPEARANCE</Text>
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Theme</Text>
        <Text style={[styles.cardHint, { color: theme.colors.textSecondary }]}>
          Choose how MedAssist looks on this device.
        </Text>
        <View style={styles.appearanceRow}>
          {APPEARANCE_OPTIONS.map((opt) => {
            const active = mode === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setThemeMode(opt.value)}
                style={[
                  styles.appearanceOption,
                  {
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                    backgroundColor: active ? `${theme.colors.primary}12` : theme.colors.inputBackground,
                  },
                ]}
              >
                <Ionicons name={opt.icon} size={20} color={active ? theme.colors.primary : theme.colors.textSecondary} />
                <Text style={[styles.appearanceLabel, { color: active ? theme.colors.primary : theme.colors.textPrimary }]}>
                  {opt.label}
                </Text>
                {active ? <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Text style={[styles.sectionLabel, styles.spacedTop, { color: theme.colors.textSecondary }]}>NOTIFICATIONS</Text>
      <Card style={styles.card}>
        <View style={styles.notifRow}>
          <View style={[styles.notifIconBox, { backgroundColor: `${theme.colors.teal}17` }]}>
            <Ionicons name="mail-outline" size={18} color={theme.colors.teal} />
          </View>
          <Text style={[styles.notifText, styles.flex1, { color: theme.colors.textPrimary }]}>
            Medicine reminders are sent to your email at the scheduled time.
          </Text>
        </View>
      </Card>

      <Text style={[styles.sectionLabel, styles.spacedTop, { color: theme.colors.textSecondary }]}>SECURITY</Text>
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Change password</Text>
        <View style={styles.spacedTopSm}>
          <TextField
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            isPassword
          />
          <TextField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            isPassword
            placeholder="At least 8 characters"
          />
        </View>
        {pwError ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{pwError}</Text> : null}
        {pwSuccess ? <Text style={[styles.successText, { color: theme.colors.success }]}>Password updated.</Text> : null}
        <Button title="Update password" onPress={handleChangePassword} loading={savingPw} />
      </Card>

      <Text style={[styles.sectionLabel, styles.spacedTop, { color: theme.colors.textSecondary }]}>ABOUT</Text>
      <Card style={styles.card}>
        <View style={styles.notifRow}>
          <View style={[styles.notifIconBox, { backgroundColor: `${theme.colors.primary}17` }]}>
            <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
          </View>
          <Text style={[styles.notifText, styles.flex1, { color: theme.colors.textSecondary }]}>
            MedAssist Mobile · v1.0.0
          </Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6, marginBottom: 8, marginLeft: 2 },
  card: { padding: 16 },
  spacedTop: { marginTop: 20 },
  spacedTopSm: { marginTop: 8, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardHint: { fontSize: 13, marginTop: 4, marginBottom: 4, lineHeight: 18 },
  appearanceRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  appearanceOption: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  appearanceLabel: { fontSize: 13, fontWeight: "600" },
  notifRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  notifIconBox: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  notifText: { fontSize: 14, lineHeight: 20 },
  flex1: { flex: 1 },
  errorText: { fontSize: 13, marginBottom: 8, fontWeight: "500" },
  successText: { fontSize: 13, marginBottom: 8, fontWeight: "500" },
});
