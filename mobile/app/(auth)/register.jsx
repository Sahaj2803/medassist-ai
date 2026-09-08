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
import { colors, typography, spacing } from "../../constants/theme";

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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
    <LinearGradient colors={[colors.graphite[700], colors.graphite[900]]} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.content}>
            <View style={styles.logoCircle}>
              <Ionicons name="person-add-outline" size={32} color={colors.signal[400]} />
            </View>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Join MedAssist to manage your health</Text>

            <View style={styles.form}>
              <View style={styles.row}>
                <View style={styles.half}>
                  <TextField label="Name" value={name} onChangeText={setName} placeholder="Full name" />
                </View>
                <View style={styles.half}>
                  <TextField
                    label="Phone (optional)"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+91..."
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
              />
              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                secureTextEntry
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button title="Create account" onPress={handleRegister} loading={loading} style={styles.spacedTop} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text style={styles.footerLink}>Log in</Text>
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
  row: { flexDirection: "row", gap: spacing.sm },
  half: { flex: 1 },
  error: { color: colors.alert[400], fontSize: 13, marginBottom: spacing.sm },
  spacedTop: { marginTop: spacing.sm },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
  footerText: { color: colors.mist[400], fontSize: 14 },
  footerLink: { color: colors.signal[400], fontSize: 14, fontWeight: "700" },
});
