import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/User.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:"http://localhost:5173",
    credentials: true,
  },
});

const userSocketMap = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (!userId) {
    console.log("User connected without userId");
    return;
  }

  console.log(`User connected: ${userId}, socketId: ${socket.id}`);

  userSocketMap[userId] = socket.id;
  console.log(`Mapped userId ${userId} to socketId ${socket.id}`);
  console.log(`Current online users: ${Object.keys(userSocketMap).join(', ')}`);

  io.emit("getOnlineUsers", Object.keys(userSocketMap));





  // going to handle the call events here 
    // =============================
  // going to handle the call events here





  // Handle call timeout
  socket.on("call-timeout", ({ to, from }) => {
    const receiverSocketId = getReceiverSocketId(to);
    console.log("[SERVER] Call timeout event received. From:", from, "To:", to);
    console.log("[SERVER] Receiver socket ID:", receiverSocketId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-timeout", { from });
      console.log("[SERVER] call-timeout event forwarded to socket:", receiverSocketId);
    } else {
      console.error("[SERVER] Could not find socket for user:", to);
    }
  });

  //  when a user wants to call another its emit is in frontend
  socket.on("call-user",async({to,offer,callType,from})=>{
    console.log("call-user  event receiverd:", to, "from:", from);
    const caller= await User.findById(from).select("fullname profilePicture");
    // if(!caller){
    //   console.error("Caller not found for ID:", from);
    // }
    const targetId=userSocketMap[to];
    if(targetId){
      io.to(targetId).emit("incoming-call",{
        from:{_id:from,fullname:caller.fullname,profilePicture:caller.profilePicture},
        callType,
        offer,

      })
    }
  });


  // when the called user answers the call
  socket.on("answer-call",({to,answer})=>{
    console.log("answer-call event received for:", to);
    console.log("Finding socket for user ID:", to);
    const targetId = userSocketMap[to];
    
    if(targetId){
      console.log("Emitting call-accepted to socket ID:", targetId);
      io.to(targetId).emit("call-accepted", {
        answer
      });
      console.log("call-accepted event emitted with answer");
    } else {
      console.error("Cannot emit call-accepted: Target user not found in socket map");
      console.log("Available users in socket map:", Object.keys(userSocketMap));
    }
  })

  // if call is accepted then we will exchange the ice candidates \
  // both the receiver and caller will emit ice candidates when found and this handler will exchange them
  socket.on("ice-candidate",({to,candidate})=>{
    console.log("ice-candidate event received for:", to,candidate);
    const targetId=userSocketMap[to];
    if(targetId){
      io.to(targetId).emit("ice-candidate",{
        candidate
      });
    }
  });


  // if the user is rejecting the call
  socket.on("reject-call",({to})=>{
    console.log("reject-call event received for:", to);
    const targetId=userSocketMap[to];
    if(targetId){
      console.log("Emitting call-rejected to:", targetId);
      io.to(targetId).emit("call-rejected");
    } else {
      console.log("Target user not online, cannot send call rejection");
    }
  });

  // handle the call ended event 
  socket.on("call-ended",({to})=>{
    console.log("call-ended event received for:", to);
    const targetId=userSocketMap[to];
    if(targetId){
      io.to(targetId).emit("call-ended");
    }
  });

  // listen for the senerio when the caller itself cancels the call before being answered
  socket.on("cancel-call",({to})=>{
    console.log("cancel-call event received for:", to);
    const targetId=userSocketMap[to];
    if(targetId){
      io.to(targetId).emit("call-cancelled");
    }
  });



  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);
    
    // Notify any peers in active calls with this user that the call has ended
    for (const [peerId, peerSocketId] of Object.entries(userSocketMap)) {
      if (peerId !== userId) {
        // Send call-ended event to any potential peers
        io.to(peerSocketId).emit("peer-disconnected", { userId });
      }
    }
    
    if (userId && userSocketMap[userId]) delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };


// Yes, Rahul — this backend socket code is looking **very solid** and essentially complete for a basic WebRTC signaling server. ✅

// Here’s the step-by-step logic of what it does:

// 1. **Connection & mapping**:

//    * When a user connects, their `userId` is mapped to `socket.id` in `userSocketMap`.
//    * Emits `getOnlineUsers` to everyone to update the online list.

// 2. **Call signaling**:

//    * `call-user`: Caller emits → server forwards `incoming-call` to the receiver.
//    * `answer-call`: Receiver emits → server forwards `call-accepted` to the caller.
//    * `ice-candidate`: Both peers emit → server forwards the candidate to the other peer. ✅ Works bidirectionally because each emission has the `to` field.
//    * `reject-call` and `call-ended`: For rejecting or ending a call, server just forwards the event.

// 3. **Disconnect handling**:

//    * When a user disconnects, removes their mapping and updates online users.

// **Next step for you:**

// * Make sure the frontend emits the correct events with `to` and `from` IDs.
// * Test one feature at a time: first `call-user` + `incoming-call`, then `answer-call`, then `ice-candidate`.
// * You can add `console.log` in each socket handler to debug: e.g., `console.log("ICE candidate from", from, "to", to)`.



