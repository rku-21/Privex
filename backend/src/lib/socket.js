import { redis,addUserSocket,removeUserSocket,getUserSockets,getOnlineUsers } from "./redisPresence.js";
import "dotenv/config";
import { Server } from "socket.io";
import http from "http";
import express from "express";
import { randomUUID } from "crypto";
import User from "../models/user.model.js";
import {createAdapter} from "@socket.io/redis-adapter"

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

const activeCalls = new Map();
const callTimeouts = new Map();

const CALL_TIMEOUT_MS = 30000;
const MAX_ICE_BUFFER_SIZE = 50;

/** 
 
 * @param {string} userId 
 * @param {string} event 
 * @param {object} payload 
 */

async function emitToUser(userId, event, payload) {
  try {
    const socketIds = await getUserSockets(userId);
    // user is offline 
    if (socketIds.length === 0) {
      return false;
    }
    // for each user emit the event
    socketIds.forEach(socketId => {
      io.to(socketId).emit(event, payload);
    });
    return true;
  } catch (error) {
    console.error(`Some error occured ${error}`);
    return false;
  }
}

/**
 * @param {string} callId 
 */
function cleanupCall(callId) {
  if (callTimeouts.has(callId)) {
    clearTimeout(callTimeouts.get(callId));
    callTimeouts.delete(callId);
  }
  activeCalls.delete(callId);

}


