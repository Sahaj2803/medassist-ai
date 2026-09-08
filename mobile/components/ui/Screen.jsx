import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";

/**
 * Base screen shell: safe-area + graphite/ink background + optional
 * scroll + pull-to-refresh, so individual screens don't reimplement this.
 */
export default function Screen({
  children,
  scroll = true,
  padded = true,
  onRefresh,
  refreshing = false,
  style,
}) {
  const content = (
    <View style={[padded && styles.padded, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.signal[400]}
                colors={[colors.signal[400]]}
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
  safe: { flex: 1, backgroundColor: colors.ink[950] },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  padded: { padding: 16 },
});
