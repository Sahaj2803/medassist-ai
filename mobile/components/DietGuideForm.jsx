import { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "./ui/themed/Card";
import TextField from "./ui/themed/TextField";
import Button from "./ui/themed/Button";
import SelectField from "./ui/themed/SelectField";
import BottomSheet from "./ui/themed/BottomSheet";
import { Loading } from "./ui/themed/States";
import dietApi, { normalizeDietContext } from "../services/dietApi";
import { getErrorMessage } from "../services/api";
import { useTheme } from "../context/ThemeContext";

/**
 * PART 4 — redesigned, theme-aware Diet Guide form. Same fields, same
 * optional/required rule (at least one of "select a lab report" or
 * "fill something in" — enforced server-side too, this is just a UX
 * nicety), same request body field names, and the same ACTIVITY_LEVELS
 * values as before — nothing about the API contract changed, only the
 * visual layer and grouping into clear sections.
 */

const ACTIVITY_LEVELS = [
  { value: "", label: "Not specified" },
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" },
  { value: "very_active", label: "Very active" },
];

const emptyForm = {
  labReportId: "",
  age: "",
  gender: "",
  activityLevel: "",
  conditions: "",
  symptoms: "",
  dietaryRestrictions: "",
  allergies: "",
  dietaryPreferences: "",
  medications: "",
};

function SectionHeading({ icon, children }) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionHeadingRow}>
      {icon}
      <Text style={[styles.sectionHeadingText, { color: theme.colors.textSecondary }]}>{children}</Text>
    </View>
  );
}

