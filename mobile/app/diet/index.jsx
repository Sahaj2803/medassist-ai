import { Text, Pressable, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/themed/Screen";
import DietGuideForm from "../../components/DietGuideForm";
import { useTheme } from "../../context/ThemeContext";
import useThemedHeader from "../../hooks/useThemedHeader";

/**
 * PART 4 — redesigned Diet Guide entry screen. Always shows the
 * health-information form to generate a NEW diet guide — same as
 * before. Viewing a previously generated guide happens via History -> a
 * specific guide (app/diet/[id].jsx). No API/data behavior changed.
 */
export default function DietGuideScreen() {
  const { theme } = useTheme();
  useThemedHeader();
  const router = useRouter();

  const handleGenerated = (dietGuide) => {
    if (dietGuide?._id) {
      router.replace(`/diet/${dietGuide._id}`);
    }
  };

  return (
    <Screen>
      <View style={[styles.iconBadge, { backgroundColor: `${theme.colors.teal}17` }]}>
        <Ionicons name="restaurant" size={22} color={theme.colors.teal} />
      </View>
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>Diet Guide</Text>
      <Text style={[styles.subheading, { color: theme.colors.textSecondary }]}>
        Create a personalized guide based on your health information and, optionally, one of your
        analyzed lab reports.
      </Text>

      <Pressable onPress={() => router.push("/diet/history")} style={styles.historyLink}>
        <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
        <Text style={[styles.historyLinkText, { color: theme.colors.primary }]}>View past diet guides</Text>
      </Pressable>

      <View style={styles.spacedTop}>
        <DietGuideForm onGenerated={handleGenerated} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconBadge: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heading: { fontSize: 22, fontWeight: "700" },
  subheading: { fontSize: 13.5, marginTop: 6, lineHeight: 19 },
  historyLink: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
  historyLinkText: { fontWeight: "600", fontSize: 13 },
  spacedTop: { marginTop: 20 },
});
