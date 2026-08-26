import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { getTimeline, getHealthScore } from "../controllers/healthInsights.controller.js";

const router = Router();

router.use(protect);

router.get("/timeline", getTimeline);
router.get("/score", getHealthScore);

export default router;
