import { createClient } from "redis";
export const redis=createClient({
    url:process.env.REDIS_URL,
});

redis.on("error",(err)=>{
    console.log(`redis Error ${err}`);
})
// online_user should be  a derived state not  stored state

await redis.connect();

// TTL Configuration for socket presence
const SOCKET_TTL_SECONDS = 30; // Total TTL for socket presence key
const TTL_REFRESH_INTERVAL_MS = 15000; // Refresh every 15 seconds

export const addUserSocket= async(userId,socketId)=>{
   try {
    await redis.sAdd(`user:${userId}:sockets`, socketId);
    // Use sendCommand with explicit command array for maximum compatibility
    await redis.sendCommand(['SET', `presence:${socketId}`, String(userId), 'EX', String(SOCKET_TTL_SECONDS)]);
   } catch(error) {
    console.error(`Error adding socket ${socketId}:`, error);
    throw error;
   }
}

/**
 * Refresh the TTL for a socket presence key
 * This keeps the socket alive if the client is still connected
 * @param {string} socketId - Socket ID to refresh
 * @returns {Promise<void>}
 */
export const refreshSocketPresence = async(socketId) => {
    try {
        const exists = await redis.exists(`presence:${socketId}`);
        if(exists) {
            // Refresh the TTL to keep socket alive using sendCommand for compatibility
            await redis.sendCommand(['EXPIRE', `presence:${socketId}`, String(SOCKET_TTL_SECONDS)]);
        }
    } catch(error) {
        console.error(`Error refreshing socket presence ${socketId}:`, error);
    }
}

// Export constants for use in other modules
export { SOCKET_TTL_SECONDS, TTL_REFRESH_INTERVAL_MS };

export async function isUserOnline(userId){
    const sockets=await redis.sMembers(`user:${userId}:sockets`);
    for(const s of sockets){
        const alive=await redis.exists(`presence:${s}`);
        if(alive) return true;

    }
    return false;
}

export async function removeUserSocket(userId,socketId){
    await redis.sRem(`user:${userId}:sockets`,socketId);
    await redis.del(`presence:${socketId}`);

    const isOnline= await isUserOnline(userId);
    if(!isOnline){
        await redis.del(`user:${userId}:sockets`);
    }
};

export async function getUserSockets(userId){
    // only send the online ones 
    // for each socekts of user check its online if yes add in set and last send the array of that set 
    const aliveSockets=new Set();
    const sockets= await redis.sMembers(`user:${userId}:sockets`);
    for(const s of sockets){
        const alive=await redis.exists(`presence:${s}`);
        if(alive){
            aliveSockets.add(s);
        }
    }
    return Array.from(aliveSockets);

   

}

// You → give cursor
// Redis → gives keys + new cursor

export async function getOnlineUsers(){

    // online_users is a derived state not stored state
    const activeUsers=new Set();
    let cursor='0';
    do {
        // Use sendCommand for SCAN to ensure all arguments are strings
        const res=await redis.sendCommand(['SCAN', cursor, 'MATCH', 'presence:*', 'COUNT', '100']);
        cursor=res[0];
        const keys=res[1];
        
        for(const key of keys){
            const userId=await redis.get(key);
            if(userId) activeUsers.add(userId);
        }
    } while(cursor!=='0');

    return Array.from(activeUsers);
   
    
}

