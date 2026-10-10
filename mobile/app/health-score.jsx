import { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/ui/themed/Screen";
import Card from "../components/ui/themed/Card";
import { Loading, EmptyState, ErrorState } from "../components/ui/themed/States";
import HealthScoreRing from "../components/ui/themed/HealthScoreRing";
import useThemedHeader from "../hooks/useThemedHeader";
import { useTheme } from "../context/ThemeContext";
import healthApi from "../services/healthApi";
import { getErrorMessage } from "../services/api";
import { useTranslation } from "../context/LanguageContext";

const HEALTH_SCORE_LABELS = {
  en: { loading:"Calculating your health score...", unavailableTitle:"Your Health Score will appear here", unavailableMessage:"Upload a prescription or lab report, and set up reminders, so MedAssist has enough data to generate your AI Health Score.", title:"Health Score", basedOn:"Based on your reminders, lab reports, and prescriptions", positivesTitle:"What's going well", attentionTitle:"Needs attention", emptyPositive:"Nothing to highlight yet.", emptyAttention:"Nothing flagged right now.", disclaimer:"This score is informational only, generated from your uploaded records. It is not a medical diagnosis or a guarantee of your health status — always consult a doctor for medical advice.", positive:{good_adherence:"Good reminder adherence",labs_within_range:"Lab results within range",no_interactions:"No flagged drug interactions"}, attention:{low_adherence:"Low reminder adherence",interactions_flagged:"Drug interactions flagged",labs_out_of_range:"Some lab results out of range"} },
  hi: { loading:"आपका हेल्थ स्कोर निकाला जा रहा है...", unavailableTitle:"आपका हेल्थ स्कोर यहाँ दिखेगा", unavailableMessage:"प्रिस्क्रिप्शन या लैब रिपोर्ट अपलोड करें और रिमाइंडर सेट करें, ताकि MedAssist आपका AI हेल्थ स्कोर बना सके।", title:"हेल्थ स्कोर", basedOn:"आपके रिमाइंडर, लैब रिपोर्ट और प्रिस्क्रिप्शन के आधार पर", positivesTitle:"क्या अच्छा चल रहा है", attentionTitle:"ध्यान देने की ज़रूरत", emptyPositive:"अभी दिखाने के लिए कुछ नहीं है।", emptyAttention:"अभी कोई समस्या नहीं मिली।", disclaimer:"यह स्कोर केवल जानकारी के लिए है और आपके अपलोड किए गए रिकॉर्ड पर आधारित है। यह मेडिकल डायग्नोसिस नहीं है। सलाह के लिए डॉक्टर से संपर्क करें।", positive:{good_adherence:"दवा रिमाइंडर का अच्छा पालन",labs_within_range:"लैब परिणाम सामान्य सीमा में",no_interactions:"कोई संदिग्ध दवा इंटरैक्शन नहीं"}, attention:{low_adherence:"दवा रिमाइंडर का कम पालन",interactions_flagged:"दवाओं के बीच संभावित इंटरैक्शन",labs_out_of_range:"कुछ लैब परिणाम सीमा से बाहर"} },
  gu: { loading:"તમારો હેલ્થ સ્કોર ગણાઈ રહ્યો છે...", unavailableTitle:"તમારો હેલ્થ સ્કોર અહીં દેખાશે", unavailableMessage:"MedAssist તમારો AI હેલ્થ સ્કોર બનાવી શકે તે માટે પ્રિસ્ક્રિપ્શન અથવા લેબ રિપોર્ટ અપલોડ કરો અને રિમાઇન્ડર સેટ કરો.", title:"હેલ્થ સ્કોર", basedOn:"તમારા રિમાઇન્ડર, લેબ રિપોર્ટ અને પ્રિસ્ક્રિપ્શનના આધારે", positivesTitle:"શું સારું ચાલી રહ્યું છે", attentionTitle:"ધ્યાન આપવાની જરૂર", emptyPositive:"હાલમાં દર્શાવવા માટે કંઈ નથી.", emptyAttention:"હાલમાં કોઈ સમસ્યા નોંધાઈ નથી.", disclaimer:"આ સ્કોર માત્ર માહિતી માટે છે અને તમારા અપલોડ કરેલા રેકોર્ડ પરથી બનાવાયો છે. તે તબીબી નિદાન નથી. તબીબી સલાહ માટે ડૉક્ટરનો સંપર્ક કરો.", positive:{good_adherence:"દવાની યાદ અપાવવાની સૂચનાનું સારું પાલન",labs_within_range:"લેબ પરિણામો સામાન્ય મર્યાદામાં",no_interactions:"દવાઓ વચ્ચે કોઈ નોંધાયેલ ક્રિયા નથી"}, attention:{low_adherence:"દવાની યાદ અપાવવાની સૂચનાનું ઓછું પાલન",interactions_flagged:"દવાઓ વચ્ચે સંભવિત ક્રિયા નોંધાઈ",labs_out_of_range:"કેટલાક લેબ પરિણામો મર્યાદાની બહાર"} }
};

function summarizePositive(p) {
  if (p.key === "good_adherence") return `${p.taken ?? 0} of ${(p.taken ?? 0) + (p.missed ?? 0)} recent doses taken`;
  return null;
}
function summarizeAttention(n) {
  if (n.key === "interactions_flagged") {
    const parts = [];
    if (n.severe) parts.push(`${n.severe} severe`);
    if (n.moderate) parts.push(`${n.moderate} moderate`);
    if (n.mild) parts.push(`${n.mild} mild`);
    return parts.join(", ");
  }
  if (n.key === "low_adherence") return `Score ${n.score}% · ${n.missed ?? 0} missed doses`;
  return null;
}

function IndicatorRow({ icon, color, text, detail, theme, isLast }) {
  return (
    <View style={[styles.indicatorRow, !isLast && { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }]}>
      <View style={[styles.indicatorIconWrap, { backgroundColor: `${color}17` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.flex1}>
        <Text style={[styles.body, { color: theme.colors.textPrimary }]}>{text}</Text>
        {detail ? <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>{detail}</Text> : null}
      </View>
    </View>
  );
}

function BreakdownCard({ title, icon, iconColor, items, emptyMessage, renderDetail, theme }) {
  return (
    <Card style={styles.spacedTop}>
      <View style={styles.cardTitleRow}>
        <View style={[styles.cardIconWrap, { backgroundColor: `${iconColor}17` }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <Text style={[styles.h3, { color: theme.colors.textPrimary }]}>{title}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={[styles.bodyMuted, styles.spacedTopSm, { color: theme.colors.textSecondary }]}>
          {emptyMessage}
        </Text>
      ) : (
        <View style={styles.spacedTopSm}>
          {items.map((entry, idx) => renderDetail(entry, idx, idx === items.length - 1))}
        </View>
      )}
    </Card>
  );
}

export default function HealthScoreScreen() {
  useThemedHeader();
  const { theme } = useTheme();
  const { language } = useTranslation();
  const labels = HEALTH_SCORE_LABELS[language] || HEALTH_SCORE_LABELS.en;
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await healthApi.score();
      setData(result);
      setState("success");
    } catch (e) {
      setError(getErrorMessage(e));
      setState("error");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (state === "loading") return <Screen><Loading label={labels.loading} /></Screen>;
  if (state === "error") return <Screen><ErrorState message={error} onRetry={load} /></Screen>;

  if (!data?.available) {
    return (
      <Screen>
        <EmptyState
          icon="pulse-outline"
          title={labels.unavailableTitle}
          message={labels.unavailableMessage}
        />
      </Screen>
    );
  }

  const positives = data.positives || [];
  const needsAttention = data.needsAttention || [];

  return (
    <Screen>
      <Card style={styles.heroCard} variant="elevated">
        <Text style={[styles.heroLabel, { color: theme.colors.textSecondary }]}>{labels.title}</Text>
        <View style={styles.ringWrap}>
          <HealthScoreRing score={data.score} overall={data.overall} size={172} />
        </View>
        <Text style={[styles.heroCaption, { color: theme.colors.textSecondary }]}>
          {labels.basedOn}
        </Text>
      </Card>

      <BreakdownCard
        title={labels.positivesTitle}
        icon="checkmark-circle"
        iconColor={theme.colors.teal}
        items={positives}
        emptyMessage={labels.emptyPositive}
        theme={theme}
        renderDetail={(p, idx, isLast) => (
          <IndicatorRow
            key={idx}
            icon="checkmark-circle"
            color={theme.colors.teal}
            text={labels.positive[p.key] || p.key}
            detail={summarizePositive(p)}
            theme={theme}
            isLast={isLast}
          />
        )}
      />

      <BreakdownCard
        title={labels.attentionTitle}
        icon="alert-circle"
        iconColor={theme.colors.orange}
        items={needsAttention}
        emptyMessage={labels.emptyAttention}
        theme={theme}
        renderDetail={(n, idx, isLast) => (
          <IndicatorRow
            key={idx}
            icon="alert-circle"
            color={theme.colors.orange}
            text={labels.attention[n.key] || n.key}
            detail={summarizeAttention(n)}
            theme={theme}
            isLast={isLast}
          />
        )}
      />

      <Text style={[styles.disclaimer, { color: theme.colors.textSecondary }]}>
        {labels.disclaimer}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { alignItems: "center", paddingVertical: 28 },
  heroLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  ringWrap: { marginTop: 16 },
  heroCaption: { fontSize: 13, marginTop: 16, textAlign: "center" },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  h3: { fontSize: 16, fontWeight: "700" },
  body: { fontSize: 14.5 },
  bodyMuted: { fontSize: 13.5 },
  caption: { fontSize: 12.5, marginTop: 1 },
  spacedTop: { marginTop: 16 },
  spacedTopSm: { marginTop: 8 },
  indicatorRow: { flexDirection: "row", gap: 10, paddingVertical: 10, alignItems: "flex-start" },
  indicatorIconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", marginTop: 1 },
  flex1: { flex: 1 },
  disclaimer: { fontSize: 12, marginTop: 24, fontStyle: "italic", lineHeight: 18 },
});
