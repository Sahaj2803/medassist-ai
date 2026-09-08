import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import authApi from "../services/authApi";
import secureStorage from "../utils/secureStorage";
import { registerUnauthorizedHandler } from "../services/api";

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
        setUser(freshUser);
        setStatus("authenticated");
      } catch {
        await clearSession();
      }
    })();
  }, [clearSession]);

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
    setUser(data.user);
    setStatus("authenticated");
  }, []);

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
      const data = await authApi.register(payload);
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
    await clearSession();
  }, [clearSession]);

  const updateProfile = useCallback(async (payload) => {
    const { user: updatedUser } = await authApi.updateProfile(payload);
    await secureStorage.setUser(updatedUser);
    setUser(updatedUser);
    return updatedUser;
  }, []);

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
