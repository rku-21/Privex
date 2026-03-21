import { getUserSockets } from "./redisPresence.js";

// /**
//  * Initialize all message-related socket events
//  * @param {object} io - Socket.io server instance
//  * @param {object} socket - Individual socket connection
//  */
export function MessageSocketEvents(io, socket) {
    /**
     * Listen for typing indicator
     * Emits "typing" event to receiver's active sockets when user starts typing
     */
    socket.on("typing", async ({ typerUserId, receiverUserId }) => {
        try {
            const typingUserId = typerUserId || socket.userId;
            const receiveingUserId = receiverUserId;

            if (!typingUserId || !receiveingUserId) {
                console.warn("Invalid user Ids");
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
     * Listen for stop typing indicator
     * Emits "stopTyping" event to receiver's active sockets when user stops typing
     */
    socket.on("stopTyping", async ({ typerUserId, receiverUserId }) => {
        try {
            const typingUserId = typerUserId || socket.userId;
            const receiveingUserId = receiverUserId;

            if (!typingUserId || !receiveingUserId) {
                console.warn("Invalid user IDs");
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
            socket.emit("stopTyping-error", { message: "error to emit stopTyping" });
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
        // if user is offline
        if (socketIds.length === 0) {
            return false;
        }

        // Emit to all user's connected devices
        socketIds.forEach((socketId) => {
            io.to(socketId).emit(event, payload);
        });

        console.log(`Message event "${event}" sent to user ${userId}`);
        return true;
    } catch (error) {
        console.error(`Error emitting message event to user ${userId}:`, error);
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
