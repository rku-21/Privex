import { redis,addUserSocket,removeUserSocket,getUserSockets,getOnlineUsers,refreshSocketPresence } from "./redisPresence.js";
import { CallsocketEvents}  from "./call.socket.js";
import "dotenv/config";
import { Server } from "socket.io";
import http from "http";
import express from "express";
import {createAdapter} from "@socket.io/redis-adapter"
import {MessageSocketEvents,emitMessageToUser} from "./message.Socket.js";
import { activeCalls} from "./call.socket.js";

const pubClient=redis;
const subClient=redis.duplicate();

await subClient.connect();
console.log("Redis connected");


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? true : "http://localhost:5173",
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});
io.adapter(createAdapter(pubClient,subClient));


// Track the heartBeat interval for each Socket
const socketHeartbeats = new Map(); 
const TTL_REFRESH_INTERVAL_MS = 15000; 


// make the socket connection 
io.on("connection", async (socket) => {
  const userId = socket.handshake.query?.userId;
  if (!userId || userId === "undefined" || userId === "null") {
    socket.disconnect(true);
    return;
  }
  try {
    await addUserSocket(userId, socket.id);
    socket.userId = userId;
    
    
    // TTL key presence starting heartbeat for this socket
    const heartbeatInterval = setInterval(async () => {
      try {
        await refreshSocketPresence(socket.id);
        console.log(`socket with id ${socket.id} TTL is refreshed`);
      } catch(error) {
        console.error(`Error in refreshing the TTL of socket with id ${socket.id}`);
      }
    }, TTL_REFRESH_INTERVAL_MS);
    
    socketHeartbeats.set(socket.id, heartbeatInterval);
    
    // get the online users and broadcast as new User is connected 
    const onlineUsers = await getOnlineUsers();
     io.emit("getOnlineUsers", onlineUsers);
   } catch (error) {
    socket.emit("connection error", { message: "connection failed" });
  }
  // initilize all message related event for this user 
  MessageSocketEvents(io, socket);

  // make ready this socekt for the call events 
  CallsocketEvents(io,socket); 

  socket.on("disconnect", async () => {
    console.log(`User ${userId} disconnected, removing socket ${socket.id}`);

    try {
       if(socketHeartbeats.has(socket.id)) {
         clearInterval(socketHeartbeats.get(socket.id));
         socketHeartbeats.delete(socket.id);
        }
       
       // Remove the socket from Redis
       await removeUserSocket(socket.userId, socket.id);
       
       // Check remaining sockets
       const remainingSockets = await getUserSockets(socket.userId);
       if (remainingSockets.length === 0) {
        // End any active calls
        for (const [callId, call] of activeCalls.entries()) {
          if (call.callerId === socket.userId || call.receiverId === socket.userId) {
            const otherUserId = call.callerId === socket.userId ? call.receiverId : call.callerId;
            await emitToUser(otherUserId, "peer-disconnected", { callId, userId:socket.userId});
            cleanupCall(callId);
          }
        }
      } else {
        // user is still online 
      }
      //Broadcast updated online users to ALL connected clients
      const onlineUsers = await getOnlineUsers();
      io.emit("getOnlineUsers", onlineUsers);
      } catch (error) {
      console.error("Error handling disconnect", error);
    }
  });
});


/**
 * Cleanup all active heartbeat intervals
 * Call this when server is shutting down
 */
function cleanupAllHeartbeats() {
  socketHeartbeats.forEach((interval, socketId) => {
    clearInterval(interval);
  });
  socketHeartbeats.clear();
 
}
/**
 * @param {string} userId 
 * @returns {Promise<string|null>}
 */
export async function getReceiverSocketId(userId) {
  const socketIds = await getUserSockets(userId);
  return socketIds[0] || null; 
}
export { io, app, server, cleanupAllHeartbeats };




