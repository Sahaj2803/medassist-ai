import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/Screen";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";
import reminderApi from "../../services/reminderApi";
import { getErrorMessage } from "../../services/api";
import { colors, typography, spacing, radii } from "../../constants/theme";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function CreateReminderScreen() {
  const router = useRouter();
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [times, setTimes] = useState([""]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateTime = (idx, value) => {
    setTimes((prev) => prev.map((t, i) => (i === idx ? value : t)));
  };
  const addTimeSlot = () => setTimes((prev) => [...prev, ""]);
  const removeTimeSlot = (idx) => setTimes((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setError("");
    if (!medicineName.trim()) {
      setError("Medicine name is required.");
      return;
    }
    const cleanTimes = times.map((t) => t.trim()).filter(Boolean);
    if (cleanTimes.length === 0) {
      setError("Add at least one reminder time.");
      return;
    }
    if (!cleanTimes.every((t) => TIME_RE.test(t))) {
      setError("Times must be in 24-hour HH:mm format, e.g. 08:00 or 20:30.");
      return;
    }
    setSaving(true);
    try {
      await reminderApi.create({
        medicineName: medicineName.trim(),
        dosage: dosage.trim() || undefined,
        times: cleanTimes,
        channels: { email: true, browser: true, whatsapp: false },
      });
      router.back();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Text style={typography.bodyMuted}>
        Reminders are delivered by email at the scheduled time — this works even when the app is
        closed.
      </Text>

      <View style={styles.spacedTop}>
        <TextField label="Medicine name" value={medicineName} onChangeText={setMedicineName} placeholder="e.g. Metformin" />
        <TextField label="Dosage (optional)" value={dosage} onChangeText={setDosage} placeholder="e.g. 500mg" />

        <Text style={styles.label}>Reminder times</Text>
        {times.map((t, idx) => (
          <View key={idx} style={styles.timeRow}>
            <View style={styles.timeInput}>
              <TextField value={t} onChangeText={(v) => updateTime(idx, v)} placeholder="HH:mm, e.g. 08:00" />
            </View>
            {times.length > 1 ? (
              <Pressable onPress={() => removeTimeSlot(idx)} style={styles.removeButton}>
                <Ionicons name="close" size={18} color={colors.alert[400]} />
              </Pressable>
            ) : null}
          </View>
        ))}
        <Pressable onPress={addTimeSlot} style={styles.addTimeButton}>
          <Ionicons name="add" size={16} color={colors.signal[400]} />
          <Text style={styles.addTimeText}>Add another time</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Save reminder" onPress={handleSave} loading={saving} style={styles.spacedTop} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  spacedTop: { marginTop: spacing.lg },
  label: { ...typography.label, marginBottom: spacing.xs, marginTop: spacing.xs },
  timeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  timeInput: { flex: 1 },
  removeButton: {
    width: 36,
    height: 50,
    marginBottom: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink[800],
    borderRadius: radii.sm,
  },
  addTimeButton: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.md },
  addTimeText: { color: colors.signal[400], fontWeight: "600", fontSize: 13 },
  error: { color: colors.alert[400], fontSize: 13, marginBottom: spacing.sm },
});
