import express from "express"
// A router is a modular route handler used to group related routes in a seprate file , which can then be mounted on a specific path in main file (index.js).

const router=express.Router();
// always keep the static routes (/request) at the top and then dynamic routes (/:id)
router.get("/requests", protectRoute, getAllrequests);
router.get("/send",protectRoute,getAllsendRequest);
router.get("/", protectRoute, getAllfriends);
router.post("/send/:id",protectRoute,friendRequestSend);
router.delete("/cancel/:id", protectRoute, removeRequest); // Cancel sent request
router.delete("/remove/:id", protectRoute,friendRejected); // remove friend
router.post("/accept/:id",protectRoute,friendRequestAccept);