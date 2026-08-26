import User from "../models/User.js";
import Prescription from "../models/Prescription.js";
import Medicine from "../models/Medicine.js";
import Reminder from "../models/Reminder.js";
import Chat from "../models/Chat.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { canChangeRole, canSuspend, canDelete } from "../utils/adminGuards.js";

/**
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 * @desc    Platform-wide counts for the admin dashboard.
 */
export const getStats = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersLast7Days,
    suspendedUsers,
    totalPrescriptions,
    prescriptionsByStatus,
    totalMedicines,
    medicinesNeedingReview,
    activeReminders,
    totalChats,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    User.countDocuments({ isSuspended: true }),
    Prescription.countDocuments(),
    Prescription.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Medicine.countDocuments(),
    Medicine.countDocuments({ needsReview: true }),
    Reminder.countDocuments({ active: true }),
    Chat.countDocuments(),
  ]);

  const statusBreakdown = prescriptionsByStatus.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      newUsersLast7Days,
      suspendedUsers,
      totalPrescriptions,
      prescriptionsByStatus: statusBreakdown,
      totalMedicines,
      medicinesNeedingReview,
      activeReminders,
      totalChats,
    },
  });
});

/**
 * @route   GET /api/admin/users
 * @access  Private/Admin
 * @desc    Paginated, searchable user list.
 */
export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    const regex = new RegExp(req.query.search.trim(), "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }
  if (req.query.role) filter.role = req.query.role;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 * @desc    Single user plus their activity counts across the app.
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const [prescriptionCount, medicineCount, reminderCount, chatCount] = await Promise.all([
    Prescription.countDocuments({ user: user._id }),
    Medicine.countDocuments({ user: user._id }),
    Reminder.countDocuments({ user: user._id }),
    Chat.countDocuments({ user: user._id }),
  ]);

  res.status(200).json({
    success: true,
    user,
    activity: { prescriptionCount, medicineCount, reminderCount, chatCount },
  });
});

/**
 * @route   PUT /api/admin/users/:id/role
 * @access  Private/Admin
 * @desc    Promote or demote a user. Admins can't demote themselves,
 *          which would otherwise risk locking every admin out at once.
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["user", "admin"].includes(role)) {
    throw new AppError("Role must be 'user' or 'admin'", 400);
  }

  if (!canChangeRole(req.params.id, req.user.id, role)) {
    throw new AppError("You can't remove your own admin role", 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );
  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({ success: true, user });
});

/**
 * @route   PUT /api/admin/users/:id/suspend
 * @access  Private/Admin
 * @desc    Suspend or reinstate a user. A suspended user is rejected
 *          at login and by the `protect` middleware on every existing
 *          session, so this takes effect immediately, not just on
 *          their next login.
 */
export const setUserSuspension = asyncHandler(async (req, res) => {
  const { isSuspended } = req.body;
  if (typeof isSuspended !== "boolean") {
    throw new AppError("isSuspended must be true or false", 400);
  }

  if (!canSuspend(req.params.id, req.user.id, isSuspended)) {
    throw new AppError("You can't suspend your own account", 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isSuspended },
    { new: true, runValidators: true }
  );
  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({ success: true, user });
});

/**
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 * @desc    Deletes a user and cascades to everything they own, so no
 *          orphaned prescriptions/medicines/reminders/chats are left
 *          behind pointing at a deleted user.
 */
export const deleteUser = asyncHandler(async (req, res) => {
  if (!canDelete(req.params.id, req.user.id)) {
    throw new AppError("You can't delete your own account from the admin panel", 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  await Promise.all([
    Prescription.deleteMany({ user: user._id }),
    Medicine.deleteMany({ user: user._id }),
    Reminder.deleteMany({ user: user._id }),
    Chat.deleteMany({ user: user._id }),
  ]);
  await user.deleteOne();

  res.status(200).json({ success: true, message: "User and all their data deleted" });
});

/**
 * @route   GET /api/admin/prescriptions
 * @access  Private/Admin
 * @desc    Cross-user prescription oversight, for support/moderation.
 */
export const listAllPrescriptions = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [prescriptions, total] = await Promise.all([
    Prescription.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email"),
    Prescription.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    prescriptions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});
