import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

/**
 * Access the current auth state and actions (login, register,
 * logout, updateProfile, updatePassword) from any component.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default useAuth;
