import { useLayoutEffect } from "react";
import { useNavigation } from "expo-router";
import { useTheme } from "../context/ThemeContext";

/**
 * Applies the current light/dark theme to this screen's native stack
 * header. app/_layout.jsx sets each route's `title` statically (it can't
 * react to theme changes), so the three Part 2 detail/upload screens call
 * this to keep their header in sync with the toggle instead of staying
 * stuck in the old fixed-dark header style. Screens outside Part 2 don't
 * call this and are unaffected.
 */
export default function useThemedHeader() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: theme.colors.textPrimary,
      headerTitleStyle: { color: theme.colors.textPrimary, fontWeight: "700" },
      headerShadowVisible: false,
    });
  }, [navigation, theme]);
}
