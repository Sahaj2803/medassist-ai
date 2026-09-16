import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildTheme } from "../constants/theme";

// Part 2 theme infrastructure — see the note in constants/theme.js. Reused
// as-is if/when Part 1 lands with its own ThemeProvider of the same name.
const STORAGE_KEY = "medassist_theme_mode"; // "light" | "dark" | "system"

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState("system");

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark" || saved === "system") {
          setMode(saved);
        }
      } catch {
        // No persisted preference yet — default ("system") stands.
      }
    })();
  }, []);

  const scheme = mode === "system" ? (systemScheme === "light" ? "light" : "dark") : mode;
  const theme = useMemo(() => buildTheme(scheme), [scheme]);

  const setThemeMode = (next) => {
    setMode(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const toggleTheme = () => setThemeMode(scheme === "dark" ? "light" : "dark");

  const value = useMemo(
    () => ({ theme, scheme, mode, setThemeMode, toggleTheme }),
    [theme, scheme, mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme() must be used within a <ThemeProvider>");
  }
  return ctx;
}

export default ThemeProvider;
