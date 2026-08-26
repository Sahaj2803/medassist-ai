import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineMagnifyingGlass, HiOutlineTrash } from "react-icons/hi2";
import adminService from "../../services/adminService.js";
import { useAuth } from "../../hooks/useAuth.js";
import PageLoader from "../../components/common/PageLoader.jsx";

function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = async (searchTerm = search, pageNum = page) => {
    try {
      const data = await adminService.listUsers({ search: searchTerm, page: pageNum, limit: 20 });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load users");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    load(search, 1);
  };

  const handleToggleSuspend = async (targetUser) => {
    try {
      const { user: updated } = await adminService.setSuspension(
        targetUser._id,
        !targetUser.isSuspended
      );
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      toast.success(updated.isSuspended ? "User suspended" : "User reinstated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update user");
    }
  };

  const handleDelete = async (targetUser) => {
    if (
      !window.confirm(
        `Delete ${targetUser.name}? This permanently removes their prescriptions, medicines, reminders, and chats too.`
      )
    )
      return;
    try {
      await adminService.deleteUser(targetUser._id);
      setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));
      toast.success("User deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete user");
    }
  };

  if (!users) return <PageLoader />;

  return (
    <div className="container-shell py-16">
      <span className="section-eyebrow">Admin</span>
      <h1 className="mt-3 text-3xl font-bold text-white">Users</h1>

      <form onSubmit={handleSearchSubmit} className="mt-6 flex max-w-md gap-2">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
          />
        </div>
        <button type="submit" className="btn-secondary !px-4 !py-2 text-sm">
          Search
        </button>
      </form>

      <div className="glass-panel mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-mist-400">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Joined</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-white/[0.02]">
                <td className="px-5 py-3">
                  <Link to={`/admin/users/${u._id}`} className="font-medium text-white hover:text-signal-400">
                    {u.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-mist-300">{u.email}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.role === "admin"
                        ? "bg-signal-500/15 text-signal-400"
                        : "bg-white/10 text-mist-300"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {u.isSuspended ? (
                    <span className="rounded-full bg-alert-500/15 px-2 py-0.5 text-xs font-semibold text-alert-400">
                      Suspended
                    </span>
                  ) : (
                    <span className="rounded-full bg-signal-500/15 px-2 py-0.5 text-xs font-semibold text-signal-400">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-mist-400">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {u._id !== currentUser?._id && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggleSuspend(u)}
                          className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-mist-200 hover:bg-white/5"
                        >
                          {u.isSuspended ? "Reinstate" : "Suspend"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="rounded-lg border border-alert-500/30 p-1.5 text-alert-400 hover:bg-alert-500/10"
                          title="Delete user"
                        >
                          <HiOutlineTrash className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary !px-3 !py-1.5 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-mist-400">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary !px-3 !py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;
