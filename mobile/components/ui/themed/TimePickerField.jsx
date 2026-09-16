import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import BottomSheet from "./BottomSheet";
import ThemedButton from "./Button";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Same "HH:mm" <-> Date contract as components/ui/TimePickerField.jsx —
// the reminder API stores/expects 24-hour "HH:mm" strings, unchanged.
function timeStringToDate(value) {
  const date = new Date();
  const match = TIME_RE.exec(value || "");
  if (match) {
    date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  } else {
    date.setSeconds(0, 0);
  }
  return date;
}

function dateToTimeString(date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatDisplay(value) {
  if (!TIME_RE.test(value || "")) return "Select a time";
  return timeStringToDate(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/**
 * Theme-aware counterpart of components/ui/TimePickerField.jsx. Same
 * value contract ("HH:mm"), same Android-dialog / iOS-sheet split.
 */
export default function TimePickerField({ value, onChange }) {
  const { theme } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [draft, setDraft] = useState(() => timeStringToDate(value));

  const openPicker = () => {
    setDraft(timeStringToDate(value));
    setPickerVisible(true);
  };

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setPickerVisible(false);
      if (event.type === "set" && selectedDate) {
        onChange(dateToTimeString(selectedDate));
      }
      return;
    }
    if (selectedDate) setDraft(selectedDate);
  };

  const confirmIOS = () => {
    onChange(dateToTimeString(draft));
    setPickerVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={openPicker}
        style={[styles.field, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}
      >
        <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
        <Text style={[styles.fieldText, { color: theme.colors.textPrimary }]}>{formatDisplay(value)}</Text>
        <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
      </Pressable>

      {pickerVisible && Platform.OS === "android" ? (
        <DateTimePicker mode="time" value={draft} is24Hour={false} onChange={handleChange} />
      ) : null}

      {Platform.OS === "ios" ? (
        <BottomSheet visible={pickerVisible} onClose={() => setPickerVisible(false)} title="Reminder time">
          <DateTimePicker
            mode="time"
            value={draft}
            display="spinner"
            onChange={handleChange}
            style={styles.spinner}
            textColor={theme.colors.textPrimary}
          />
          <ThemedButton title="Done" onPress={confirmIOS} style={styles.spacedTop} />
        </BottomSheet>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
    borderWidth: 1.5,
  },
  fieldText: { flex: 1, fontSize: 15 },
  spinner: { alignSelf: "stretch" },
  spacedTop: { marginTop: 12 },
});
