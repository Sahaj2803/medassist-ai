/**
 * Pure guard functions deciding whether an admin action targeting a
 * user is allowed to proceed against themselves. Extracted from
 * admin.controller.js so the exact rules (no self-demote, no
 * self-suspend, no self-delete) can be unit tested without a database
 * or an HTTP request/response cycle.
 */

/** An admin may not remove their own admin role (would risk locking every admin out). */
export function canChangeRole(targetId, actingUserId, newRole) {
  if (targetId === actingUserId && newRole !== "admin") return false;
  return true;
}

/** An admin may not suspend their own account. */
export function canSuspend(targetId, actingUserId, isSuspended) {
  if (targetId === actingUserId && isSuspended) return false;
  return true;
}

/** An admin may never delete their own account from the panel. */
export function canDelete(targetId, actingUserId) {
  return targetId !== actingUserId;
}

export default { canChangeRole, canSuspend, canDelete };
