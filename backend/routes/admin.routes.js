import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getStats,
  listUsers,
  getUserById,
  updateUserRole,
  setUserSuspension,
  deleteUser,
  listAllPrescriptions,
} from "../controllers/admin.controller.js";

const router = Router();

// Every route below requires a valid session AND the "admin" role.
router.use(protect, authorize("admin"));

router.get("/stats", getStats);

router.get("/users", listUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/suspend", setUserSuspension);
router.delete("/users/:id", deleteUser);

router.get("/prescriptions", listAllPrescriptions);

export default router;
