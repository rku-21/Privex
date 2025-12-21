import express from 'express';
import {protectRoute} from '../middleware/auth.protectRoute.js';
import {removeRequest,getAllUsers,searchUsers, friendRequestSend,friendRequestAccept,friendRejected,getAllfriends,getAllrequests,getMessagesBetweenUsers,sendMessges,getAllsendRequest, getUserById, markMessagesAsRead} from '../controllers/message.controller.js';
const router= express.Router();
router.get("/friends-requests", protectRoute, getAllrequests);
router.get("/friends-send",protectRoute,getAllsendRequest);
router.get("/users",protectRoute, getAllUsers);
router.get("/search", protectRoute, searchUsers); // Search with pagination
router.get("/friends", protectRoute, getAllfriends);
router.post("/send/:id", protectRoute,sendMessges);
router.post("/friends/send/:id",protectRoute,friendRequestSend);
router.delete("/friends/cancel/:id", protectRoute, removeRequest); // Cancel sent request
router.delete("/friends/remove/:id", protectRoute,friendRejected); // Reject/remove friend
router.post("/friends/accept/:id",protectRoute,friendRequestAccept);
router.get("/user/:id", protectRoute, getUserById);
 // New endpoint to get user by ID
router.post("/:id/read",protectRoute, markMessagesAsRead);
router.get("/:id", protectRoute, getMessagesBetweenUsers);




export default router;

