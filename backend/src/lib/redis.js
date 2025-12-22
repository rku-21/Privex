import Redis from "ioredis";

// In-memory fallback if Redis is unavailable
let useMemoryFallback = false;
const memoryStore = {
  userSockets: new Map(), // userId -> Set(socketIds)
  socketUsers: new Map(), // socketId -> userId
};

// Production-ready Redis client with connection pooling and error handling
const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    if (times > 3) {
      console.warn("⚠️ Redis connection failed, falling back to in-memory storage");
      useMemoryFallback = true;
      return null; // Stop retrying
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
  enableOfflineQueue: false, // Don't queue commands when offline
});

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
  useMemoryFallback = false;
});

redis.on("error", (err) => {
  if (!useMemoryFallback) {
    console.error("❌ Redis connection error:", err.message);
    console.warn("⚠️ Using in-memory storage as fallback");
    useMemoryFallback = true;
  }
});

redis.on("reconnecting", () => {
  // Silently ignore reconnection attempts once fallback is active
  if (!useMemoryFallback) {
    console.log("🔄 Redis reconnecting...");
  }
});

// ============================================
// USER SOCKET MAPPING (Multi-device support)
// ============================================

/**
 * Add socket to user's device set
 * @param {string} userId 
 * @param {string} socketId 
 */
export async function addUserSocket(userId, socketId) {
  try {
    if (useMemoryFallback) {
      // In-memory fallback
      if (!memoryStore.userSockets.has(userId)) {
        memoryStore.userSockets.set(userId, new Set());
      }
      memoryStore.userSockets.get(userId).add(socketId);
      memoryStore.socketUsers.set(socketId, userId);
      console.log(`✅ [MEMORY] Mapped userId ${userId} → socketId ${socketId}`);
      return;
    }
    
    await redis.sadd(`user:${userId}:sockets`, socketId);
    await redis.set(`socket:${socketId}:user`, userId);
    console.log(`✅ Mapped userId ${userId} → socketId ${socketId}`);
  } catch (error) {
    console.error("Error adding user socket:", error);
    // Fallback to memory on error
    useMemoryFallback = true;
    if (!memoryStore.userSockets.has(userId)) {
      memoryStore.userSockets.set(userId, new Set());
    }
    memoryStore.userSockets.get(userId).add(socketId);
    memoryStore.socketUsers.set(socketId, userId);
  }
}

/**
 * Remove socket from user's device set
 * @param {string} socketId 
 */
export async function removeUserSocket(socketId) {
  try {
    if (useMemoryFallback) {
      // In-memory fallback
      const userId = memoryStore.socketUsers.get(socketId);
      if (userId) {
        const sockets = memoryStore.userSockets.get(userId);
        if (sockets) {
          sockets.delete(socketId);
          if (sockets.size === 0) {
            memoryStore.userSockets.delete(userId);
          }
        }
        memoryStore.socketUsers.delete(socketId);
        console.log(`✅ [MEMORY] Removed socketId ${socketId} from userId ${userId}`);
      }
      return;
    }
    
    const userId = await redis.get(`socket:${socketId}:user`);
    if (userId) {
      await redis.srem(`user:${userId}:sockets`, socketId);
      await redis.del(`socket:${socketId}:user`);
      console.log(`✅ Removed socketId ${socketId} from userId ${userId}`);
    }
  } catch (error) {
    console.error("Error removing user socket:", error);
  }
}

/**
 * Get all socket IDs for a user (all devices)
 * @param {string} userId 
 * @returns {Promise<string[]>}
 */
export async function getUserSockets(userId) {
  try {
    if (useMemoryFallback) {
      // In-memory fallback
      const sockets = memoryStore.userSockets.get(userId);
      return sockets ? Array.from(sockets) : [];
    }
    
    return await redis.smembers(`user:${userId}:sockets`);
  } catch (error) {
    console.error("Error getting user sockets:", error);
    return [];
  }
}

/**
 * Get all online user IDs
 * @returns {Promise<string[]>}
 */
export async function getOnlineUsers() {
  try {
    if (useMemoryFallback) {
      // In-memory fallback
      return Array.from(memoryStore.userSockets.keys());
    }
    
    const keys = await redis.keys("user:*:sockets");
    return keys.map(key => key.split(":")[1]).filter(Boolean);
  } catch (error) {
    console.error("Error getting online users:", error);
    return [];
  }
}

export default redis;
