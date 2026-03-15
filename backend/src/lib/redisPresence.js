import { createClient } from "redis";
export const redis=createClient({
    url:process.env.REDIS_URL,
});

redis.on("error",(err)=>{
    console.log(`redis Error ${err}`);
})

await redis.connect();

export const addUserSocket= async(userId,socketId)=>{
    await redis.sAdd(`user:${userId}:sockets`, socketId);
    await redis.sAdd("online_users", userId);
}

export async function removeUserSocket(userId,socketId){
    await redis.sRem(`user:${userId}:sockets`,socketId);

    const remaining=await redis.sCard(`user:${userId}:sockets`)

    if(remaining===0){
        await redis.sRem("online_users",userId);
    }
};

export async function getUserSockets(userId){
    return await redis.sMembers(`user:${userId}:sockets`);
}

export async function getOnlineUsers(){
    return await redis.sMembers("online_users");
}

