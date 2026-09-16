import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "./ui/themed/Card";
import { useTheme } from "../context/ThemeContext";

/**
 * PART 4 — redesigned, theme-aware Diet Guide result view. Renders a
 * DietGuide document exactly as returned by the backend
 * (backend/models/DietGuide.js + backend/controllers/diet.controller.js):
 *   { _id, source, labReportSnapshot, healthContext, guide, generatedAt, ... }
 * where `guide` is the structured AI output:
 *   { overview, healthConsiderations, recommendedFoods, foodsToLimit,
 *     mealGuidance: { breakfast, lunch, snacks, dinner },
 *     hydrationGuidance, lifestyleGuidance, importantNotes, doctorConsultation }
 * These field names are the real backend contract, not guesses, and are
 * unchanged from before. Every section is still optional/defensive since
 * it's AI output — only sections actually present in the response are
 * rendered, nothing is fabricated, and the generated text itself is
 * never altered.
 */

function Section({ title, icon, children }) {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeadingRow}>
        {icon}
        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function BulletList({ items, empty }) {
  const { theme } = useTheme();
  if (!items || items.length === 0) {
    return empty ? <Text style={[styles.bodyMuted, { color: theme.colors.textSecondary }]}>{empty}</Text> : null;
  }
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={[styles.bullet, { backgroundColor: theme.colors.teal }]} />
          <Text style={[styles.body, styles.flex1, { color: theme.colors.textPrimary }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const MEAL_LABELS = [
  ["breakfast", "Breakfast"],
  ["lunch", "Lunch"],
  ["snacks", "Snacks"],
  ["dinner", "Dinner"],
];

export default function DietPlanView({ dietGuide }) {
  const { theme } = useTheme();
  if (!dietGuide || typeof dietGuide !== "object") return null;

  const guide = dietGuide.guide || {};
  const meals = guide.mealGuidance || {};
  const snapshotCount = dietGuide.labReportSnapshot?.results?.length || 0;

  return (
    <View>
      {/* AI insight hero — visually distinct but not diagnostic-looking */}
      <Card variant="elevated" style={[styles.heroCard, { borderColor: `${theme.colors.purple}33` }]}>
        <View style={styles.heroHeaderRow}>
          <View style={[styles.heroIconBox, { backgroundColor: `${theme.colors.purple}17` }]}>
            <Ionicons name="sparkles" size={18} color={theme.colors.purple} />
          </View>
          <View style={styles.flex1}>
            <Text style={[styles.heroEyebrow, { color: theme.colors.purple }]}>AI-GENERATED GUIDANCE</Text>
            <Text style={[styles.heroTitle, { color: theme.colors.textPrimary }]}>Your Diet Guide</Text>
          </View>
        </View>
        {guide.overview ? (
          <Text style={[styles.body, styles.spacedTop, { color: theme.colors.textPrimary }]}>{guide.overview}</Text>
        ) : null}
      </Card>

      {guide.healthConsiderations?.length > 0 && (
        <Card style={styles.spacedTop}>
          <Section title="HEALTH CONSIDERATIONS" icon={<Ionicons name="heart-outline" size={15} color={theme.colors.primary} />}>
            <BulletList items={guide.healthConsiderations} />
          </Section>
        </Card>
      )}

      <Card style={styles.spacedTop}>
        <Section title="RECOMMENDED FOODS" icon={<Ionicons name="checkmark-circle-outline" size={15} color={theme.colors.teal} />}>
          <BulletList items={guide.recommendedFoods} empty="No specific recommendations for this guide." />
        </Section>
      </Card>

      <Card style={styles.spacedTop}>
        <Section title="FOODS TO LIMIT" icon={<Ionicons name="alert-circle-outline" size={15} color={theme.colors.orange} />}>
          <BulletList items={guide.foodsToLimit} empty="Nothing specific to limit was identified." />
        </Section>
      </Card>

      <Card style={styles.spacedTop}>
        <Section title="DAILY MEAL GUIDANCE" icon={<Ionicons name="restaurant-outline" size={15} color={theme.colors.purple} />}>
          {MEAL_LABELS.map(([key, label]) => (
            <View key={key} style={styles.mealBlock}>
              <Text style={[styles.mealLabel, { color: theme.colors.textPrimary }]}>{label}</Text>
              <View style={styles.spacedTopXs}>
                <BulletList items={meals[key]} empty="No suggestions provided." />
              </View>
            </View>
          ))}
        </Section>
      </Card>

      {guide.hydrationGuidance ? (
        <Card style={styles.spacedTop}>
          <Section title="HYDRATION" icon={<Ionicons name="water-outline" size={15} color={theme.colors.primary} />}>
            <Text style={[styles.body, { color: theme.colors.textPrimary }]}>{guide.hydrationGuidance}</Text>
          </Section>
        </Card>
      ) : null}

      {guide.lifestyleGuidance?.length > 0 && (
        <Card style={styles.spacedTop}>
          <Section title="LIFESTYLE GUIDANCE" icon={<Ionicons name="walk-outline" size={15} color={theme.colors.teal} />}>
            <BulletList items={guide.lifestyleGuidance} />
          </Section>
        </Card>
      )}

      {guide.importantNotes?.length > 0 && (
        <Card style={[styles.spacedTop, styles.noteCard, { borderColor: `${theme.colors.orange}40`, backgroundColor: `${theme.colors.orange}0D` }]}>
          <View style={styles.sectionHeadingRow}>
            <Ionicons name="alert-circle" size={16} color={theme.colors.orange} />
            <Text style={[styles.sectionLabel, { color: theme.colors.orange }]}>IMPORTANT NOTES</Text>
          </View>
          <View style={styles.spacedTopXs}>
            <BulletList items={guide.importantNotes} />
          </View>
        </Card>
      )}

      {guide.doctorConsultation ? (
        <Card style={styles.spacedTop}>
          <Section title="DOCTOR CONSULTATION" icon={<Ionicons name="medkit-outline" size={15} color={theme.colors.primary} />}>
            <Text style={[styles.body, { color: theme.colors.textPrimary }]}>{guide.doctorConsultation}</Text>
          </Section>
        </Card>
      ) : null}

      {snapshotCount > 0 ? (
        <View style={styles.snapshotRow}>
          <Ionicons name="flask-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>
            {`Based in part on ${snapshotCount} result${snapshotCount === 1 ? "" : "s"} from ${
              dietGuide.labReportSnapshot?.labName || "your lab report"
            }`}
          </Text>
        </View>
      ) : null}

      <View style={[styles.disclaimer, { borderColor: theme.colors.border, backgroundColor: theme.colors.elevatedSurface }]}>
        <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} style={styles.iconTop} />
        <Text style={[styles.caption, styles.flex1, { color: theme.colors.textSecondary }]}>
          MedAssist AI provides general educational dietary guidance based on the information
          provided. It is not a diagnosis or a substitute for advice from a qualified doctor or
          registered dietitian. Consult a healthcare professional for personalized medical
          dietary advice, especially if you have a medical condition or abnormal test results.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: { borderWidth: 1.5 },
  heroHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroIconBox: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  heroEyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  heroTitle: { fontSize: 18, fontWeight: "700", marginTop: 2 },
  spacedTop: { marginTop: 16 },
  spacedTopXs: { marginTop: 6 },
  section: {},
  sectionHeadingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionLabel: { fontSize: 11.5, fontWeight: "700", letterSpacing: 0.5 },
  sectionBody: { marginTop: 10 },
  bulletRow: { flexDirection: "row", gap: 10, marginTop: 8, alignItems: "flex-start" },
  bullet: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
  flex1: { flex: 1 },
  body: { fontSize: 15, lineHeight: 21 },
  bodyMuted: { fontSize: 14 },
  caption: { fontSize: 12, lineHeight: 17 },
  mealBlock: { marginTop: 14 },
  mealLabel: { fontSize: 15, fontWeight: "700" },
  noteCard: { borderWidth: 1 },
  snapshotRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16 },
  iconTop: { marginTop: 2 },
  disclaimer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
});
