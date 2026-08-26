import { env } from "../config/env.js";

/**
 * Signs a JWT for the given user, sets it as an httpOnly cookie,
 * and sends the standard { success, token, user } response body.
 * Centralizing this keeps register/login/updateProfile consistent.
 */
export const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const cookieOptions = {
    expires: new Date(
      Date.now() + env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  };

  res.status(statusCode).cookie("token", token, cookieOptions).json({
    success: true,
    token,
    user,
  });
};
