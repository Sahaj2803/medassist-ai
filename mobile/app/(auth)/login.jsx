import { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import TextField from "../../components/ui/themed/TextField";
import Button from "../../components/ui/themed/Button";
import useAuth from "../../hooks/useAuth";
import { getErrorMessage } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

export default function LoginScreen() {
  const { theme, scheme } = useTheme();
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
    <LinearGradient colors={theme.gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.content}>
            <View style={[styles.card, { backgroundColor: theme.colors.background }]}>
              <View style={[styles.logoCircle, { backgroundColor: `${theme.colors.teal}17`, borderColor: `${theme.colors.teal}4D` }]}>
                <Ionicons name="pulse" size={34} color={theme.colors.teal} />
              </View>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Welcome back</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Log in to your MedAssist account</Text>

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
                <TextField
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  isPassword
                  icon={<Ionicons name="lock-closed-outline" size={18} color={theme.colors.textSecondary} />}
                />

                {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

                <Link href="/(auth)/forgot-password" asChild>
                  <Pressable style={styles.forgotLink}>
                    <Text style={[styles.forgotText, { color: theme.colors.primary }]}>Forgot password?</Text>
                  </Pressable>
                </Link>

                <Button title="Log in" onPress={handleLogin} loading={loading} style={styles.spacedTop} />
              </View>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Don't have an account? </Text>
                <Link href="/(auth)/register" asChild>
                  <Pressable>
                    <Text style={[styles.footerLink, { color: theme.colors.primary }]}>Register</Text>
                  </Pressable>
                </Link>
              </View>
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
  card: { borderRadius: 28, padding: 24 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 4, marginBottom: 20 },
  form: { marginTop: 4 },
  error: { fontSize: 13, marginBottom: 8, fontWeight: "500" },
  forgotLink: { alignSelf: "flex-end", marginBottom: 14 },
  forgotText: { fontSize: 13, fontWeight: "700" },
  spacedTop: { marginTop: 4 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "700" },
});
