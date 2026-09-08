import { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/ui/Screen";
import Card from "../components/ui/Card";
import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";
import useAuth from "../hooks/useAuth";
import { getErrorMessage } from "../services/api";
import { colors, typography, spacing } from "../constants/theme";

export default function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
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
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={colors.white} />
        </View>
        <Text style={typography.h2}>{user?.name}</Text>
        <Text style={typography.bodyMuted}>{user?.email}</Text>
      </View>

      <Card style={styles.spacedTop}>
        <Text style={typography.h3}>Edit profile</Text>
        <View style={styles.spacedTopSm}>
          <TextField label="Name" value={name} onChangeText={setName} placeholder="Full name" />
          <TextField label="Phone" value={phone} onChangeText={setPhone} placeholder="+91..." keyboardType="phone-pad" />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>Profile updated.</Text> : null}
        <Button title="Save changes" onPress={handleSave} loading={saving} />
      </Card>

      <Card style={styles.spacedTop}>
        <Button title="Settings" variant="secondary" onPress={() => router.push("/settings")} />
      </Card>

      <Button title="Log out" variant="danger" onPress={handleLogout} style={styles.spacedTop} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarSection: { alignItems: "center", marginTop: spacing.lg },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.brand[600],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  spacedTop: { marginTop: spacing.lg },
  spacedTopSm: { marginTop: spacing.sm, marginBottom: spacing.sm },
  error: { color: colors.alert[400], fontSize: 13, marginBottom: spacing.sm },
  success: { color: colors.success, fontSize: 13, marginBottom: spacing.sm },
});
