import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
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

  // ================================
  // 🟢 CALLING FEATURE EVENTS
  // ================================

  // when a user starts a call
  socket.on("call-user", ({to,offer,type}) =>{
    console.log(`Call attempt from ${userId} to ${to} (${type})`);
    console.log(`Current online users: ${Object.keys(userSocketMap).join(', ')}`);
    
    const receiverSocketId=userSocketMap[to];
    if(receiverSocketId){
      console.log(`Found socket ID ${receiverSocketId} for user ${to}`);
      
      io.to(receiverSocketId).emit("incoming-call", {
        from: userId,
        offer,
        type
      });
      
      console.log(`Sent incoming-call to ${to} via socket ${receiverSocketId}`);
      
      // Send confirmation back to caller that we found the recipient
      socket.emit("call-status", { 
        status: "ringing", 
        recipient: to,
        message: `Call initiated to ${to}` 
      });
    } else {
      console.error(`Failed to find socket for user ${to}`);
      // Send error back to caller
      socket.emit("call-status", { 
        status: "failed", 
        recipient: to,
        message: `User ${to} is not online or not found` 
      });
    }
  });

  // when the receiver answers the call
  socket.on("answer-call", ({to, answer})=>{
    console.log(`Call answer from ${userId} to ${to}`);
    console.log(`Current online users: ${Object.keys(userSocketMap).join(', ')}`);
    
    const callerSocketId=userSocketMap[to];
    if(callerSocketId){
      console.log(`Found socket ID ${callerSocketId} for caller ${to}`);
      io.to(callerSocketId).emit("call-accepted", { from:userId, answer});
      console.log(`Sent call-accepted to ${to} via socket ${callerSocketId}`);
    } else {
      console.error(`Failed to find socket for user ${to} when answering call`);
    }
  });

   // when either peer sends an ICE candidate
  socket.on("ice-candidate", ({ to, candidate }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", {
        from: userId,
        candidate,
      });
      console.log(`ICE candidate sent from ${userId} to ${to}`);
    } else {
      console.error(`Failed to find socket for user ${to} when sending ICE candidate`);
    }
  });

  // to handle call ending
  socket.on("end-call", ({ to }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended", { from: userId });
      console.log(`🔴 Call ended between ${userId} and ${to}`);
    } else if (to) {
      // Only log that we couldn't find the target
      console.log(`🔴 Could not find socket for user ${to} to end call`);
    } else {
      // This is a special case where we're cleaning up a call but don't have a specific target
      // Just log it, but DON'T broadcast to everyone
      console.log(`🔴 Call cleanup initiated by ${userId} (no broadcast)`);
    }
  });

  // when the receiver rejects the call
  socket.on("reject-call", ({ to }) => {
    const callerSocketId = userSocketMap[to];
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-rejected", { from: userId });
      console.log(`🚫 Call rejected by ${userId}`);
    }
  });
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);
    if (userId && userSocketMap[userId]) delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };

