import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import IconButton from "./IconButton";

/** Sun/moon toggle. Persists via ThemeContext (AsyncStorage), app-wide. */
export default function ThemeToggle({ size = 40, style }) {
  const { scheme, toggleTheme, theme } = useTheme();

  return (
    <IconButton onPress={toggleTheme} size={size} style={style} accessibilityLabel="Toggle light and dark mode">
      <Ionicons name={scheme === "dark" ? "moon" : "sunny"} size={size * 0.45} color={scheme === "dark" ? theme.colors.textPrimary : theme.colors.orange} />
    </IconButton>
  );
}
