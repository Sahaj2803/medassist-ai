import { Router } from "express";

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Basic liveness check used to confirm the API and
 *          folder structure are wired up correctly in Phase 1.
 * @access  Public
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    service: "MedAssist API",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
