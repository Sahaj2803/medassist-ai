import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import BottomSheet from "./BottomSheet";
import ThemedButton from "./Button";
import { dateToDateString, dateStringToDate, formatDateDisplay, todayDate } from "../../../utils/dateUtils";

/**
 * Theme-aware counterpart of components/ui/DatePickerField.jsx — same
 * value contract ("YYYY-MM-DD" string), same Android-native-dialog /
 * iOS-spinner-sheet split, same onChange/onClear API, so it's a drop-in
 * swap in the redesigned Reminders create/edit forms. The underlying
 * @react-native-community/datetimepicker usage is untouched.
 */
export default function DatePickerField({
  value,
  onChange,
  onClear,
  placeholder = "Select a date",
  minimumDate,
  maximumDate,
  label,
}) {
  const { theme } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);
  const initial = () => dateStringToDate(value) || todayDate();
  const [draft, setDraft] = useState(initial);

  const openPicker = () => {
    setDraft(initial());
    setPickerVisible(true);
  };

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setPickerVisible(false);
      if (event.type === "set" && selectedDate) {
        onChange(dateToDateString(selectedDate));
      }
      return;
    }
    if (selectedDate) setDraft(selectedDate);
  };

  const confirmIOS = () => {
    onChange(dateToDateString(draft));
    setPickerVisible(false);
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text> : null}
      <View style={styles.row}>
        <Pressable
          onPress={openPicker}
          style={[styles.field, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}
        >
          <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.fieldText, { color: value ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
            {value ? formatDateDisplay(value) : placeholder}
          </Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
        </Pressable>
        {onClear && value ? (
          <Pressable
            onPress={onClear}
            style={[styles.clearButton, { backgroundColor: theme.colors.elevatedSurface, borderColor: theme.colors.border }]}
          >
            <Ionicons name="close" size={18} color={theme.colors.error} />
          </Pressable>
        ) : null}
      </View>

      {pickerVisible && Platform.OS === "android" ? (
        <DateTimePicker
          mode="date"
          value={draft}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      ) : null}

      {Platform.OS === "ios" ? (
        <BottomSheet visible={pickerVisible} onClose={() => setPickerVisible(false)} title="Select date">
          <DateTimePicker
            mode="date"
            value={draft}
            display="spinner"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={handleChange}
            style={styles.spinner}
            textColor={theme.colors.textPrimary}
          />
          <ThemedButton title="Done" onPress={confirmIOS} style={styles.spacedTop} />
        </BottomSheet>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  field: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
    borderWidth: 1.5,
  },
  fieldText: { flex: 1, fontSize: 15 },
  clearButton: { width: 44, height: 50, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1.5 },
  spinner: { alignSelf: "stretch" },
  spacedTop: { marginTop: 12 },
});
