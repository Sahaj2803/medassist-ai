import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "./ui/themed/BottomSheet";
import { Loading, EmptyState } from "./ui/themed/States";
import { useTheme } from "../context/ThemeContext";

/**
 * PART 4 — redesigned, theme-aware medicine picker. Lets the user pick a
 * medicine from their existing My Medicines list (medicineApi.list() —
 * same data/API the Medicines tab already uses) instead of typing a
 * name. Purely a selector: it reports the chosen medicine back via
 * onSelect, it doesn't fetch or own the list itself. Only used by the
 * Reminders create/edit forms, so redesigned in place.
 */
export default function ReminderMedicinePicker({ visible, onClose, medicines, loading, onSelect }) {
  const { theme } = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Select a medicine">
      {loading ? (
        <Loading />
      ) : medicines.length === 0 ? (
        <EmptyState
          icon="medical-outline"
          title="No medicines yet"
          message="Medicines from your analyzed prescriptions will appear here. You can still enter one manually."
        />
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item._id}
          style={styles.list}
          renderItem={({ item }) => (
            <Pressable onPress={() => onSelect(item)} style={[styles.row, { borderBottomColor: theme.colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: `${theme.colors.teal}17` }]}>
                <Ionicons name="medical" size={18} color={theme.colors.teal} />
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.name, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.meta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {[item.dosage, item.frequency].filter(Boolean).join(" · ") || "No dosage info"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
            </Pressable>
          )}
        />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  iconBox: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  flex1: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12.5, marginTop: 2 },
});
