import { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";
import authApi from "../../services/authApi";
import { getErrorMessage } from "../../services/api";
import { colors, typography, spacing } from "../../constants/theme";

export default function ForgotPasswordScreen() {
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
    <LinearGradient colors={[colors.graphite[700], colors.graphite[900]]} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.content}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color={colors.mist[300]} />
            </Pressable>

            <View style={styles.logoCircle}>
              <Ionicons name="key-outline" size={30} color={colors.signal[400]} />
            </View>
            <Text style={styles.title}>Reset your password</Text>
            <Text style={styles.subtitle}>
              Enter the email on your account. If it's registered, we'll send a reset link.
            </Text>

            {sent ? (
              <View style={styles.sentBox}>
                <Ionicons name="checkmark-circle" size={22} color={colors.signal[400]} />
                <Text style={styles.sentText}>
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
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button title="Send reset link" onPress={handleSubmit} loading={loading} />
              </View>
            )}

            <Link href="/(auth)/login" asChild>
              <Pressable style={styles.backToLogin}>
                <Text style={styles.footerLink}>Back to log in</Text>
              </Pressable>
            </Link>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: "center" },
  backButton: { position: "absolute", top: spacing.lg, left: spacing.xl, padding: spacing.xs },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(45,212,191,0.12)",
    borderWidth: 1,
    borderColor: "rgba(45,212,191,0.3)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  title: { ...typography.h1, textAlign: "center" },
  subtitle: { ...typography.bodyMuted, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.xl },
  form: { marginTop: spacing.sm },
  error: { color: colors.alert[400], fontSize: 13, marginBottom: spacing.sm },
  sentBox: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: "rgba(45,212,191,0.08)",
    borderWidth: 1,
    borderColor: "rgba(45,212,191,0.25)",
    borderRadius: 14,
    padding: spacing.md,
    alignItems: "flex-start",
  },
  sentText: { color: colors.mist[100], flex: 1, fontSize: 14, lineHeight: 20 },
  backToLogin: { alignSelf: "center", marginTop: spacing.xxl },
  footerLink: { color: colors.signal[400], fontSize: 14, fontWeight: "700" },
});
