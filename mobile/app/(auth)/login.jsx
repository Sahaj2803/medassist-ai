import { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";
import useAuth from "../../hooks/useAuth";
import { getErrorMessage } from "../../services/api";
import { colors, typography, spacing, radii } from "../../constants/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.graphite[700], colors.graphite[900]]} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.content}>
            <View style={styles.logoCircle}>
              <Ionicons name="pulse" size={36} color={colors.signal[400]} />
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Log in to your MedAssist account</Text>

            <View style={styles.form}>
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                icon={<Ionicons name="mail-outline" size={18} color={colors.mist[400]} />}
              />
              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                icon={<Ionicons name="lock-closed-outline" size={18} color={colors.mist[400]} />}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Link href="/(auth)/forgot-password" asChild>
                <Pressable style={styles.forgotLink}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
              </Link>

              <Button title="Log in" onPress={handleLogin} loading={loading} style={styles.spacedTop} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text style={styles.footerLink}>Register</Text>
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
  content: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: "center" },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(45,212,191,0.12)",
    borderWidth: 1,
    borderColor: "rgba(45,212,191,0.3)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  title: { ...typography.h1, textAlign: "center" },
  subtitle: { ...typography.bodyMuted, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.xxl },
  form: { marginTop: spacing.md },
  error: { color: colors.alert[400], fontSize: 13, marginBottom: spacing.sm },
  forgotLink: { alignSelf: "flex-end", marginBottom: spacing.md },
  forgotText: { color: colors.signal[400], fontSize: 13, fontWeight: "600" },
  spacedTop: { marginTop: spacing.sm },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xxl },
  footerText: { color: colors.mist[400], fontSize: 14 },
  footerLink: { color: colors.signal[400], fontSize: 14, fontWeight: "700" },
});
