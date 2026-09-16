import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";

/**
 * Shared bottom-sheet shell for the Part 4 pickers (medicine picker, lab
 * report picker, activity-level picker). Same slide-up Modal pattern the
 * app already used pre-Part-4 (see the original ReminderMedicinePicker /
 * DietGuideForm's inline PickerModal) — just themed and de-duplicated.
 */
export default function BottomSheet({ visible, onClose, title, children, maxHeight = "75%" }) {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: theme.colors.surface, maxHeight, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(10,20,40,0.5)" },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingTop: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(120,130,150,0.35)",
    alignSelf: "center",
    marginBottom: 14,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  title: { fontSize: 17, fontWeight: "700" },
});
