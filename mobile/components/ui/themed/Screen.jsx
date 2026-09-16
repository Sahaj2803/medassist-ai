import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../context/ThemeContext";

/**
 * Theme-aware counterpart of components/ui/Screen.jsx, used only by the
 * Part 2 (Prescriptions/Medicines) screens so Part 1's still-static-dark
 * screens (Home, Reminders, Lab Reports, Chat, Timeline, Profile, Settings)
 * are left untouched. Same API as the original — a drop-in swap once Part 1
 * ships its own themed Screen.
 */
export default function Screen({ children, scroll = true, padded = true, onRefresh, refreshing = false, style }) {
  const { theme } = useTheme();
  const content = <View style={[padded && styles.padded, style]}>{children}</View>;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  padded: { padding: 16 },
});
