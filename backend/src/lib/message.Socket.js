import { getUserSockets } from "./redisPresence.js";

/**
 * @param {socket full server} io 
 * @param {single auth user socket} socket 
 */
export function MessageSocketEvents(io, socket) {
   socket.on("typing", async ({ typerUserId, receiverUserId }={}) => {
        try {
            const typingUserId = typerUserId || socket.userId;
            const receiveingUserId = receiverUserId;

            if (!typingUserId || !receiveingUserId) {
                return;
            }
            const receiverSockets = await getUserSockets(receiveingUserId);
            if (receiverSockets.length > 0) {
                receiverSockets.forEach((socketId) => {
                    io.to(socketId).emit("typing", { typerUserId: typingUserId });
                });
            } else {
                console.log(`No user to emit typing status for user ${typingUserId}`)
            }
        } catch (error) {
            socket.emit("typing-error", { message: "error in sending typing indicator" });
        }
    });

    /**
     * @param {typerId} 
     * @param {receiverId}
     * // emit the stop typing event to receiver's online socket
     */
    socket.on("stopTyping", async ({ typerUserId, receiverUserId }={}) => {
        try {
            const typingUserId = typerUserId || socket.userId;
            const receiveingUserId = receiverUserId;

            if (!typingUserId || !receiveingUserId) {
                return;
            }
            const receiverSocketIds = await getUserSockets(receiveingUserId);

            if (receiverSocketIds.length > 0) {
                receiverSocketIds.forEach((socketId) => {
                    io.to(socketId).emit("stopTyping", { typerUserId: typingUserId });
                });
            } else {
                console.log(`No user to emit Stoptyping status for user ${typingUserId}`)

            }
        } catch (error) {
            socket.emit("stopTyping-error", { message: "error to emit stopTyping event" });
        }
    });

    /**
     * Listen for message seen acknowledgment
     * Emits "message-seen-Ack" back to receiver when messages are marked as seen
     */
    socket.on("message-read-status", async ({ chatId, receiverId, senderId }) => {
        try {
            if (!chatId || !receiverId || !senderId) {
                return;
            }
            
            const senderSockets = await getUserSockets(senderId);
            if (senderSockets.length > 0) {
                senderSockets.forEach((socketId) => {
                    io.to(socketId).emit("message-read-status", { 
                        chatId, 
                        receiverId, 
                        status: "seen" 
                    });
                });
                // here the flow is sender sended message to reciver now receiver have seen it so emiting the read status to sender of message
            }
        } catch (error) {
            socket.emit("read-status-error", { message: "error in sending read status" });
        }
    });
}

/**
 * @description Emit a message event to a specific user across all their connected devices
 * @param {object} io - Socket.io server instance
 * @param {string} userId - Target user ID
 * @param {string} event - Event name
 * @param {object} payload - Event payload
 * @returns {Promise<boolean>} - Returns true if user was online and message sent, false otherwise
 */
export async function emitMessageToUser(io, userId, event, payload) {
    try {
        const socketIds = await getUserSockets(userId);
        if (socketIds.length === 0) {
            return false;
        }

        // Emit to all user's connected devices
        socketIds.forEach((socketId) => {
            io.to(socketId).emit(event, payload);
        });
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * @description Broadcast message event to multiple users
 * @param {object} io - Socket.io server instance
 * @param {Array<string>} userIds - Array of target user IDs
 * @param {string} event - Event name
 * @param {object} payload - Event payload
 */
export async function broadcastMessageEvent(io, userIds, event, payload) {
    try {
        for (const userId of userIds) {
            await emitMessageToUser(io, userId, event, payload);
        }
    } catch (error) {
        console.error(`Error broadcasting message event "${event}":`, error);
    }
}
