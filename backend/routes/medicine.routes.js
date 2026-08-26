import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  listMedicines,
  getMedicineById,
  analyzeMedicine,
} from "../controllers/medicine.controller.js";

const router = Router();

router.use(protect);

router.get("/", listMedicines);
router.get("/:id", getMedicineById);
router.post("/:id/analyze", analyzeMedicine);

export default router;
