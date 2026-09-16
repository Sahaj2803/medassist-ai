import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";

/**
 * Theme-aware pressable "select" row — opens a BottomSheet (passed in by
 * the caller) rather than owning any modal itself. Used for medicine
 * selection, lab report selection, and activity level — same visual
 * language as themed/TextField so a Part 4 form reads as one system.
 */
export default function SelectField({ label, icon, value, placeholder = "Select", onPress, disabled }) {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text> : null}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.field,
          { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border },
          disabled && styles.disabled,
        ]}
      >
        {icon}
        <Text
          style={[styles.fieldText, { color: value ? theme.colors.textPrimary : theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
    borderWidth: 1.5,
  },
  disabled: { opacity: 0.6 },
  fieldText: { flex: 1, fontSize: 15 },
});
