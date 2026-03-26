import { createClient } from "redis";
export const redis=createClient({
    url:process.env.REDIS_URL,
});

redis.on("error",(err)=>{
    console.log(`redis Error ${err}`);
})
await redis.connect();

// TTL configuration to avoid Ghost Sockets 
const SOCKET_TTL_SECONDS = 30; // removed the socket after 30 sec
const TTL_REFRESH_INTERVAL_MS = 15000; // Refresh every 15 seconds

export const addUserSocket= async(userId,socketId)=>{
   try {
    await redis.sAdd(`user:${userId}:sockets`, socketId);

    // using the sendCommand for the maximum compatiblity
    await redis.sendCommand(['SET', `presence:${socketId}`, String(userId), 'EX', String(SOCKET_TTL_SECONDS)]);
   } catch(error) {
    console.error(`Error adding socket ${socketId}:`, error);
    throw error;
   }
}

/**
 * Refresh the socket TTL key if the user is still connected 
 * @param {string} socketId  => Socket ID to refresh
 * @returns {Promise<void>}
 */
export const refreshSocketPresence = async(socketId) => {
    try {
        const exists = await redis.exists(`presence:${socketId}`);
        if(exists) {
            await redis.sendCommand(['EXPIRE', `presence:${socketId}`, String(SOCKET_TTL_SECONDS)]);
        }
    } catch(error) {
        console.error(`Error refreshing socket presence ${socketId}:`, error);
    }
}

// check is user online on any devices still or not 
export async function isUserOnline(userId){
    const sockets=await redis.sMembers(`user:${userId}:sockets`);
    for(const s of sockets){
        const alive=await redis.exists(`presence:${s}`);
        if(alive) return true;

    }
    return false;
}

// remove the disconnected socket
export async function removeUserSocket(userId,socketId){
    await redis.sRem(`user:${userId}:sockets`,socketId);
    await redis.del(`presence:${socketId}`);

    const isOnline= await isUserOnline(userId);
    if(!isOnline){
        await redis.del(`user:${userId}:sockets`);
    }
};

// get a user all sockets to emit events to him 
export async function getUserSockets(userId){
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
 // online users is a derived state not stored state
export async function getOnlineUsers(){
    const activeUsers=new Set();
    let cursor='0';
    do {
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

export { SOCKET_TTL_SECONDS, TTL_REFRESH_INTERVAL_MS };

