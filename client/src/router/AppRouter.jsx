import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";
import LandingPage from "../pages/LandingPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import ProtectedRoute from "../components/common/ProtectedRoute.jsx";
import AdminRoute from "../components/common/AdminRoute.jsx";
import GuestRoute from "../components/common/GuestRoute.jsx";
import PageLoader from "../components/common/PageLoader.jsx";

/**
 * Phase 8 optimization: every page except the landing page (the one
 * route almost everyone hits first) and the tiny 404 page is
 * code-split with React.lazy, so the initial bundle only ships what a
 * first-time visitor actually needs. Vite turns each of these into its
 * own chunk, fetched on demand when the route is visited.
 */
const LoginPage = lazy(() => import("../pages/auth/LoginPage.jsx"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage.jsx"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage.jsx"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage.jsx"));
const ProfilePage = lazy(() => import("../pages/ProfilePage.jsx"));
const DashboardPage = lazy(() => import("../pages/DashboardPage.jsx"));
const UploadPrescriptionPage = lazy(() => import("../pages/prescriptions/UploadPrescriptionPage.jsx"));
const PrescriptionHistoryPage = lazy(() => import("../pages/prescriptions/PrescriptionHistoryPage.jsx"));
const PrescriptionDetailPage = lazy(() => import("../pages/prescriptions/PrescriptionDetailPage.jsx"));
const MedicineLibraryPage = lazy(() => import("../pages/medicines/MedicineLibraryPage.jsx"));
const RemindersPage = lazy(() => import("../pages/reminders/RemindersPage.jsx"));
const ChatPage = lazy(() => import("../pages/chat/ChatPage.jsx"));
const LabReportUploadPage = lazy(() => import("../pages/labReports/LabReportUploadPage.jsx"));
const LabReportHistoryPage = lazy(() => import("../pages/labReports/LabReportHistoryPage.jsx"));
const LabReportDetailPage = lazy(() => import("../pages/labReports/LabReportDetailPage.jsx"));
const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage.jsx"));
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage.jsx"));
const AdminUserDetailPage = lazy(() => import("../pages/admin/AdminUserDetailPage.jsx"));
const HealthTimelinePage = lazy(() => import("../pages/health/HealthTimelinePage.jsx"));
const DietGuidePage = lazy(() => import("../pages/diet/DietGuidePage.jsx"));
const DietGuideHistoryPage = lazy(() => import("../pages/diet/DietGuideHistoryPage.jsx"));

function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />

          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:resetToken" element={<ResetPasswordPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/prescriptions" element={<PrescriptionHistoryPage />} />
            <Route path="/prescriptions/upload" element={<UploadPrescriptionPage />} />
            <Route path="/prescriptions/:id" element={<PrescriptionDetailPage />} />
            <Route path="/medicines" element={<MedicineLibraryPage />} />
            <Route path="/lab-reports" element={<LabReportHistoryPage />} />
            <Route path="/lab-reports/upload" element={<LabReportUploadPage />} />
            <Route path="/lab-reports/:id" element={<LabReportDetailPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route path="/health/timeline" element={<HealthTimelinePage />} />
            <Route path="/diet-guide" element={<DietGuidePage />} />
            <Route path="/diet-guide/history" element={<DietGuideHistoryPage />} />
            <Route path="/diet-guide/:id" element={<DietGuidePage />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRouter;
