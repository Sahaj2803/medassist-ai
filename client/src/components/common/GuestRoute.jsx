import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import PageLoader from "./PageLoader.jsx";

/**
 * Wrap /login, /register, /forgot-password so an already
 * authenticated user is redirected straight to the dashboard
 * instead of seeing the auth forms again.
 */
function GuestRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
