import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, Switch, Alert } from "react-native";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/themed/Screen";
import Card from "../../components/ui/themed/Card";
import TextField from "../../components/ui/themed/TextField";
import Button from "../../components/ui/themed/Button";
import TimePickerField from "../../components/ui/themed/TimePickerField";
import DatePickerField from "../../components/ui/themed/DatePickerField";
import { Loading, ErrorState } from "../../components/ui/themed/States";
import NotificationPermissionBanner from "../../components/NotificationPermissionBanner";
import reminderApi from "../../services/reminderApi";
import { getErrorMessage } from "../../services/api";
import { syncReminder, cancelReminder } from "../../services/notificationScheduler";
import useNotificationPermission from "../../hooks/useNotificationPermission";
import { dateStringToDate, isDateBefore, normalizeDateString } from "../../utils/dateUtils";
import { useTheme } from "../../context/ThemeContext";
import useThemedHeader from "../../hooks/useThemedHeader";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * PART 4 — redesigned Reminder detail/edit screen. Preserves every
 * existing behavior: edit, save, delete, active toggle, time/date
 * changes, and — critically — notification re-sync (syncReminder /
 * cancelReminder) after any change. Only the visual layer changed.
 */
export default function ReminderDetailScreen() {
  const { theme } = useTheme();
  useThemedHeader();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [reminder, setReminder] = useState(null);
  const [times, setTimes] = useState([]);
  const [dosage, setDosage] = useState("");
  const [active, setActive] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const notificationPermission = useNotificationPermission();

  const load = useCallback(async () => {
    try {
      const { reminders } = await reminderApi.list();
      const found = (reminders || []).find((r) => r._id === id);
      if (!found) throw new Error("Reminder not found");
      setReminder(found);
      setTimes(found.times || []);
      setDosage(found.dosage || "");
      setActive(found.active);
      // Normalize whatever date shape the backend returns (date-only or
      // full ISO timestamp) down to the same "YYYY-MM-DD" the date picker
      // and Create screen use — see utils/dateUtils.js.
      setStartDate(normalizeDateString(found.startDate));
      setEndDate(normalizeDateString(found.endDate));
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
    if (!startDate) {
      setError("Pick a start date.");
      return;
    }
    if (endDate && isDateBefore(dateStringToDate(endDate), dateStringToDate(startDate))) {
      setError("End date can't be before the start date.");
      return;
    }
    setSaving(true);
    try {
      const { reminder: updated } = await reminderApi.update(id, {
        times: cleanTimes,
        dosage: dosage.trim() || undefined,
        active,
        startDate,
        // Explicit null (not just omitted) so clearing a previously-set
        // end date actually clears it server-side.
        endDate: endDate || null,
      });
      setReminder(updated);
      setTimes(updated.times);
      setStartDate(normalizeDateString(updated.startDate) || startDate);
      setEndDate(normalizeDateString(updated.endDate));
      // Cancels whatever was previously scheduled for this reminder and
      // schedules fresh notifications for the new times/active state —
      // never duplicates the old ones. Non-fatal if it fails; email
      // reminders (backend-side) are unaffected either way.
      try {
        await syncReminder(updated);
      } catch {
        // Ignore.
      }
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
            try {
              await cancelReminder(id);
            } catch {
              // Ignore — no orphan should remain since the map entry is
              // simply stale at that point, not re-created.
            }
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
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>{reminder.medicineName}</Text>

      <View style={styles.spacedTop}>
        <NotificationPermissionBanner
          status={notificationPermission.status}
          onRequest={notificationPermission.request}
          onOpenSettings={notificationPermission.openSettings}
        />
      </View>

      <Card variant="elevated" style={styles.spacedTop}>
        <View style={styles.toggleRow}>
          <View>
            <Text style={[styles.toggleLabel, { color: theme.colors.textPrimary }]}>Active</Text>
            <Text style={[styles.toggleHint, { color: theme.colors.textSecondary }]}>
              Turn off to pause reminders without deleting them.
            </Text>
          </View>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{ true: theme.colors.teal, false: theme.colors.border }}
            thumbColor="#FFFFFF"
          />
        </View>
      </Card>

      <Card style={styles.spacedTop}>
        <TextField label="Dosage" value={dosage} onChangeText={setDosage} placeholder="e.g. 500mg" />

        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>REMINDER TIMES</Text>
        {times.map((t, idx) => (
          <View key={idx} style={styles.timeRow}>
            <View style={styles.timeInput}>
              <TimePickerField value={t} onChange={(v) => updateTime(idx, v)} />
            </View>
            {times.length > 1 ? (
              <Pressable
                onPress={() => removeTime(idx)}
                style={[styles.removeButton, { backgroundColor: theme.colors.elevatedSurface, borderColor: theme.colors.border }]}
              >
                <Ionicons name="close" size={18} color={theme.colors.error} />
              </Pressable>
            ) : null}
          </View>
        ))}
        <Pressable onPress={addTime} style={styles.addTimeButton}>
          <Ionicons name="add" size={16} color={theme.colors.primary} />
          <Text style={[styles.addTimeText, { color: theme.colors.primary }]}>Add another time</Text>
        </Pressable>
      </Card>

      <Card style={styles.spacedTop}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>START / END DATE</Text>
        <DatePickerField label="Start date" value={startDate} onChange={setStartDate} />
        <DatePickerField
          label="End date (optional)"
          value={endDate}
          onChange={setEndDate}
          onClear={() => setEndDate("")}
          placeholder="No end date"
          minimumDate={dateStringToDate(startDate) || undefined}
        />
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>Leave empty to keep this reminder ongoing.</Text>
      </Card>

      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

      <Button title="Save changes" onPress={handleSave} loading={saving} style={styles.spacedTop} />
      <Button title="Delete reminder" variant="danger" onPress={handleDelete} loading={deleting} style={styles.spacedTopSm} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: "700" },
  spacedTop: { marginTop: 16 },
  spacedTopSm: { marginTop: 10 },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  toggleLabel: { fontSize: 15, fontWeight: "600" },
  toggleHint: { fontSize: 12, marginTop: 2, maxWidth: 220 },
  sectionLabel: { fontSize: 11.5, fontWeight: "700", letterSpacing: 0.5, marginTop: 16, marginBottom: 12 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeInput: { flex: 1, marginBottom: 12 },
  removeButton: { width: 40, height: 50, marginBottom: 12, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1.5 },
  addTimeButton: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  addTimeText: { fontWeight: "600", fontSize: 13.5 },
  hint: { fontSize: 12, marginTop: -6 },
  error: { fontSize: 13, marginTop: 14, fontWeight: "600" },
});