io.on("connection", async (socket) => {
  const userId = socket.handshake.query?.userId;
  console.log("user connected to the port ",process.env.PORT);
  if (!userId || userId === "undefined" || userId === "null") {
    socket.disconnect(true);
    return;
  }
  try {
    await addUserSocket(userId, socket.id);
    socket.userId = userId;
    const onlineUsers = await getOnlineUsers();
    io.emit("getOnlineUsers", onlineUsers);
  } catch (error) {
    socket.emit("connection error", { message: "connection failed" });
  }

  socket.on("call-user", async ({ to, offer, callType, from }) => {
    try {
        if (!to || !offer || !from) {
        console.error("Invalid call payload");
        return;
      }
      const caller = await User.findById(from).select("fullname profilePicture");
      if (!caller) {
         socket.emit("call-error", { message: "Caller not found" });
        return;
      }
      //create unique call session id 
      const callId = randomUUID();

      activeCalls.set(callId, {
        callId,
        callerId: from,
        receiverId: to,
        callType,
        status: "ringing",
        iceCandidates: [],
        createdAt: Date.now(),
      });


      const timeout = setTimeout(async () => {
        const call = activeCalls.get(callId);
        if (call && call.status === "ringing") {
          await emitToUser(call.callerId, "call-timeout", { callId });
          await emitToUser(call.receiverId, "call-timeout", { callId });
           cleanupCall(callId);
        }
      }, CALL_TIMEOUT_MS);
      callTimeouts.set(callId, timeout);  // (callid ,timerid)


      const sent = await emitToUser(to, "incoming-call", {
        callId,
        from: {
          _id: from,
          fullname: caller.fullname,
          profilePicture: caller.profilePicture,
        },
        callType,
        offer,
      });
      // receiver is offline 
      if (!sent) {
      socket.emit("call-error", { message: "User is offline" });
        cleanupCall(callId);
      } else {
        socket.emit("call-initiated", { callId });
      }
    } catch (error) {
      socket.emit("call-error", { message: "Failed to initiate call" });
    }
  });

  // listen when user answer the call 
  socket.on("answer-call", async ({ callId, answer }) => {
    try {
      const call = activeCalls.get(callId);
      if (!call) {
        socket.emit("call-error", { message: "Call not found" });
        return;
      }
      if (call.status !== "ringing") {
             return;
      }

      // Update call status and clear timeout & send answer to all caller devices
      call.status = "accepted";
      if (callTimeouts.has(callId)) {
        clearTimeout(callTimeouts.get(callId));
        callTimeouts.delete(callId);
      }

      await emitToUser(call.callerId, "call-accepted", {
        callId,
        answer,
      });

     
      //flusing the buffered candiate 
      if (call.iceCandidates.length > 0) {
        
       for (const ice of call.iceCandidates) {
          await emitToUser(call.callerId, "ice-candidate", {
            callId,
            candidate: ice.candidate,
            from: ice.from,
          });
        }

        call.iceCandidates = [];
      }
   } catch (error) {
      console.error(" Error in answer call:", error);
    }
  });

  socket.on("ice-candidate", async ({ callId, candidate }) => {
    try {
      const call = activeCalls.get(callId);
      if (!call) {
        console.log(`unknown call ${callId}`);
        return;
      }

      const isFromCaller = socket.userId === call.callerId;
      const targetUserId = isFromCaller ? call.receiverId : call.callerId;

      
      if (call.status === "ringing") {
        if (call.iceCandidates.length >= MAX_ICE_BUFFER_SIZE) {
           return; // drop the candidate
        }

        call.iceCandidates.push({
          candidate,
          from: socket.userId,
          timestamp: Date.now(),
        });
       } else if (call.status === "accepted") {
        await emitToUser(targetUserId, "ice-candidate", {
          callId,
          candidate,
        });

        console.log(`Forwarded ICE candidate for call ${callId}`);
      }
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  });

  socket.on("reject-call", async ({ callId }) => {
    try {
      const call = activeCalls.get(callId);
      if (!call) {
        console.log(`Call ${callId} not found`);
        return;
      }
    await emitToUser(call.callerId, "call-rejected", { callId });

      
      cleanupCall(callId);
    } catch (error) {
      console.error("Error in reject-call:", error);
    }
  });

 
  socket.on("cancel-call", async ({ callId }) => {
    try {
      console.log(`Call ${callId} cancelled by caller`);

      const call = activeCalls.get(callId);
      if (!call) {
        console.log(`Call ${callId} not found`);
        return;
      }
    await emitToUser(call.receiverId, "call-cancelled", { callId });

     cleanupCall(callId);
    } catch (error) {
      console.error("Error in cancel-call:", error);
    }
  });

socket.on("call-ended", async ({ callId }) => {
    try {
      console.log(`Call ${callId} ended by user ${socket.userId}`);
      const call = activeCalls.get(callId);
      if (!call) {
         return;
      }

    await emitToUser(call.callerId, "call-ended", { callId });
    await emitToUser(call.receiverId, "call-ended", { callId });
     cleanupCall(callId);
    
    } catch (error) {
      console.error("Error in call-ended:", error);
    }
  });

 
  socket.on("disconnect", async () => {
    console.log(`User disconnected: ${userId}, socketId: ${socket.id}`);

    try {
       await removeUserSocket(socket.userId,socket.id);
       const remainingSockets = await getUserSockets(socket.userId);
       if (remainingSockets.length === 0) {
        console.log(`User ${socket.userId} is offline , all devices`);

        for (const [callId, call] of activeCalls.entries()) {
          if (call.callerId === socket.userId || call.receiverId === socket.userId) {
            console.log(`Auto-ending call ${callId} as `);

            const otherUserId = call.callerId === socket.userId ? call.receiverId : call.callerId;
            await emitToUser(otherUserId, "peer-disconnected", { callId, userId:socket.userId});

            cleanupCall(callId);
          }
        }
      } else {
        console.log(`User ${userId} still online on ${remainingSockets.length} other device(s)`);
      }

      // Broadcast updated online users
      const onlineUsers = await getOnlineUsers();
      io.emit("getOnlineUsers", onlineUsers);
    } catch (error) {
      console.error("Error handling disconnect", error);
    }
  });
});


/**
 * 
 * @param {string} userId 
 * @returns {Promise<string|null>}
 */
export async function getReceiverSocketId(userId) {
  const socketIds = await getUserSockets(userId);
  return socketIds[0] || null; // Return first device  socket ID
}
export { io, app, server };




