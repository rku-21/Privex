import express from "express";
import { protectRoute } from "../middleware/auth.protectRoute.js";
import {
	getAllrequests,
	getAllsendRequest,
	getAllfriends,
	friendRequestSend,
	removeRequest,
	friendRejected,
	friendRequestAccept,
} from "../controllers/friends.contorller.js";

const router = express.Router();

// Keep static routes first and dynamic routes later.
router.get("/requests", protectRoute, getAllrequests);
router.get("/send", protectRoute, getAllsendRequest);
router.get("/", protectRoute, getAllfriends);
router.post("/send/:id", protectRoute, friendRequestSend);
router.delete("/cancel/:id", protectRoute, removeRequest);
router.delete("/remove/:id", protectRoute, friendRejected);
router.post("/accept/:id", protectRoute, friendRequestAccept);

export default router;