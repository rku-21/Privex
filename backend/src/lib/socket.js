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

// Track active user connections and calls
const userSocketMap = {};
const activeCallMap = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

export function getActiveCall(userId) {
  return activeCallMap[userId];
}

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  
  if (!userId) {
    console.log("User connected without userId");
    return;
  }
  
  console.log(`User connected: ${userId}, socketId: ${socket.id}`);

  if (userId) {
    // Map userId to socketId for future reference
    userSocketMap[userId] = socket.id;
    console.log(`Mapped userId ${userId} to socketId ${socket.id}`);
    console.log(`Current online users: ${Object.keys(userSocketMap).join(', ')}`);
    
    // Check if the user has an ongoing call
    if (activeCallMap[userId]) {
      // Notify user about their ongoing call
      console.log(`User ${userId} has an ongoing call with ${activeCallMap[userId].partner}, notifying them`);
      socket.emit("call-reconnect", activeCallMap[userId]);
    }
  }

  // Notify all clients about updated online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // 📞 Call events
  socket.on("call-user", ({ to, offer, type }) => {
    console.log(`User ${userId} is calling user ${to} with ${type} call`);
    const receiverSocketId = getReceiverSocketId(to);
    
    if (receiverSocketId) {
      console.log(`Receiver socket found: ${receiverSocketId}, sending incoming call event`);
      
      // Send with all required data including userId of caller
      io.to(receiverSocketId).emit("incoming-call", {
        from: userId,
        offer,
        type,
        timestamp: Date.now()
      });
      
      console.log(`Incoming call event sent to socket ${receiverSocketId}`);
      
      // Store active call state
      activeCallMap[userId] = { partner: to, type, status: 'calling', startTime: Date.now() };
      activeCallMap[to] = { partner: userId, type, status: 'receiving', startTime: Date.now() };
      
      console.log(`Active call started between ${userId} and ${to}`);
      
      // Set a timeout to automatically end the call if not answered or rejected
      // This prevents zombie call states when connections drop
      setTimeout(() => {
        // Check if this call is still active but unanswered
        if (activeCallMap[userId] && 
            activeCallMap[userId].partner === to && 
            activeCallMap[userId].status === 'calling') {
          
          console.log(`Call from ${userId} to ${to} timed out after 60s without answer`);
          
          // Notify caller that call timed out
          socket.emit("call-ended", {
            reason: "no_answer",
            timestamp: Date.now()
          });
          
          // Clean up call state
          delete activeCallMap[userId];
          delete activeCallMap[to];
        }
      }, 60000); // 60 seconds timeout for unanswered calls
    } else {
      console.log(`Receiver socket NOT found for ${to}`);
      // Just send unavailable status without error message - more like WhatsApp behavior
      // WhatsApp just continues showing "Calling..." indefinitely for offline users
      socket.emit("call-status", { status: "unavailable", to });
    }
  });

  socket.on("answer-call", ({ to, answer }) => {
    console.log(`User ${userId} is answering call from ${to}`);
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      console.log(`Sending call-answered event to socket ${receiverSocketId}`);
      io.to(receiverSocketId).emit("call-answered", {
        from: userId,
        answer,
      });
      
      // Update active call state
      activeCallMap[userId] = { partner: to, type: activeCallMap[to]?.type || 'unknown' };
      activeCallMap[to] = { partner: userId, type: activeCallMap[to]?.type || 'unknown' };
    } else {
      console.log(`Receiver socket not found for ${to}, can't send call-answered`);
      // Notify the answerer that the caller is no longer available
      socket.emit("call-ended", { reason: "Caller disconnected" });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("ice-candidate", {
        from: userId,
        candidate,
      });
    }
  });
  
  // Handle call status updates (ringing, missed, etc)
  socket.on("call-status", ({ to, status, timestamp }) => {
    console.log(`User ${userId} sending call status "${status}" to user ${to}`);
    const receiverSocketId = getReceiverSocketId(to);
    
    if (receiverSocketId) {
      console.log(`Sending call-status to socket ${receiverSocketId}: ${status}`);
      io.to(receiverSocketId).emit("call-status", {
        from: userId,
        status,
        timestamp: timestamp || Date.now()
      });
      
      // Update call status in active calls map
      if (activeCallMap[userId] && activeCallMap[userId].partner === to) {
        activeCallMap[userId].status = status;
      }
      
      // If call is missed or rejected, update receiver status too
      if (status === 'missed' || status === 'rejected') {
        if (activeCallMap[to] && activeCallMap[to].partner === userId) {
          activeCallMap[to].status = 'ended';
        }
      }
    } else {
      console.log(`Receiver socket not found for ${to}, can't send call-status`);
    }
  });
  
  // Handle call rejection
  socket.on("reject-call", ({ to }) => {
    console.log(`User ${userId} is rejecting call from ${to}`);
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      console.log(`Sending call-rejected event to socket ${receiverSocketId}`);
      io.to(receiverSocketId).emit("call-rejected", {
        from: userId
      });
      
      // Clean up active call mapping
      if (activeCallMap[userId]) {
        delete activeCallMap[userId];
      }
      if (activeCallMap[to]) {
        delete activeCallMap[to];
      }
    } else {
      console.log(`Receiver socket not found for ${to}, can't send call-rejected`);
    }
  });
  
  // Handle call ending
  socket.on("call-ended", ({ to }) => {
    console.log(`User ${userId} is ending call with user ${to}`);
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      console.log(`Sending call-ended event to socket ${receiverSocketId}`);
      // Send a more robust call-ended event with clear reason
      io.to(receiverSocketId).emit("call-ended", {
        from: userId,
        reason: "ended_by_caller",
        timestamp: Date.now()
      });
      
      // Clean up active call mapping
      if (activeCallMap[userId]) {
        delete activeCallMap[userId];
      }
      if (activeCallMap[to]) {
        delete activeCallMap[to];
      }
    } else {
      console.log(`Receiver socket not found for ${to}, can't send call-ended`);
    }
    
    // Always clean up the local user's call state, regardless of whether
    // we could send the message to the other party
    if (activeCallMap[userId]) {
      delete activeCallMap[userId];
    }
  });
  
  // Handle call update (switching between audio/video)
  socket.on("update-call", ({ to, offer, type }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("update-call", {
        from: userId,
        offer,
        type,
      });
    }
  });
  
  // Handle call update response
  socket.on("call-updated", ({ to, answer, type }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-updated", {
        from: userId,
        answer,
        type,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);
    
    // Clean up socket map
    if (userId && userSocketMap[userId]) {
      delete userSocketMap[userId];
    }
    
    // Check if user was in an active call
    if (activeCallMap[userId]) {
      const partner = activeCallMap[userId].partner;
      
      if (partner && activeCallMap[partner]) {
        // Notify partner that call has ended due to disconnection
        const partnerSocketId = getReceiverSocketId(partner);
        if (partnerSocketId) {
          // Send multiple notifications to ensure it gets through
          io.to(partnerSocketId).emit("call-ended", { 
            from: userId,
            reason: "user_disconnected",
            timestamp: Date.now()
          });
          
          // Send another notification with a delay to ensure it's received
          setTimeout(() => {
            io.to(partnerSocketId).emit("call-ended", { 
              from: userId,
              reason: "user_disconnected",
              timestamp: Date.now()
            });
          }, 1000);
        }
        
        // Clean up active call mapping
        delete activeCallMap[partner];
      }
      
      delete activeCallMap[userId];
    }
    
    // Update online users list for all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };

