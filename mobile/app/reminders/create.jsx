import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/themed/Screen";
import Card from "../../components/ui/themed/Card";
import TextField from "../../components/ui/themed/TextField";
import Button from "../../components/ui/themed/Button";
import SelectField from "../../components/ui/themed/SelectField";
import TimePickerField from "../../components/ui/themed/TimePickerField";
import DatePickerField from "../../components/ui/themed/DatePickerField";
import ReminderMedicinePicker from "../../components/ReminderMedicinePicker";
import NotificationPermissionBanner from "../../components/NotificationPermissionBanner";
import reminderApi from "../../services/reminderApi";
import medicineApi from "../../services/medicineApi";
import { getErrorMessage } from "../../services/api";
import { syncReminder } from "../../services/notificationScheduler";
import useNotificationPermission from "../../hooks/useNotificationPermission";
import { todayDateString, dateStringToDate, isDateBefore } from "../../utils/dateUtils";
import { useTheme } from "../../context/ThemeContext";
import useThemedHeader from "../../hooks/useThemedHeader";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * PART 4 — redesigned Add Reminder flow. Same underlying functionality
 * as before: medicine selection from My Medicines (or manual entry),
 * dosage, multiple reminder times, start/end dates, and the same
 * reminderApi.create() + syncReminder() calls. Only the visual layer and
 * step-like grouping changed.
 */
export default function CreateReminderScreen() {
  const { theme } = useTheme();
  useThemedHeader();
  const router = useRouter();
  const [medicines, setMedicines] = useState([]);
  const [medicinesLoading, setMedicinesLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [times, setTimes] = useState([""]);
  // Backend already supports startDate/endDate on a reminder (startDate
  // defaults to today, endDate is optional/open-ended) — reusing the
  // same reminderApi.create() payload as before.
  const [startDate, setStartDate] = useState(todayDateString());
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const notificationPermission = useNotificationPermission();

  const loadMedicines = useCallback(async () => {
    setMedicinesLoading(true);
    try {
      const data = await medicineApi.list();
      setMedicines(data.medicines || []);
    } catch {
      // Non-fatal — the picker just falls back to an empty list; manual
      // entry (below) still works if this fails.
      setMedicines([]);
    } finally {
      setMedicinesLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMedicines();
    }, [loadMedicines])
  );

  const selectMedicine = (item) => {
    setSelectedMedicine(item);
    setMedicineName(item.name || "");
    setDosage(item.dosage || "");
    setPickerVisible(false);
  };

  const switchToManual = () => {
    setSelectedMedicine(null);
    setMedicineName("");
    setDosage("");
    setManualEntry(true);
  };

  const switchToPicker = () => {
    setManualEntry(false);
    setSelectedMedicine(null);
    setMedicineName("");
    setDosage("");
  };

  const updateTime = (idx, value) => {
    setTimes((prev) => prev.map((t, i) => (i === idx ? value : t)));
  };
  const addTimeSlot = () => setTimes((prev) => [...prev, ""]);
  const removeTimeSlot = (idx) => setTimes((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setError("");
    if (!medicineName.trim()) {
      setError(manualEntry ? "Medicine name is required." : "Select a medicine, or enter one manually.");
      return;
    }
    const cleanTimes = times.map((t) => t.trim()).filter(Boolean);
    if (cleanTimes.length === 0) {
      setError("Add at least one reminder time.");
      return;
    }
    if (!cleanTimes.every((t) => TIME_RE.test(t))) {
      setError("Pick a valid time for every reminder slot.");
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
      if (notificationPermission.status === "undetermined") {
        await notificationPermission.request();
      }
      const { reminder } = await reminderApi.create({
        medicineName: medicineName.trim(),
        dosage: dosage.trim() || undefined,
        times: cleanTimes,
        startDate,
        endDate: endDate || undefined,
        channels: { email: true, browser: true, whatsapp: false },
      });
      // Schedule the on-device notification(s) — additive to, and
      // independent of, the backend's email reminder for this same
      // reminder. Non-fatal if it fails (e.g. permission denied); the
      // reminder itself is already saved and email delivery is unaffected.
      try {
        if (reminder) await syncReminder(reminder);
      } catch {
        // Ignore — email reminder still works.
      }
      router.back();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>New reminder</Text>
      <Text style={[styles.subheading, { color: theme.colors.textSecondary }]}>
        Reminders are delivered by email at the scheduled time — this works even when the app is
        closed. You'll also get an app notification if it's enabled below.
      </Text>

      <View style={styles.spacedTopSm}>
        <NotificationPermissionBanner
          status={notificationPermission.status}
          onRequest={notificationPermission.request}
          onOpenSettings={notificationPermission.openSettings}
        />
      </View>

      <Card style={styles.spacedTop}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>MEDICINE</Text>
        {manualEntry ? (
          <>
            <TextField value={medicineName} onChangeText={setMedicineName} placeholder="e.g. Metformin" />
            <Pressable onPress={switchToPicker} style={styles.switchLink}>
              <Ionicons name="list" size={14} color={theme.colors.primary} />
              <Text style={[styles.switchLinkText, { color: theme.colors.primary }]}>Choose from My Medicines instead</Text>
            </Pressable>
          </>
        ) : (
          <>
            <SelectField
              icon={<Ionicons name="medical-outline" size={18} color={theme.colors.primary} />}
              value={selectedMedicine ? selectedMedicine.name : ""}
              placeholder="Select a medicine"
              onPress={() => setPickerVisible(true)}
            />
            <Pressable onPress={switchToManual} style={styles.switchLink}>
              <Ionicons name="create-outline" size={14} color={theme.colors.primary} />
              <Text style={[styles.switchLinkText, { color: theme.colors.primary }]}>Enter manually instead</Text>
            </Pressable>
          </>
        )}

        <View style={styles.spacedTopSm}>
          <TextField label="Dosage (optional)" value={dosage} onChangeText={setDosage} placeholder="e.g. 500mg" />
        </View>
      </Card>

      <Card style={styles.spacedTop}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>REMINDER TIMES</Text>
        {times.map((t, idx) => (
          <View key={idx} style={styles.timeRow}>
            <View style={styles.timeInput}>
              <TimePickerField value={t} onChange={(v) => updateTime(idx, v)} />
            </View>
            {times.length > 1 ? (
              <Pressable
                onPress={() => removeTimeSlot(idx)}
                style={[styles.removeButton, { backgroundColor: theme.colors.elevatedSurface, borderColor: theme.colors.border }]}
              >
                <Ionicons name="close" size={18} color={theme.colors.error} />
              </Pressable>
            ) : null}
          </View>
        ))}
        <Pressable onPress={addTimeSlot} style={styles.addTimeButton}>
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

      <Button title="Save reminder" onPress={handleSave} loading={saving} style={styles.spacedTop} />

      <ReminderMedicinePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        medicines={medicines}
        loading={medicinesLoading}
        onSelect={selectMedicine}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: "700" },
  subheading: { fontSize: 13.5, marginTop: 6, lineHeight: 19 },
  spacedTop: { marginTop: 16 },
  spacedTopSm: { marginTop: 10 },
  sectionLabel: { fontSize: 11.5, fontWeight: "700", letterSpacing: 0.5, marginBottom: 12 },
  switchLink: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, marginBottom: 6, alignSelf: "flex-start" },
  switchLinkText: { fontWeight: "600", fontSize: 12.5 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeInput: { flex: 1, marginBottom: 12 },
  removeButton: { width: 40, height: 50, marginBottom: 12, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1.5 },
  addTimeButton: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  addTimeText: { fontWeight: "600", fontSize: 13.5 },
  hint: { fontSize: 12, marginTop: -6 },
  error: { fontSize: 13, marginTop: 14, fontWeight: "600" },
});
