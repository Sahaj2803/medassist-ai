import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, Switch, Alert } from "react-native";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/Screen";
import Card from "../../components/ui/Card";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";
import { Loading, ErrorState } from "../../components/ui/States";
import reminderApi from "../../services/reminderApi";
import { getErrorMessage } from "../../services/api";
import { colors, typography, spacing, radii } from "../../constants/theme";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function ReminderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [reminder, setReminder] = useState(null);
  const [times, setTimes] = useState([]);
  const [dosage, setDosage] = useState("");
  const [active, setActive] = useState(true);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { reminders } = await reminderApi.list();
      const found = (reminders || []).find((r) => r._id === id);
      if (!found) throw new Error("Reminder not found");
      setReminder(found);
      setTimes(found.times || []);
      setDosage(found.dosage || "");
      setActive(found.active);
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

  const updateTime = (idx, value) => setTimes((prev) => prev.map((t, i) => (i === idx ? value : t)));
  const removeTime = (idx) => setTimes((prev) => prev.filter((_, i) => i !== idx));
  const addTime = () => setTimes((prev) => [...prev, ""]);

  const handleSave = async () => {
    setError("");
    const cleanTimes = times.map((t) => t.trim()).filter(Boolean);
    if (cleanTimes.length === 0) {
      setError("Add at least one reminder time.");
      return;
    }
    if (!cleanTimes.every((t) => TIME_RE.test(t))) {
      setError("Times must be in 24-hour HH:mm format.");
      return;
    }
    setSaving(true);
    try {
      const { reminder: updated } = await reminderApi.update(id, {
        times: cleanTimes,
        dosage: dosage.trim() || undefined,
        active,
      });
      setReminder(updated);
      setTimes(updated.times);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete reminder", "This can't be undone. Delete this reminder?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await reminderApi.remove(id);
            router.back();
          } catch (e) {
            setError(getErrorMessage(e));
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (state === "loading") return <Screen><Loading /></Screen>;
  if (state === "error") return <Screen><ErrorState message={error} onRetry={load} /></Screen>;

  return (
    <Screen>
      <Text style={typography.h1}>{reminder.medicineName}</Text>

      <Card style={styles.spacedTop}>
        <View style={styles.toggleRow}>
          <Text style={typography.body}>Active</Text>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{ true: colors.signal[600], false: colors.graphite[600] }}
            thumbColor={colors.white}
          />
        </View>
      </Card>

      <View style={styles.spacedTop}>
        <TextField label="Dosage" value={dosage} onChangeText={setDosage} placeholder="e.g. 500mg" />

        <Text style={styles.label}>Reminder times</Text>
        {times.map((t, idx) => (
          <View key={idx} style={styles.timeRow}>
            <View style={styles.timeInput}>
              <TextField value={t} onChangeText={(v) => updateTime(idx, v)} placeholder="HH:mm" />
            </View>
            {times.length > 1 ? (
              <Pressable onPress={() => removeTime(idx)} style={styles.removeButton}>
                <Ionicons name="close" size={18} color={colors.alert[400]} />
              </Pressable>
            ) : null}
          </View>
        ))}
        <Pressable onPress={addTime} style={styles.addTimeButton}>
          <Ionicons name="add" size={16} color={colors.signal[400]} />
          <Text style={styles.addTimeText}>Add another time</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Save changes" onPress={handleSave} loading={saving} style={styles.spacedTop} />
        <Button title="Delete reminder" variant="danger" onPress={handleDelete} loading={deleting} style={styles.spacedTop} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  spacedTop: { marginTop: spacing.lg },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
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
