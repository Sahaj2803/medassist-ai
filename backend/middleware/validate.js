import { validationResult } from "express-validator";
import { AppError } from "./errorHandler.js";

/**
 * Runs after an express-validator validation chain.
 * Collects all field errors into one readable message
 * and forwards a 400 AppError to the centralized handler.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(", ");
    return next(new AppError(message, 400));
  }
  next();
};
