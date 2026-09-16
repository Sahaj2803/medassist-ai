import { useState } from "react";
import { View, TextInput, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";

/**
 * Theme-aware counterpart of components/ui/TextField.jsx.
 * Originally used only by the Part 4 (Reminders / Diet Guide) forms;
 * Part 5 additionally adopts it for Chat/Profile/Settings/Auth, which is
 * why an `isPassword` convenience was added below — purely a client-side
 * show/hide affordance over the existing `secureTextEntry` behavior, no
 * new field, no API/validation change.
 */
export default function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  isPassword = false,
  keyboardType,
  autoCapitalize = "sentences",
  error,
  icon,
  multiline,
  style,
  ...rest
}) {
  const { theme } = useTheme();
  const [revealed, setRevealed] = useState(false);
  const hidesText = isPassword ? !revealed : secureTextEntry;

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: error ? theme.colors.error : theme.colors.border,
          },
          multiline && styles.multilineWrap,
        ]}
      >
        {icon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={hidesText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          style={[styles.input, { color: theme.colors.textPrimary }, multiline && styles.multilineInput]}
          {...rest}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={revealed ? "eye-off-outline" : "eye-outline"}
              size={19}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    minHeight: 50,
  },
  multilineWrap: { alignItems: "flex-start", paddingVertical: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15 },
  multilineInput: { paddingVertical: 0, minHeight: 70, textAlignVertical: "top" },
  errorText: { fontSize: 12, marginTop: 6, fontWeight: "600" },
});
