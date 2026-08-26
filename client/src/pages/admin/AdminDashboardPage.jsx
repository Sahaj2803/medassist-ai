import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineShieldCheck, HiOutlineUsers } from "react-icons/hi2";
import adminService from "../../services/adminService.js";
import AdminStatCard from "../../components/admin/AdminStatCard.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminService
      .getStats()
      .then((data) => setStats(data.stats))
      .catch((err) => toast.error(err.response?.data?.message || "Could not load admin stats"));
  }, []);

  if (!stats) return <PageLoader />;

  const { prescriptionsByStatus } = stats;

  return (
    <div className="container-shell py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="section-eyebrow flex items-center gap-1.5">
            <HiOutlineShieldCheck className="h-4 w-4" />
            Admin
          </span>
          <h1 className="mt-3 text-3xl font-bold text-white">Platform overview</h1>
        </div>
        <Link to="/admin/users" className="btn-primary">
          <HiOutlineUsers className="h-4 w-4" />
          Manage users
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Total users"
          value={stats.totalUsers}
          sublabel={`+${stats.newUsersLast7Days} in last 7 days`}
        />
        <AdminStatCard
          label="Suspended users"
          value={stats.suspendedUsers}
          accent={stats.suspendedUsers > 0 ? "text-alert-400" : "text-white"}
        />
        <AdminStatCard label="Total prescriptions" value={stats.totalPrescriptions} />
        <AdminStatCard label="Total medicines" value={stats.totalMedicines} />
        <AdminStatCard
          label="Needing review"
          value={stats.medicinesNeedingReview}
          accent={stats.medicinesNeedingReview > 0 ? "text-amber-400" : "text-white"}
        />
        <AdminStatCard label="Active reminders" value={stats.activeReminders} />
        <AdminStatCard label="Chat conversations" value={stats.totalChats} />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-white">Prescriptions by status</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["processing", "needs_review", "processed", "failed"].map((status) => (
            <AdminStatCard
              key={status}
              label={status.replace("_", " ")}
              value={prescriptionsByStatus[status] || 0}
              accent={status === "failed" ? "text-alert-400" : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
