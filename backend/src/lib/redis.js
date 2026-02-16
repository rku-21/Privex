import Redis from "ioredis";
let useMemoryFallback = false;
const memoryStore = {
  userSockets: new Map(), 
  socketUsers: new Map(),
};
const getRedisConfig = () => {
  if (process.env.REDIS_URL) {
    console.log("connecting to redis");
    return {
      ...(process.env.REDIS_URL.startsWith('rediss://') 
        ? { 
            tls: {
              rejectUnauthorized: false
            }
          } 
        : {}
      ),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 3) {
          useMemoryFallback = true;
          return null;
        }
        return Math.min(times * 50, 2000);
      }
    };
  }
  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn("Redis connection failed falling back to in memory storage");
        useMemoryFallback = true;
        return null;
      }
      return Math.min(times * 50, 2000);
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    enableOfflineQueue: false,
  };
};
const redis = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, getRedisConfig())
  : new Redis(getRedisConfig());

redis.on("connect", () => {
  console.log("Redis connected successfully");
  useMemoryFallback = false;
});

redis.on("ready", () => {
  console.log("Redis is ready to accept commands");
});

redis.on("error", (err) => {
  if (!useMemoryFallback) {
    console.error("Redis connection error:", err.message);
    console.warn("Using in memory as fallback");
    useMemoryFallback = true;
  }
});

redis.on("reconnecting", () => {
  if (!useMemoryFallback) {
    console.log("Redis reconnecting");
  }
});

redis.on("close", () => {
  if (!useMemoryFallback) {
    console.log("Redis connection closed");
  }
});
export async function checkRedisHealth() {
  try {
    if (useMemoryFallback) {
      return { 
        status: "fallback", 
        message: "Using in memory storage",
        online: true 
      };
    }
    await redis.ping();
    return { 
      status: "connected", 
      message: "Redis is healthy",
      online: true 
    };
  } catch (error) {
    return { 
      status: "error", 
      message: error.message,
      online: false 
    };
  }
}
/**
 * Adding Socket to user device set
 * @param {string} userId 
 * @param {string} socketId 
 */
export async function addUserSocket(userId, socketId) {
  try {
    if (useMemoryFallback) {
      if (!memoryStore.userSockets.has(userId)) {
        memoryStore.userSockets.set(userId, new Set());
      }
      memoryStore.userSockets.get(userId).add(socketId);
      memoryStore.socketUsers.set(socketId, userId);
      console.log(`Mapped userId ${userId} -> socketId ${socketId}`);
      return;
    }
    
    await redis.sadd(`user:${userId}:sockets`, socketId);
    await redis.set(`socket:${socketId}:user`, userId);
    console.log(`Mapped userId ${userId} → socketId ${socketId}`);
  } catch (error) {
    console.error("Error adding user socket:", error);
     useMemoryFallback = true;
    if (!memoryStore.userSockets.has(userId)) {
      memoryStore.userSockets.set(userId, new Set());
    }
    memoryStore.userSockets.get(userId).add(socketId);
    memoryStore.socketUsers.set(socketId, userId);
  }
}

/**
 * Removing socket to user device set
 * @param {string} socketId 
 */
export async function removeUserSocket(socketId) {
  try {
    if (useMemoryFallback) {
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
        console.log(`Removed socketId ${socketId} from userId ${userId}`);
      }
      return;
    }
    
    const userId = await redis.get(`socket:${socketId}:user`);
    if (userId) {
      await redis.srem(`user:${userId}:sockets`, socketId);
      await redis.del(`socket:${socketId}:user`);
      console.log(`Removed socketId ${socketId} from userId ${userId}`);
    }
  } catch (error) {
    console.error("Error removing user socket", error);
  }
}

/**
 * Get user socket it (all devices)
 * @param {string} userId 
 * @returns {Promise<string[]>}
 */
export async function getUserSockets(userId) {
  try {
    if (useMemoryFallback) {
     const sockets = memoryStore.userSockets.get(userId);
      return sockets ? Array.from(sockets) : [];
    }
    
    return await redis.smembers(`user:${userId}:sockets`);
  } catch (error) {
    console.error("Internal server Error", error);
    return [];
  }
}

/**
 * Geting all online user ids
 * @returns {Promise<string[]>}
 */
export async function getOnlineUsers() {
  try {
    if (useMemoryFallback) {
     return Array.from(memoryStore.userSockets.keys());
    }
    
    const keys = await redis.keys("user:*:sockets");
    return keys.map(key => key.split(":")[1]).filter(Boolean);
  } catch (error) {
    console.error("Internal server Error", error);
    return [];
  }
}

export default redis;
