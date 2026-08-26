import { Router } from "express";
import { body } from "express-validator";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  getDietContext,
  generateDietGuide,
  regenerateDietGuide,
  getDietGuideHistory,
  getDietGuideById,
  deleteDietGuide,
} from "../controllers/diet.controller.js";

const router = Router();

router.use(protect);

const generateValidation = [
  body("labReportId").optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage("Invalid lab report selected"),
  body("age").optional({ nullable: true, checkFalsy: true }).isInt({ min: 0, max: 130 }).withMessage("Age must be between 0 and 130"),
];

router.get("/context", getDietContext);
router.get("/history", getDietGuideHistory);
router.post("/generate", generateValidation, validate, generateDietGuide);
router.post("/:id/regenerate", regenerateDietGuide);
router.route("/:id").get(getDietGuideById).delete(deleteDietGuide);

export default router;
