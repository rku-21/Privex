import express from 'express';
import {protectRoute} from '../middleware/auth.protectRoute.js';
import {getAllUsers,searchUsers,getMessagesBetweenUsers,sendMessges, getUserById, markMessagesAsRead,getUnreadMessages, getMessagesSkip,deleteMessageById} from '../controllers/message.controller.js';
const router= express.Router();
router.get("/users",protectRoute, getAllUsers);
router.get("/search", protectRoute, searchUsers); // Search with pagination

router.get("/unreadmessages",protectRoute,getUnreadMessages);
router.post("/send/:id", protectRoute,sendMessges);
router.get("/user/:id", protectRoute, getUserById);
 // get user by id
router.post("/:id/read",protectRoute, markMessagesAsRead);
router.get("/:id", protectRoute, getMessagesBetweenUsers);
router.get("/skip/:id",protectRoute,getMessagesSkip);
router.delete("/:id",protectRoute, deleteMessageById);
export default router;


