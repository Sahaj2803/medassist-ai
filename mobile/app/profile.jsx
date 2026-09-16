import { useState } from "react";
import { View, Text, StyleSheet, Alert, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/ui/themed/Screen";
import Card from "../components/ui/themed/Card";
import TextField from "../components/ui/themed/TextField";
import Button from "../components/ui/themed/Button";
import LanguagePickerModal from "../components/LanguagePickerModal";
import useAuth from "../hooks/useAuth";
import useThemedHeader from "../hooks/useThemedHeader";
import { getErrorMessage } from "../services/api";
import { SUPPORTED_LANGUAGES } from "../constants/config";
import { useTheme } from "../context/ThemeContext";

function ProfileRow({ icon, iconColor, label, value, onPress, danger }) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}>
      <View style={[styles.rowIconBox, { backgroundColor: `${iconColor || theme.colors.primary}17` }]}>
        <Ionicons name={icon} size={18} color={iconColor || theme.colors.primary} />
      </View>
      <View style={styles.flex1}>
        <Text style={[styles.rowLabel, { color: danger ? theme.colors.error : theme.colors.textPrimary }]}>{label}</Text>
        {value ? <Text style={[styles.rowValue, { color: theme.colors.textSecondary }]}>{value}</Text> : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} /> : null}
    </Pressable>
  );
}

export default function ProfileScreen() {
  useThemedHeader();
  const { theme } = useTheme();
  const { user, updateProfile, logout } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Reuses the same preferredLanguage field + updateProfile() call that
  // Settings already uses, so both screens stay in sync automatically —
  // no second language system, no separate persistence path.
  const [language, setLanguage] = useState(user?.preferredLanguage || "en");
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);
  const [savingLanguageCode, setSavingLanguageCode] = useState(null);
  const [languageError, setLanguageError] = useState("");

  const currentLanguageLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label || language;

  const handleLanguageSelect = async (code) => {
    if (code === language) {
      setLanguagePickerVisible(false);
      return;
    }
    setLanguageError("");
    setSavingLanguageCode(code);
    try {
      await updateProfile({ preferredLanguage: code });
      setLanguage(code);
      setLanguagePickerVisible(false);
    } catch (e) {
      setLanguageError(getErrorMessage(e));
    } finally {
      setSavingLanguageCode(null);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess(false);
    if (!name.trim()) {
      setError("Name can't be empty.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() || undefined });
      setSuccess(true);
      setEditing(false);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setError("");
    setEditing(false);
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <Screen>
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="person" size={32} color="#FFFFFF" />
        </View>
        <Text style={[styles.name, { color: theme.colors.textPrimary }]}>{user?.name}</Text>
        <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{user?.email}</Text>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>ACCOUNT</Text>
      <Card style={styles.card}>
        {!editing ? (
          <>
            <ProfileRow
              icon="person-outline"
              label="Personal information"
              value={phone || "Add your phone number"}
              onPress={() => setEditing(true)}
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <ProfileRow
              icon="language-outline"
              iconColor={theme.colors.teal}
              label="Language"
              value={savingLanguageCode ? "Saving..." : currentLanguageLabel}
              onPress={() => setLanguagePickerVisible(true)}
            />
          </>
        ) : (
          <View>
            <Text style={[styles.editTitle, { color: theme.colors.textPrimary }]}>Edit profile</Text>
            <View style={styles.spacedTopSm}>
              <TextField label="Name" value={name} onChangeText={setName} placeholder="Full name" />
              <TextField label="Phone" value={phone} onChangeText={setPhone} placeholder="+91..." keyboardType="phone-pad" />
            </View>
            {error ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text> : null}
            <View style={styles.editActions}>
              <Button title="Cancel" variant="secondary" onPress={handleCancelEdit} style={styles.flex1} />
              <Button title="Save" onPress={handleSave} loading={saving} style={styles.flex1} />
            </View>
          </View>
        )}
        {languageError ? <Text style={[styles.errorText, styles.spacedTopSm, { color: theme.colors.error }]}>{languageError}</Text> : null}
      </Card>
      {success ? <Text style={[styles.successText, { color: theme.colors.success }]}>Profile updated.</Text> : null}

      <Text style={[styles.sectionLabel, styles.spacedTop, { color: theme.colors.textSecondary }]}>PREFERENCES</Text>
      <Card style={styles.card}>
        <ProfileRow
          icon="color-palette-outline"
          iconColor={theme.colors.purple}
          label="Appearance"
          value="Light, dark, or system"
          onPress={() => router.push("/settings")}
        />
      </Card>

      <Text style={[styles.sectionLabel, styles.spacedTop, { color: theme.colors.textSecondary }]}>SECURITY</Text>
      <Card style={styles.card}>
        <ProfileRow
          icon="lock-closed-outline"
          iconColor={theme.colors.orange}
          label="Change password"
          onPress={() => router.push("/settings")}
        />
      </Card>

      <Text style={[styles.sectionLabel, styles.spacedTop, { color: theme.colors.textSecondary }]}>OTHER</Text>
      <Card style={styles.card}>
        <ProfileRow icon="settings-outline" label="Settings" onPress={() => router.push("/settings")} />
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <ProfileRow icon="log-out-outline" iconColor={theme.colors.error} danger label="Log out" onPress={handleLogout} />
      </Card>

      <LanguagePickerModal
        visible={languagePickerVisible}
        onClose={() => setLanguagePickerVisible(false)}
        selectedCode={language}
        savingCode={savingLanguageCode}
        onSelect={handleLanguageSelect}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarSection: { alignItems: "center", marginTop: 8, marginBottom: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  name: { fontSize: 20, fontWeight: "700" },
  email: { fontSize: 14, marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6, marginBottom: 8, marginLeft: 2 },
  card: { padding: 6 },
  spacedTop: { marginTop: 20 },
  spacedTopSm: { marginTop: 8, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 10 },
  rowPressed: { opacity: 0.7 },
  rowIconBox: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 15, fontWeight: "600" },
  rowValue: { fontSize: 12.5, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 10 },
  flex1: { flex: 1 },
  editTitle: { fontSize: 16, fontWeight: "700", paddingHorizontal: 4 },
  editActions: { flexDirection: "row", gap: 10, marginTop: 4, paddingHorizontal: 4, paddingBottom: 4 },
  errorText: { fontSize: 13, marginBottom: 8, paddingHorizontal: 4, fontWeight: "500" },
  successText: { fontSize: 13, marginTop: 8, textAlign: "center", fontWeight: "500" },
});
