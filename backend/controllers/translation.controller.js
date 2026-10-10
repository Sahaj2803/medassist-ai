import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import { syncUserLanguage } from "../services/translation.service.js";

export const syncLanguage = asyncHandler(async (req, res) => {
  const language = req.body?.language;
  if (!["en", "hi", "gu"].includes(language)) throw new AppError("Choose English, Hindi, or Gujarati.", 400);
  const result = await syncUserLanguage(req.user.id, language);
  res.status(200).json({ success: true, message: "Saved AI content language sync finished.", result });
});
