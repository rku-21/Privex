import { createClient } from "redis";
export const redis=createClient({
    url:process.env.REDIS_URL,
});

redis.on("error",(err)=>{
    console.log(`redis Error ${err}`);
})
// online_user should be  a derived state not  stored state

await redis.connect();

export const addUserSocket= async(userId,socketId)=>{
    await redis.sAdd(`user:${userId}:sockets`, socketId);
    await redis.set(`presence:${socketId}`,Date.now(), {EX:30});
    await redis.sAdd("online_users", userId);
}

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

    const isOnline=isUserOnline(userId);
    if(!isOnline){
        // remove from the online users 
        await redis.sRem("online_users");
    }
};

export async function getUserSockets(userId){
    // only send the online ones 
    // for each socekts of user check its online if yes add in set and last send the set 

   

}

export async function getOnlineUsers(){
    // return await redis.sMembers("online_users");
    // for each online_user in set check is socket alive or not before sending 
}

