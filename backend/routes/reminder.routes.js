import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  listReminders,
  getToday,
  getStats,
  createReminder,
  updateReminder,
  deleteReminder,
  markReminder,
} from "../controllers/reminder.controller.js";

const router = Router();

router.use(protect);

router.get("/today", getToday);
router.get("/stats", getStats);

router.route("/").get(listReminders).post(createReminder);

router.route("/:id").put(updateReminder).delete(deleteReminder);

router.put("/:id/mark", markReminder);

export default router;
