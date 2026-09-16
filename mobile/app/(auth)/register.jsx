import { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import TextField from "../../components/ui/themed/TextField";
import Button from "../../components/ui/themed/Button";
import useAuth from "../../hooks/useAuth";
import { getErrorMessage } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

export default function RegisterScreen() {
  const { theme } = useTheme();
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    if (!name || !email || !password) {
      setError("Name, email, and password are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    // Client-side only check — the account is still created by the same
    // single POST /auth/register call below, no new backend field.
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, phone: phone.trim() || undefined });
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
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={[styles.card, { backgroundColor: theme.colors.background }]}>
              <View style={[styles.logoCircle, { backgroundColor: `${theme.colors.teal}17`, borderColor: `${theme.colors.teal}4D` }]}>
                <Ionicons name="person-add-outline" size={30} color={theme.colors.teal} />
              </View>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Create your account</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Join MedAssist to manage your health</Text>

              <View style={styles.form}>
                <TextField label="Name" value={name} onChangeText={setName} placeholder="Full name" />
                <TextField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextField
                  label="Phone (optional)"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91..."
                  keyboardType="phone-pad"
                />
                <TextField
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  isPassword
                />
                <TextField
                  label="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  isPassword
                />

                {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

                <Button title="Create account" onPress={handleRegister} loading={loading} style={styles.spacedTop} />
              </View>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <Pressable>
                    <Text style={[styles.footerLink, { color: theme.colors.primary }]}>Log in</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 24 },
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
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 4, marginBottom: 16 },
  form: { marginTop: 4 },
  error: { fontSize: 13, marginBottom: 8, fontWeight: "500" },
  spacedTop: { marginTop: 4 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "700" },
});
