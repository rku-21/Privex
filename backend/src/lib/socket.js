import { Server } from "socket.io";
import http from "http";
import express from "express";
import { randomUUID } from "crypto";
import User from "../models/user.model.js";
import { addUserSocket, removeUserSocket, getUserSockets, getOnlineUsers } from "./redis.js";

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
    if (socketIds.length === 0) {
      console.log(` User ${userId} is offLine, cannot emit ${event}`);
      return false;
    }
    socketIds.forEach(socketId => {
      io.to(socketId).emit(event, payload);
    });
    console.log(`Emitted ${event} to user ${userId} (${socketIds.length} devices)`);
    return true;
  } catch (error) {
    console.error(`Error while emitting to user ${userId}:`, error);
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
  console.log(`Cleaned up call ${callId}`);
}
io.on("connection", async (socket) => {
  const userId = socket.handshake.query.userId;
  
  if (!userId || userId === "undefined" || userId === "null") {
    console.log("This user is connected without valid userId:", userId);
    socket.disconnect(true);
    return;
  }

  console.log(`User connected: ${userId}, socketId: ${socket.id}`);
  
  try {
    await addUserSocket(userId, socket.id);
    socket.userId = userId;
    const onlineUsers = await getOnlineUsers();
    console.log(`📢 Broadcasting online users after connection:`, onlineUsers);
    io.emit("getOnlineUsers", onlineUsers);
  } catch (error) {
    console.error("Error connecting user socket:", error);
    socket.emit("connection-error", { message: "connection failed" });
  }

  socket.on("call-user", async ({ to, offer, callType, from }) => {
    try {
      console.log(`${from} calling ${to} (${callType})`);

      if (!to || !offer || !from) {
        console.error("Invalid call user payload");
        return;
      }

     
      const caller = await User.findById(from).select("fullname profilePicture");
      if (!caller) {
        console.error(`Caller ${from} not found in database`);
        socket.emit("call-error", { message: "Caller not found" });
        return;
      }

      // Create unique call session
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
          console.log(`Call ${callId} timed out`);
          
          await emitToUser(call.callerId, "call-timeout", { callId });
          await emitToUser(call.receiverId, "call-timeout", { callId });
          
          cleanupCall(callId);
        }
      }, CALL_TIMEOUT_MS);

      callTimeouts.set(callId, timeout);

     
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

      if (!sent) {
        console.log(` Receiver ${to} is offline`);
        socket.emit("call-error", { message: "User is offline" });
        cleanupCall(callId);
      } else {
        
        socket.emit("call-initiated", { callId });
        console.log(` Call ${callId} initiated successfully, callId sent to caller`);
      }
    } catch (error) {
      console.error(" Error in call-user:", error);
      socket.emit("call-error", { message: "Failed to initiate call" });
    }
  });

  /**
   * STEP 2: Answer Call
   * Frontend emits: { callId, answer }
   */
  socket.on("answer-call", async ({ callId, answer }) => {
    try {
      console.log(`✅ [ANSWER-CALL] Call ${callId} answered`);

      const call = activeCalls.get(callId);
      if (!call) {
        console.error(`❌ Call ${callId} not found or already ended`);
        socket.emit("call-error", { message: "Call not found" });
        return;
      }

      if (call.status !== "ringing") {
        console.error(`❌ Call ${callId} is not in ringing state (status: ${call.status})`);
        return;
      }

      // Update call status
      call.status = "accepted";
      
      // Clear timeout
      if (callTimeouts.has(callId)) {
        clearTimeout(callTimeouts.get(callId));
        callTimeouts.delete(callId);
      }

      // Send answer to caller (all devices)
      await emitToUser(call.callerId, "call-accepted", {
        callId,
        answer,
      });

      // Flush buffered ICE candidates to caller
      if (call.iceCandidates.length > 0) {
        console.log(`📤 Flushing ${call.iceCandidates.length} buffered ICE candidates`);
        
        for (const ice of call.iceCandidates) {
          await emitToUser(call.callerId, "ice-candidate", {
            callId,
            candidate: ice.candidate,
            from: ice.from,
          });
        }
        
        call.iceCandidates = [];
      }

      console.log(`✅ Call ${callId} accepted successfully`);
    } catch (error) {
      console.error("❌ Error in answer-call:", error);
    }
  });

  /**
   * STEP 3: ICE Candidate Exchange (with buffering)
   * Frontend emits: { callId, candidate }
   */
  socket.on("ice-candidate", async ({ callId, candidate }) => {
    try {
      const call = activeCalls.get(callId);
      if (!call) {
        console.log(`⚠️ ICE candidate received for unknown call ${callId}`);
        return;
      }

      const isFromCaller = socket.userId === call.callerId;
      const targetUserId = isFromCaller ? call.receiverId : call.callerId;

      // If call not yet accepted, buffer ICE candidates
      if (call.status === "ringing") {
        if (call.iceCandidates.length >= MAX_ICE_BUFFER_SIZE) {
          console.warn(`⚠️ ICE buffer full for call ${callId}, dropping candidate`);
          return;
        }
        
        call.iceCandidates.push({
          candidate,
          from: socket.userId,
          timestamp: Date.now(),
        });
        
        console.log(`📦 Buffered ICE candidate for call ${callId} (${call.iceCandidates.length} total)`);
      } else if (call.status === "accepted") {
        // Call active, forward immediately
        await emitToUser(targetUserId, "ice-candidate", {
          callId,
          candidate,
        });
        
        console.log(`📡 Forwarded ICE candidate for call ${callId}`);
      }
    } catch (error) {
      console.error("❌ Error handling ICE candidate:", error);
    }
  });

  /**
   * STEP 4: Reject Call
   * Frontend emits: { callId }
   */
  socket.on("reject-call", async ({ callId }) => {
    try {
      console.log(`❌ [REJECT-CALL] Call ${callId} rejected`);

      const call = activeCalls.get(callId);
      if (!call) {
        console.log(`⚠️ Call ${callId} not found`);
        return;
      }

      // Notify caller
      await emitToUser(call.callerId, "call-rejected", { callId });

      // Cleanup
      cleanupCall(callId);
    } catch (error) {
      console.error("❌ Error in reject-call:", error);
    }
  });

  /**
   * STEP 5: Cancel Call (before answer)
   * Frontend emits: { callId }
   */
  socket.on("cancel-call", async ({ callId }) => {
    try {
      console.log(`🚫 [CANCEL-CALL] Call ${callId} cancelled by caller`);

      const call = activeCalls.get(callId);
      if (!call) {
        console.log(`⚠️ Call ${callId} not found`);
        return;
      }

      // Notify receiver
      await emitToUser(call.receiverId, "call-cancelled", { callId });

      // Cleanup
      cleanupCall(callId);
    } catch (error) {
      console.error("❌ Error in cancel-call:", error);
    }
  });

  /**
   * STEP 6: End Active Call
   * Frontend emits: { callId }
   */
  socket.on("call-ended", async ({ callId }) => {
    try {
      console.log(`📴 [CALL-ENDED] Call ${callId} ended by user ${socket.userId}`);

      const call = activeCalls.get(callId);
      if (!call) {
        console.log(`⚠️ Call ${callId} not found (already cleaned up)`);
        return;
      }

      // CRITICAL: Notify BOTH parties immediately (don't check who called it)
      console.log(`📢 Sending call-ended to caller: ${call.callerId}`);
      await emitToUser(call.callerId, "call-ended", { callId });
      
      console.log(`📢 Sending call-ended to receiver: ${call.receiverId}`);
      await emitToUser(call.receiverId, "call-ended", { callId });

      // Cleanup
      cleanupCall(callId);
      console.log(`✅ Call ${callId} completely terminated`);
    } catch (error) {
      console.error("❌ Error in call-ended:", error);
    }
  });

  // ============================================
  // DISCONNECT HANDLER
  // ============================================
  socket.on("disconnect", async () => {
    console.log(`👋 User disconnected: ${userId}, socketId: ${socket.id}`);

    try {
      // Remove from Redis
      await removeUserSocket(socket.id);

      // Check if user has other devices online
      const remainingSockets = await getUserSockets(userId);
      
      if (remainingSockets.length === 0) {
        console.log(`🔴 User ${userId} fully offline (all devices disconnected)`);
        
        // End any active calls involving this user
        for (const [callId, call] of activeCalls.entries()) {
          if (call.callerId === userId || call.receiverId === userId) {
            console.log(`📴 Auto-ending call ${callId} due to user disconnect`);
            
            const otherUserId = call.callerId === userId ? call.receiverId : call.callerId;
            await emitToUser(otherUserId, "peer-disconnected", { callId, userId });
            
            cleanupCall(callId);
          }
        }
      } else {
        console.log(`🟡 User ${userId} still online on ${remainingSockets.length} other device(s)`);
      }

      // Broadcast updated online users
      const onlineUsers = await getOnlineUsers();
      console.log(`📢 Broadcasting online users after disconnect:`, onlineUsers);
      io.emit("getOnlineUsers", onlineUsers);
    } catch (error) {
      console.error("❌ Error handling disconnect:", error);
    }
  });
});

// ============================================
// LEGACY SUPPORT FOR MESSAGE CONTROLLER
// ============================================
/**
 * Get first available socket for a user (backward compatibility)
 * @param {string} userId 
 * @returns {Promise<string|null>}
 */
export async function getReceiverSocketId(userId) {
  const socketIds = await getUserSockets(userId);
  return socketIds[0] || null; // Return first device's socket ID
}

// ============================================
// EXPORTS
// ============================================
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



