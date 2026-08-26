import { Router } from "express";
import { body } from "express-validator";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { uploadPrescriptionFile } from "../middleware/upload.js";
import {
  uploadPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  updateMedicine,
  addMedicine,
  analyzePrescription,
} from "../controllers/prescription.controller.js";

const router = Router();

router.use(protect);

const addMedicineValidation = [
  body("name").trim().notEmpty().withMessage("Medicine name is required"),
];

router
  .route("/")
  .get(getPrescriptions)
  .post(uploadPrescriptionFile, uploadPrescription);

router
  .route("/:id")
  .get(getPrescriptionById)
  .put(updatePrescription)
  .delete(deletePrescription);

router.post("/:id/medicines", addMedicineValidation, validate, addMedicine);
router.put("/:id/medicines/:medicineId", updateMedicine);
router.post("/:id/analyze", analyzePrescription);

export default router;
