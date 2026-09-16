import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "./ui/themed/BottomSheet";
import { SUPPORTED_LANGUAGES } from "../constants/config";
import { useTheme } from "../context/ThemeContext";

/**
 * PART 5 — redesigned on top of the shared themed BottomSheet (same shell
 * used by the Part 4 pickers) instead of a bespoke Modal, so it matches
 * the rest of the premium UI. Contract is unchanged: it still owns no
 * state of its own and calls the caller's onSelect, which Profile wires
 * to the same updateProfile({ preferredLanguage }) used by Settings — no
 * second language system, no new persistence path.
 */
export default function LanguagePickerModal({ visible, onClose, selectedCode, savingCode, onSelect }) {
  const { theme } = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Choose language" maxHeight="65%">
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Used for AI explanations, summaries, and this app's interface.
      </Text>
      <FlatList
        data={SUPPORTED_LANGUAGES}
        keyExtractor={(item) => item.code}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = item.code === selectedCode;
          const isSaving = item.code === savingCode;
          return (
            <Pressable
              onPress={() => onSelect(item.code)}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.row,
                {
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: isSelected
                    ? `${theme.colors.primary}12`
                    : theme.colors.inputBackground,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.rowText,
                  { color: isSelected ? theme.colors.primary : theme.colors.textPrimary },
                ]}
              >
                {item.label}
              </Text>
              {isSaving ? (
                <Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.textSecondary} />
              ) : isSelected ? (
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              ) : null}
            </Pressable>
          );
        }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 13.5, lineHeight: 19, marginTop: 2, marginBottom: 4 },
  list: { marginTop: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  rowText: { fontSize: 15, fontWeight: "600" },
});
