import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError, asyncHandler } from "./errorHandler.js";
import User from "../models/User.js";

/**
 * Verifies a JWT from either the httpOnly cookie or the
 * Authorization: Bearer header, loads the user, and attaches
 * it to req.user. Use on any route that requires a logged-in user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new AppError("Not authorized. Please log in.", 401);
  }

  const decoded = jwt.verify(token, env.JWT_SECRET);

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError("The user for this session no longer exists.", 401);
  }

  if (user.isSuspended) {
    throw new AppError(
      "This account has been suspended. Contact support if you believe this is a mistake.",
      403
    );
  }

  req.user = user;
  next();
});

/**
 * Restricts a route to specific roles. Must run after `protect`.
 * Usage: router.delete("/:id", protect, authorize("admin"), handler)
 */
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(
        `Role '${req.user.role}' is not permitted to perform this action`,
        403
      );
    }
    next();
  };
