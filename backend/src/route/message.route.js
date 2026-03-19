import express from 'express';
import {protectRoute} from '../middleware/auth.protectRoute.js';
import {getAllUsers,searchUsers,getMessagesBetweenUsers,sendMessges, getUserById, markMessagesAsRead} from '../controllers/message.controller.js';
const router= express.Router();
router.get("/users",protectRoute, getAllUsers);
router.get("/search", protectRoute, searchUsers); // Search with pagination
router.post("/send/:id", protectRoute,sendMessges);
router.get("/user/:id", protectRoute, getUserById);
 // get user by id
router.post("/:id/read",protectRoute, markMessagesAsRead);
router.get("/:id", protectRoute, getMessagesBetweenUsers);
export default router;

