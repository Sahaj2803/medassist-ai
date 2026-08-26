import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import PageLoader from "./PageLoader.jsx";

/**
 * Wrap /admin routes with this instead of ProtectedRoute. Redirects
 * unauthenticated users to /login (same as ProtectedRoute) but also
 * redirects logged-in non-admins to /dashboard rather than exposing
 * the admin panel's existence with a 403 page.
 */
function AdminRoute() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

export default AdminRoute;
