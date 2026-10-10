import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import authApi from "../services/authApi";
import secureStorage from "../utils/secureStorage";
import { registerUnauthorizedHandler } from "../services/api";
import { cancelAllScheduled } from "../services/notificationScheduler";
import { useLanguage } from "./LanguageContext";
import { getLanguage } from "../i18n/runtime";

export const AuthContext = createContext(null);

/**
 * Mirrors client/src/context/AuthContext.jsx's responsibilities (session
 * state, login/register/logout, profile updates) but persists the JWT in
 * SecureStore instead of relying on a browser cookie, since sendTokenResponse()
 * already returns the token in the JSON body for exactly this purpose.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authenticated | unauthenticated
  // Language policy: the language is a DEVICE preference (persisted locally,
  // kept after sign-out so auth screens stay in the last-used language), but
  // whenever an account session starts or is restored the ACCOUNT's
  // preferredLanguage overrides it (missing/invalid -> English, never the
  // previous user's language). applyAccountLanguage has a stable identity.
  const { applyAccountLanguage } = useLanguage();

  const clearSession = useCallback(async () => {
    await secureStorage.clear();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  // Restore session on cold start: read the token, then re-validate it
  // against /auth/me rather than trusting the cached user forever.
  useEffect(() => {
    (async () => {
      const token = await secureStorage.getToken();
      if (!token) {
        setStatus("unauthenticated");
        return;
      }
      try {
        const { user: freshUser } = await authApi.getMe();
        await secureStorage.setUser(freshUser);
        // Apply the language BEFORE flipping to "authenticated" so the first
        // authenticated render is already in the account's language.
        await applyAccountLanguage(freshUser?.preferredLanguage);
        setUser(freshUser);
        setStatus("authenticated");
      } catch {
        await clearSession();
      }
    })();
  }, [clearSession, applyAccountLanguage]);

  // A 401 from any API call (expired/invalid token) drops the session
  // everywhere at once, not just on the screen that made the call.
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearSession();
    });
  }, [clearSession]);

  const persistSession = useCallback(async (data) => {
    await secureStorage.setToken(data.token);
    await secureStorage.setUser(data.user);
    await applyAccountLanguage(data.user?.preferredLanguage);
    setUser(data.user);
    setStatus("authenticated");
  }, [applyAccountLanguage]);

  const login = useCallback(
    async (email, password) => {
      const data = await authApi.login({ email, password });
      await persistSession(data);
      return data.user;
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload) => {
      // New accounts start in the language currently active on the device.
      const data = await authApi.register({ ...payload, preferredLanguage: getLanguage() });
      await persistSession(data);
      return data.user;
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the server call fails (e.g. offline), still clear locally.
    }
    // Explicit sign-out: remove this device's scheduled medicine
    // notifications so they can't fire for (or expose) the previous
    // account. Backend reminders are untouched; login re-syncs.
    try {
      await cancelAllScheduled();
    } catch {
      // Logged inside the scheduler; never block sign-out.
    }
    await clearSession();
  }, [clearSession]);

  const updateProfile = useCallback(async (payload) => {
    const { user: updatedUser } = await authApi.updateProfile(payload);
    await secureStorage.setUser(updatedUser);
    // Only re-apply when the response actually carries a language, so an
    // unrelated profile edit can never reset the active language.
    if (updatedUser?.preferredLanguage !== undefined) {
      await applyAccountLanguage(updatedUser.preferredLanguage);
    }
    setUser(updatedUser);
    return updatedUser;
  }, [applyAccountLanguage]);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, status, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
