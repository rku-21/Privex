import { createAdapter } from "@socket.io/redis-adapter";
import User from "../models/user.model.js";
import { randomUUID } from "crypto";
import { getUserSockets } from "./redisPresence.js";
import { io } from "./socket.js";

// for calls 
const activeCalls = new Map();
const callTimeouts = new Map();
const CALL_TIMEOUT_MS = 30000;
const MAX_ICE_BUFFER_SIZE = 50;



function cleanupCall(callId){
    if(callTimeouts.has(callId)){
        clearTimeout(callTimeouts.get(callId));
        callTimeouts.delete(callId);
    }
    activeCalls.delete(callId);
}


/**
 * @param {string} userId 
 * @param {String} event 
 * @param {object} payload 
 * @returns {promise<boolean>} if sucess =>true else false
 */
async function emitToUser(userId,event,payload) {
    try {
        const socketIds=await getUserSockets(userId);
        if(socketIds.length==0){
            return false;
        }
        socketIds.forEach((socket)=>{
            io.to(socket).emit(event,payload);
        })
        return true;
    }
    catch(error){
        return false;
    }
    
}

/**
 * 
 * @param {socket.io} io =>instance 
 * @param {individual socket of authUser} socket 
 */
export const CallsocketEvents=async(io,socket)=>{
  socket.on("call-user",async({to,offer,callType,from}={})=>{
    try {
        if(!to || !from || !offer){
            console.log("invalid call payload");
            return;
        }
        const caller=await User.findById(from).select("fullname profilePicture");
        if(!caller) return;

        const callId=randomUUID();

        activeCalls.set(callId,{
            callId,
            callerId:from,
            receiverId:to,
            callType,
            status:"ringing",
            iceCandidates:[],
            createdAt:Date.now(),
        });

        const timeout=setTimeout(async()=>{
            const call=activeCalls.get(callId);
            if(call && call.status==="ringing"){
                await emitToUser(call.callerId, "call-timeout", {callId});

                //not needed ?? 
                await emitToUser(call.receiverId,"call-timeout",{callId});

                cleanupCall(callId);
            }
        },CALL_TIMEOUT_MS);

        callTimeouts.set(callId,timeout);


        // now emit call to User 
        const sent =await emitToUser(to,"incoming-call",{
            callId,
            from:{
                _id:from,
                fullname:caller.fullname,
                profilePicture:caller.profilePicture,
            },
            callType,
            offer,
        });
        // receiver is offline 
        if(!sent) {
            socket.emit("call-error",{message:"user is offline"});
            cleanupCall(callId);

        }
        else {
            socket.emit("call-initiated",{callId});
        }
    }catch(error){
        socket.emit("call-error",{message:"failed to initiate the call"});
    }
  });
  
  // listen when user answer the call
  socket.on("answer-call",async({callId,answer}={})=>{
     try {
        const call=activeCalls.get(callId);
        if(!call){
            socket.emit("call-error",{message:"call not found"});
            return;
        }
        if(call.status!=="ringing"){
            return;
        }

        //update the call status and clear timeout 

        call.status="accepted" // in activeCalls

        if(callTimeouts.has(callId)){
            clearTimeout(callTimeouts.get(callId));
            callTimeouts.delete(callId);
        }

        await emitToUser(call.callerId,"call-accepted", {
            callId,
            answer,
        });

        // flush the buffered candidate 
        if(call.iceCandidates.length>0){
            for(const ice of call.iceCandidates){
                await emitToUser(call.callerId,"ice-candidate",{
                    callId,
                    candidate:ice.candidate,
                    from :ice.from,
                });
            }
            call.iceCandidates=[];
        }
    }catch(error){
        console.log("error in answer call",error);

     }
  });

  socket.on("ice-candidate", async ({ callId, candidate }) => {
    try {
      const call = activeCalls.get(callId);
      if (!call) {
        console.log(`unknown call ${callId}`);
        return;
      }

      const isFromCaller = socket.userId === call.callerId;
      const targetUserId = isFromCaller ? call.receiverId : call.callerId;

      
      if (call.status === "ringing") {
        if (call.iceCandidates.length >= MAX_ICE_BUFFER_SIZE) {
           return; // drop the candidate
        }

        call.iceCandidates.push({
          candidate,
          from: socket.userId,
          timestamp: Date.now(),
        });
       } else if (call.status === "accepted") {
        await emitToUser(targetUserId, "ice-candidate", {
          callId,
          candidate,
        });

        console.log(`Forwarded ICE candidate for call ${callId}`);
      }
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  });

  // reject the call 
  socket.on("reject-call",async({callId})=>{
     try{
        const call=activeCalls.get(callId);
        if(!call) return;

        await emitToUser(call.callerId,"call-rejected",{callId});
        cleanupCall(callId);
     }catch(error){
        console.log("error occur while rejecting call",error);
     }
  });

  socket.on("cancel-call",async({callId})=>{
    try{
        const call=activeCalls.get(callId);
        if(!call) return;

        await emitToUser(call.receiverId,"call-cancelled",{callId});
        cleanupCall(callId);

    }catch(error){
        console.log("Error in cancelling the call",error);

    }
  });

  socket.on("call-ended", async ({ callId }) => {
    try {
      
      const call = activeCalls.get(callId);
      if (!call) return;
      

    await emitToUser(call.callerId, "call-ended", { callId });
    await emitToUser(call.receiverId, "call-ended", { callId });
     cleanupCall(callId);
    
    } catch (error) {
      console.error("Error in call ended:", error);
    }
  });
}

export {activeCalls,callTimeouts,CALL_TIMEOUT_MS,MAX_ICE_BUFFER_SIZE};

