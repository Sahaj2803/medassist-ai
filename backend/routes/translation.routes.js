import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { syncLanguage } from "../controllers/translation.controller.js";
const router = Router();
router.post("/sync", protect, syncLanguage);
export default router;
