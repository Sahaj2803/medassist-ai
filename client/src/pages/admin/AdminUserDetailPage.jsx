import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineArrowLeft, HiOutlineUserCircle } from "react-icons/hi2";
import adminService from "../../services/adminService.js";
import { useAuth } from "../../hooks/useAuth.js";
import AdminStatCard from "../../components/admin/AdminStatCard.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";

function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [targetUser, setTargetUser] = useState(null);
  const [activity, setActivity] = useState(null);

  const load = () => {
    adminService
      .getUser(id)
      .then((data) => {
        setTargetUser(data.user);
        setActivity(data.activity);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "User not found");
        navigate("/admin/users");
      });
  };

  useEffect(load, [id, navigate]);

  const isSelf = targetUser?._id === currentUser?._id;

  const handleRoleChange = async (role) => {
    try {
      const { user: updated } = await adminService.updateRole(id, role);
      setTargetUser(updated);
      toast.success(`Role updated to ${role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update role");
    }
  };

  const handleToggleSuspend = async () => {
    try {
      const { user: updated } = await adminService.setSuspension(id, !targetUser.isSuspended);
      setTargetUser(updated);
      toast.success(updated.isSuspended ? "User suspended" : "User reinstated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update user");
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Delete ${targetUser.name}? This permanently removes their prescriptions, medicines, reminders, and chats too.`
      )
    )
      return;
    try {
      await adminService.deleteUser(id);
      toast.success("User deleted");
      navigate("/admin/users");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete user");
    }
  };

  if (!targetUser || !activity) return <PageLoader />;

  return (
    <div className="container-shell max-w-3xl py-16">
      <button
        type="button"
        onClick={() => navigate("/admin/users")}
        className="flex items-center gap-1.5 text-sm text-mist-400 hover:text-white"
      >
        <HiOutlineArrowLeft className="h-4 w-4" />
        Back to users
      </button>

      <div className="mt-6 flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-gradient">
          <HiOutlineUserCircle className="h-9 w-9 text-white" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-white">{targetUser.name}</h1>
          <p className="text-sm text-mist-400">{targetUser.email}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <AdminStatCard label="Prescriptions" value={activity.prescriptionCount} />
        <AdminStatCard label="Medicines" value={activity.medicineCount} />
        <AdminStatCard label="Reminders" value={activity.reminderCount} />
        <AdminStatCard label="Chats" value={activity.chatCount} />
      </div>

      <div className="glass-panel mt-8 p-6">
        <h2 className="text-lg font-semibold text-white">Account controls</h2>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Role</p>
            <p className="text-xs text-mist-400">
              Admins can access the admin panel and manage other users.
            </p>
          </div>
          <select
            value={targetUser.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={isSelf}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
          <div>
            <p className="text-sm font-medium text-white">Account status</p>
            <p className="text-xs text-mist-400">
              A suspended user is signed out immediately and can't log back in.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleSuspend}
            disabled={isSelf}
            className="btn-secondary !px-4 !py-2 text-sm disabled:opacity-50"
          >
            {targetUser.isSuspended ? "Reinstate account" : "Suspend account"}
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
          <div>
            <p className="text-sm font-medium text-white">Delete account</p>
            <p className="text-xs text-mist-400">
              Permanently removes the user and all their data. Can't be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSelf}
            className="rounded-lg border border-alert-500/30 px-4 py-2 text-sm text-alert-400 hover:bg-alert-500/10 disabled:opacity-50"
          >
            Delete user
          </button>
        </div>

        {isSelf && (
          <p className="mt-4 text-xs text-mist-400">
            You can't change your own role, suspend, or delete your own account from here.
          </p>
        )}
      </div>
    </div>
  );
}

export default AdminUserDetailPage;
