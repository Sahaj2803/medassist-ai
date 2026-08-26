import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { listChats, getChatById, sendMessage, deleteChat } from "../controllers/chat.controller.js";

const router = Router();

router.use(protect);

router.route("/").get(listChats).post(sendMessage);
router.route("/:id").get(getChatById).delete(deleteChat);

export default router;
