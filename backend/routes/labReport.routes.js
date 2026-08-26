import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { uploadLabReportFile } from "../middleware/upload.js";
import {
  uploadLabReport,
  analyzeLabReport,
  getLabReports,
  getLabReportById,
  deleteLabReport,
} from "../controllers/labReport.controller.js";

const router = Router();

router.use(protect);

router.route("/").get(getLabReports);
router.post("/upload", uploadLabReportFile, uploadLabReport);
router.post("/:id/analyze", analyzeLabReport);
router.route("/:id").get(getLabReportById).delete(deleteLabReport);

export default router;
