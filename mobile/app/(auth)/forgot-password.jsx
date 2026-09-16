import { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import TextField from "../../components/ui/themed/TextField";
import Button from "../../components/ui/themed/Button";
import authApi from "../../services/authApi";
import { getErrorMessage } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email) {
      setError("Enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={theme.gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.content}>
            <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back">
              <View style={[styles.backCircle, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </View>
            </Pressable>

            <View style={[styles.card, { backgroundColor: theme.colors.background }]}>
              <View style={[styles.logoCircle, { backgroundColor: `${theme.colors.teal}17`, borderColor: `${theme.colors.teal}4D` }]}>
                <Ionicons name="key-outline" size={28} color={theme.colors.teal} />
              </View>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Reset your password</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Enter the email on your account. If it's registered, we'll send a reset link.
              </Text>

              {sent ? (
                <View
                  style={[
                    styles.sentBox,
                    { backgroundColor: `${theme.colors.teal}12`, borderColor: `${theme.colors.teal}40` },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={22} color={theme.colors.teal} />
                  <Text style={[styles.sentText, { color: theme.colors.textPrimary }]}>
                    If that email is registered, a reset link has been sent. Check your inbox.
                  </Text>
                </View>
              ) : (
                <View style={styles.form}>
                  <TextField
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon={<Ionicons name="mail-outline" size={18} color={theme.colors.textSecondary} />}
                  />
                  {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
                  <Button title="Send reset link" onPress={handleSubmit} loading={loading} />
                </View>
              )}

              <Link href="/(auth)/login" asChild>
                <Pressable style={styles.backToLogin}>
                  <Text style={[styles.footerLink, { color: theme.colors.primary }]}>Back to log in</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, justifyContent: "center" },
  backButton: { position: "absolute", top: 12, left: 20, zIndex: 1 },
  backCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: 28, padding: 24 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 4, marginBottom: 20, lineHeight: 20 },
  form: { marginTop: 4 },
  error: { fontSize: 13, marginBottom: 8, fontWeight: "500" },
  sentBox: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "flex-start",
  },
  sentText: { flex: 1, fontSize: 14, lineHeight: 20 },
  backToLogin: { alignSelf: "center", marginTop: 22 },
  footerLink: { fontSize: 14, fontWeight: "700" },
});