export default function DietGuideForm({ onGenerated }) {
  const { theme } = useTheme();
  const [context, setContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [labModalVisible, setLabModalVisible] = useState(false);
  const [activityModalVisible, setActivityModalVisible] = useState(false);

  useEffect(() => {
    dietApi
      .context()
      .then((raw) => {
        const data = normalizeDietContext(raw) || { labReports: [], medicines: [] };
        setContext(data);
        // Pre-fill medications from the user's own confirmed medicines,
        // same as before — still fully editable/removable before generating.
        if (data.medicines?.length) {
          setForm((prev) => ({
            ...prev,
            medications: data.medicines.map((m) => m.name).filter(Boolean).join(", "),
          }));
        }
      })
      .catch(() => setContext({ labReports: [], medicines: [] }))
      .finally(() => setContextLoading(false));
  }, []);

  const update = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const selectedLabReport = context?.labReports?.find((r) => r._id === form.labReportId);
  const selectedActivityLabel =
    ACTIVITY_LEVELS.find((a) => a.value === form.activityLevel)?.label || "Not specified";

  const labReportLabel = (item) =>
    item._id
      ? `${item.labName || "Lab report"} · ${new Date(item.reportDate || item.createdAt).toLocaleDateString()} · ${item.resultCount} result${item.resultCount === 1 ? "" : "s"}`
      : item.labName;

  const handleSubmit = async () => {
    setError("");

    const hasManualInfo = [
      form.age,
      form.gender,
      form.activityLevel,
      form.conditions,
      form.symptoms,
      form.dietaryRestrictions,
      form.allergies,
      form.dietaryPreferences,
      form.medications,
    ].some((v) => v && v.trim());

    if (!form.labReportId && !hasManualInfo) {
      setError("Select a lab report or fill in at least some health information.");
      return;
    }

    setGenerating(true);
    try {
      const raw = await dietApi.generate({
        labReportId: form.labReportId || undefined,
        age: form.age || undefined,
        gender: form.gender || undefined,
        activityLevel: form.activityLevel || undefined,
        conditions: form.conditions,
        symptoms: form.symptoms,
        dietaryRestrictions: form.dietaryRestrictions,
        allergies: form.allergies,
        dietaryPreferences: form.dietaryPreferences,
        medications: form.medications,
      });
      onGenerated(raw.dietGuide);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View>
      <Card>
        <SectionHeading icon={<Ionicons name="flask-outline" size={16} color={theme.colors.teal} />}>
          LAB REPORT
        </SectionHeading>
        {contextLoading ? (
          <Loading label="Loading your lab reports..." />
        ) : (
          <SelectField
            value={selectedLabReport ? labReportLabel(selectedLabReport) : ""}
            placeholder="No lab report — use manual info only"
            onPress={() => setLabModalVisible(true)}
          />
        )}
        {context?.labReports?.length === 0 && !contextLoading ? (
          <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
            You don't have any analyzed lab reports yet. You can still fill in health information
            manually below.
          </Text>
        ) : null}
      </Card>

      <Card style={styles.spacedTop}>
        <SectionHeading icon={<Ionicons name="person-outline" size={16} color={theme.colors.primary} />}>
          PERSONAL INFORMATION
        </SectionHeading>
        <TextField label="Age" value={form.age} onChangeText={update("age")} placeholder="Your age" keyboardType="number-pad" />
        <TextField label="Gender / Sex" value={form.gender} onChangeText={update("gender")} placeholder="Optional" />
        <SelectField
          label="Activity level"
          value={selectedActivityLabel === "Not specified" ? "" : selectedActivityLabel}
          placeholder="Not specified"
          onPress={() => setActivityModalVisible(true)}
        />
      </Card>

      <Card style={styles.spacedTop}>
        <SectionHeading icon={<Ionicons name="pulse-outline" size={16} color={theme.colors.orange} />}>
          HEALTH INFORMATION
        </SectionHeading>
        <TextField
          label="Existing health conditions"
          value={form.conditions}
          onChangeText={update("conditions")}
          placeholder="e.g. diabetes, hypertension (comma separated)"
        />
        <TextField
          label="Relevant symptoms"
          value={form.symptoms}
          onChangeText={update("symptoms")}
          placeholder="e.g. fatigue, bloating (comma separated)"
        />
        <TextField
          label="Current medications"
          value={form.medications}
          onChangeText={update("medications")}
          placeholder="Pre-filled from your medicines where available"
        />
      </Card>

      <Card style={styles.spacedTop}>
        <SectionHeading icon={<Ionicons name="restaurant-outline" size={16} color={theme.colors.purple} />}>
          DIET PREFERENCES
        </SectionHeading>
        <TextField
          label="Food allergies / intolerances"
          value={form.allergies}
          onChangeText={update("allergies")}
          placeholder="e.g. peanuts, lactose (comma separated)"
        />
        <TextField
          label="Dietary restrictions"
          value={form.dietaryRestrictions}
          onChangeText={update("dietaryRestrictions")}
          placeholder="e.g. vegetarian, gluten-free (comma separated)"
        />
        <TextField
          label="Dietary preferences"
          value={form.dietaryPreferences}
          onChangeText={update("dietaryPreferences")}
          placeholder="e.g. low-carb, high-protein (comma separated)"
        />
      </Card>

      <Text style={[styles.footnote, { color: theme.colors.textSecondary }]}>
        All fields are optional, but you need to select a lab report or fill in at least some
        health information to generate a guide.
      </Text>

      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

      <Button
        title={generating ? "Generating..." : "Generate Diet Guide"}
        onPress={handleSubmit}
        loading={generating}
        icon={<Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />}
        style={styles.spacedTop}
      />

      <BottomSheet visible={labModalVisible} onClose={() => setLabModalVisible(false)} title="Select lab report">
        <FlatList
          data={[{ _id: "", labName: "No lab report — use manual info only" }, ...(context?.labReports || [])]}
          keyExtractor={(item) => item._id || "none"}
          style={{ maxHeight: 360 }}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.modalRow, { borderBottomColor: theme.colors.border }]}
              onPress={() => {
                update("labReportId")(item._id);
                setLabModalVisible(false);
              }}
            >
              <Text style={[styles.modalRowText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {labReportLabel(item)}
              </Text>
              {form.labReportId === item._id ? (
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.teal} />
              ) : null}
            </Pressable>
          )}
        />
      </BottomSheet>

      <BottomSheet visible={activityModalVisible} onClose={() => setActivityModalVisible(false)} title="Activity level">
        {ACTIVITY_LEVELS.map((a) => (
          <Pressable
            key={a.value || "none"}
            style={[styles.modalRow, { borderBottomColor: theme.colors.border }]}
            onPress={() => {
              update("activityLevel")(a.value);
              setActivityModalVisible(false);
            }}
          >
            <Text style={[styles.modalRowText, { color: theme.colors.textPrimary }]}>{a.label}</Text>
            {form.activityLevel === a.value ? (
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.teal} />
            ) : null}
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeadingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  sectionHeadingText: { fontSize: 11.5, fontWeight: "700", letterSpacing: 0.5 },
  spacedTop: { marginTop: 16 },
  hint: { fontSize: 12, marginTop: 8 },
  footnote: { fontSize: 12, marginTop: 16, lineHeight: 17 },
  error: { fontSize: 13, marginTop: 10, fontWeight: "600" },
  modalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1 },
  modalRowText: { flex: 1, fontSize: 15, marginRight: 8 },
});
