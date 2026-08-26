import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import authService from "../services/authService.js";

export const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking existing session
  const [authChecked, setAuthChecked] = useState(false);

  // On first load, ask the API if the httpOnly cookie still represents a valid session.
  useEffect(() => {
    let cancelled = false;

    authService
      .getMe()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setAuthChecked(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    setUser(data.user);
    toast.success(`Welcome to MedAssist, ${data.user.name.split(" ")[0]}!`);
    return data.user;
  }, []);

  const login = useCallback(async (payload) => {
    const data = await authService.login(payload);
    setUser(data.user);
    toast.success(`Welcome back, ${data.user.name.split(" ")[0]}!`);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    toast.success("Logged out");
  }, []);

  const updateProfile = useCallback(async (payload, options = {}) => {
    const data = await authService.updateProfile(payload);
    setUser(data.user);
    if (!options.silent) toast.success("Profile updated");
    return data.user;
  }, []);

  const updatePassword = useCallback(async (payload) => {
    const data = await authService.updatePassword(payload);
    setUser(data.user);
    toast.success("Password updated");
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authChecked,
      isAuthenticated: Boolean(user),
      register,
      login,
      logout,
      updateProfile,
      updatePassword,
    }),
    [user, loading, authChecked, register, login, logout, updateProfile, updatePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
