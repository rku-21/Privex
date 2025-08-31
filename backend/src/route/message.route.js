import express from 'express';
import {protectRoute} from '../middleware/auth.protectRoute.js';
import {removeRequest,getAllUsers, friendRequestSend,friendRequestAccept,friendRejected,getAllfriends,getAllrequests,getMessagesBetweenUsers,sendMessges,getAllsendRequest} from '../controllers/message.controller.js';
const router= express.Router();
router.get("/friends-requests", protectRoute, getAllrequests);
router.get("/friends-send",protectRoute,getAllsendRequest);
router.get("/users",protectRoute, getAllUsers);
router.get("/friends", protectRoute, getAllfriends);
router.get("/:id", protectRoute, getMessagesBetweenUsers);
router.post("/send/:id", protectRoute,sendMessges);
router.post("/friends/send/:id",protectRoute,friendRequestSend);
router.delete("/friends/remove/request/:id", protectRoute,friendRejected);
router.post("/friends/accept/:id",protectRoute,friendRequestAccept);



export default router;

