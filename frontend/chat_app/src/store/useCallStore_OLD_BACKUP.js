// import { create } from "zustand";
// import toast from "react-hot-toast";
// import { useAuthStore } from "./useAuthStore";
// import { use, useEffect } from "react";
// import { useChatStore } from "./useChatStore";

// export const useCallStore=create((set,get)=>({
//   peerConnection:null,
//   localStream:null,
//   remoteStream:null,
//   incall:false,
//   callType:null,
//   isReceivingCall:false,
//   incomingCall:null,
//   isMuted:false,
//   isInitiating:false,
//   isCallAccepted:false,
//   onCallWithWhom:{},
//   callTimeout: null,
//   currentCallId: null, 

  
//   initRingtone: () => {
//     if (typeof window !== 'undefined' && !get().ringtoneAudio) {
//       const audio = new Audio('/sounds/callingTime.mp3');
//       audio.loop = true;
//       set({ ringtoneAudio: audio });
//     }
//   },

  
//   playRingtone: () => {
//     const { ringtoneAudio, initRingtone } = get();
//     if (!ringtoneAudio) {
//       initRingtone();
//     }
//     const audio = get().ringtoneAudio;
//     if (audio) {
//       audio.play().catch(err => {
//         console.error("Error playing ringtone:", err);
//         toast.error("Could not play ringtone");
//       });
//     }
//   },

  
//   stopRingtone: () => {
//     const { ringtoneAudio } = get();
//     if (ringtoneAudio) {
//       ringtoneAudio.pause();
//       ringtoneAudio.currentTime = 0;
//     }
//   },

//   ringtoneAudio: null,


//   setlocalStream:(stream)=>set({localStream:stream}),
//   setremoteStream:(stream)=>set({remoteStream:stream}),
//   setPeerConnection:(pc)=>set({peerConnection:pc}),
//   setInCall:(value)=>set({incall:value}),
//   setCallType:(type)=>set({callType:type}),

 
// endCall: () => {
//   console.log("endCall function called");
//   const { localStream, peerConnection, callTimeout, currentCallId } = get();
//   const socket = useAuthStore.getState().socket;

  
//   get().stopRingtone();
//   console.log("Stopped ringtone - call ended");

  
//   if (callTimeout) {
//     clearTimeout(callTimeout);
//   }

//   if (localStream) localStream.getTracks().forEach(track => track.stop());
//   if (peerConnection) peerConnection.close();

  
//   if (socket && currentCallId) {
//     socket.emit("call-ended", { callId: currentCallId });
//     console.log("call-ended event emitted for callId:", currentCallId);
//   }

  
//   set({
//     peerConnection: null,
//     localStream: null,
//     remoteStream: null,
//     incall: false,
//     callType: null,
//     isReceivingCall: false,
//     incomingCall: null,
//     isInitiating: false,
//     isCallAccepted: false,
//     onCallWithWhom: null,
//     callTimeout: null,
//     currentCallId: null  
//   });
  
//   console.log("Call state completely reset, onCallWithWhom cleared");
  
  
//   const chatStore = useChatStore.getState();
//   chatStore.setselectedUser(null);
  
  
//   if (typeof window !== 'undefined') {
//     window.history.pushState({}, '', '/');
//   }
  
//   console.log("Call ended and state reset");
// },

//   handleCallEnded: (reason = '') => {
//   console.log("handleCallEnded function called - resetting all call state", reason ? `(Reason: ${reason})` : '');
  
  
//   const { localStream, peerConnection } = get();
  
  
//   if (localStream) {
//     localStream.getTracks().forEach(track => track.stop());
//   }
  
//   if (peerConnection) {
//     peerConnection.close();
//   }

  
//   set({
//     peerConnection: null,
//     localStream: null,
//     remoteStream: null,
//     incall: false,
//     callType: null,
//     isReceivingCall: false,
//     incomingCall: null,
//     isInitiating: false,
//     isCallAccepted: false,
//     onCallWithWhom: null,
//     currentCallId: null,  
//   });
  
//   console.log("Call state reset complete, onCallWithWhom set to null");
  
  
//   if (reason === 'timeout') {
//     toast.error("Call timed out");
//   }  
//   set({
//     peerConnection: null,
//     localStream: null,
//     remoteStream: null,
//     incall: false,
//     callType: null,
//     isReceivingCall: false,
//     incomingCall: null,
//     isInitiating: false,
//     isCallAccepted: false,
//     onCallWithWhom: {}
//   });

  
//   const chatStore = useChatStore.getState();
//   chatStore.setselectedUser(null);
  
  
//   if (typeof window !== 'undefined') {
//     window.history.pushState({}, '', '/');
//   }
  
//   console.log("Call state has been completely reset and selectedUser set to null");
// },

//   callerSideStateWhenAccepted:()=>{
//   console.log("Call has been accepted by callee, updating caller state");
//   const { ringtoneAudio, callTimeout } = get();
  
  
//   get().stopRingtone();
//   console.log("Stopped ringtone - call accepted");

  
//   if (callTimeout) {
//     clearTimeout(callTimeout);
//   }

//   set({
//     isCallAccepted: true,
//     isInitiating: false,
//     incall: true,
//     callTimeout: null
//   });
//   toast.success("Call has been accepted");
// },

  
  
//   handleIncomingCall: (data) => {
//     console.log("handleIncomingCall called with:", data);
    
    
//     if (!data || !data.from || !data.offer || !data.callId) {
//       console.error("Invalid incoming call data:", data);
//       return;
//     }
    
    
//     const callType = data.callType || data.type || "audio";
    
    
    
//     set({
//       isReceivingCall: true,
//       incomingCall: {
//         callId: data.callId,  
//         from: data.from,
//         offer: data.offer,
//         callType: callType
//       },
//       currentCallId: data.callId  
//     });
    
//     set({
//       onCallWithWhom: {
//         fullname: data.from?.fullname,
//         profilePicture: data.from?.profilePicture
//       }
//     });

//     console.log("Call state updated with auto-reject timeout:", {
//       isReceivingCall: get().isReceivingCall,
//       incomingCall: get().incomingCall
//     });
//   },

  
//  initiateCall: async (receiverId, callType) => {
//   console.log("Initiating call to:", receiverId, "with type:", callType);

//   const socket = useAuthStore.getState().socket;

  
//   get().initRingtone();
//   setTimeout(() => {
//     get().playRingtone();
//     console.log("Started playing ringtone");
//   }, 100);

  
  
//   set({ callType: callType, incall: true, isInitiating: true});

//   try {
    
//     const pc = new RTCPeerConnection({
//       iceServers: [
//         { urls: "stun:stun.l.google.com:19302" },
//         { urls: "stun:stun1.l.google.com:19302" },
//       ]
//     });
//     console.log("PeerConnection created:", pc);

//     set({ peerConnection: pc });

    
//     const constraints = callType === "video" ? { video: true, audio: true } : { audio: true };
//     const localStream = await navigator.mediaDevices.getUserMedia(constraints);
//     set({ localStream });
//     console.log("Local stream obtained:", localStream);
//     console.log("Local stream audio tracks:", localStream.getAudioTracks());
//     console.log("Local stream audio track enabled:", localStream.getAudioTracks()[0]?.enabled);

    
//     localStream.getTracks().forEach(track => {
//       console.log(`Adding track to peer connection: ${track.kind} [enabled: ${track.enabled}]`);
//       pc.addTrack(track, localStream);
//     });

    
//     set({ remoteStream: null }); 
//     console.log("Remote stream prepared");

    
//     pc.ontrack = (event) => {
//       console.log(`Received remote track: ${event.track.kind} [enabled: ${event.track.enabled}]`);
      
      
//       if (event.streams && event.streams[0]) {
//         const incomingStream = event.streams[0];
//         console.log("Using remote stream from event:", incomingStream.id);
//         console.log("Remote stream tracks:", incomingStream.getTracks().map(t => `${t.kind}:${t.id}`));
        
        
//         const currentRemote = get().remoteStream;
//         if (!currentRemote || currentRemote.id !== incomingStream.id) {
//           set({ remoteStream: incomingStream });
//           console.log("Remote stream set successfully");
//         }
//       }
//     };
//     console.log("ontrack handler set up");
    
    
//     pc.oniceconnectionstatechange = () => {
//       console.log(`ICE connection state changed: ${pc.iceConnectionState}`);
//       if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
//         toast.error("Media connection failed or disconnected.");
        
        
//         if (get().isCallAccepted) {
//           console.log("Call ended due to ICE connection state: " + pc.iceConnectionState);
//           setTimeout(() => {
//             if (get().isCallAccepted) { 
//               get().handleCallEnded();
//             }
//           }, 1000); 
//         }
//       } else if (pc.iceConnectionState === 'connected') {
//         toast.success("Media connection established!");
//       }
//     };
    
//     pc.onconnectionstatechange = () => {
//       console.log(`Connection state changed: ${pc.connectionState}`);
//       if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
        
//         if (get().isCallAccepted) {
//           console.log("Call ended due to connection state: " + pc.connectionState);
//           setTimeout(() => {
//             if (get().isCallAccepted) { 
//               get().handleCallEnded();
//             }
//           }, 1000); 
//         }
//       }
//     };

    
//     pc.onicecandidate = (event) => {
//       if (event.candidate) {
//         const { currentCallId } = get();
//         if (currentCallId) {
//           socket.emit("ice-candidate", {
//             callId: currentCallId,  
//             candidate: event.candidate,
//           });
//         }
//       }
//     };
//     console.log("icecandidate handler set up");

    
//     const offer = await pc.createOffer();
//     await pc.setLocalDescription(offer);
//     console.log("Offer created and set as local description:", offer);

    
//     socket.emit("call-user", {
//       to: receiverId,
//       offer: offer,
//       callType: callType,
//       from: useAuthStore.getState().authUser._id,
//     });
//     const targetUser=useChatStore.getState().friends.find((friend)=>friend._id===receiverId);
//     set({
//       onCallWithWhom: {
//         fullname: targetUser?.fullname,
//         profilePicture: targetUser?.profilePicture
//       }
//     });

//     console.log("Call initiated to:", receiverId);

//   } catch (error) {
//     console.error("Error initiating call:", error);
//     toast.error("Error initiating call");
//     set({ inCall: false });
//   }
// },

 
//  acceptCall: async () => {
//   const socket = useAuthStore.getState().socket;
//   const { incomingCall } = get();
  
//   if(!incomingCall) {
//     console.error("No incoming call to accept");
//     return Promise.reject("No incoming call to accept");
//   }
  
//   const { callId, from, offer, callType } = incomingCall;  
//   const callerId = typeof from === 'object' && from !== null ? from._id : from;
  
//   console.log("Accepting call from:", callerId, "with offer:", offer);
  
//   try {
    
//     let pc = get().peerConnection;
//     if (!pc) {
//       console.log("Creating new peer connection for accepting call");
//       pc = new RTCPeerConnection({
//         iceServers: [
//           { urls: "stun:stun.l.google.com:19302" },
//           { urls: "stun:stun1.l.google.com:19302" },
//         ]
//       });
//       set({ peerConnection: pc });
//     }
    
    
//     let localStream = get().localStream;
//     if (!localStream) {
//       console.log("Getting local media stream");
//       const constraints = callType === "video" ? { video: true, audio: true } : { audio: true };
//       localStream = await navigator.mediaDevices.getUserMedia(constraints);
//       set({ localStream });
      
      
//       localStream.getTracks().forEach(track => {
//         console.log(`Adding ${track.kind} track to peer connection [enabled: ${track.enabled}]`);
//         pc.addTrack(track, localStream);
//       });
//     }
    
    
//     set({ remoteStream: null }); 
    
    
//     pc.ontrack = (event) => {
//       console.log(`Remote track received: ${event.track.kind} [enabled: ${event.track.enabled}]`);
      
      
//       if (event.streams && event.streams[0]) {
//         const incomingStream = event.streams[0];
//         console.log("Using remote stream from event:", incomingStream.id);
//         console.log("Remote stream tracks:", incomingStream.getTracks().map(t => `${t.kind}:${t.id}`));
        
        
//         const currentRemote = get().remoteStream;
//         if (!currentRemote || currentRemote.id !== incomingStream.id) {
//           set({ remoteStream: incomingStream });
//           console.log("Remote stream set successfully");
//         }
        
        
//         const audioTracks = incomingStream.getAudioTracks();
//         console.log(`Remote stream has ${audioTracks.length} audio tracks`);
//         audioTracks.forEach(track => {
//           console.log("Audio Track State:", {
//             id: track.id,
//             label: track.label,
//             enabled: track.enabled,
//             muted: track.muted,
//             readyState: track.readyState
//           });
//         });
//       }

      
//       event.track.onended = () => {
//         console.log(`Remote track ${event.track.kind} ended`);
//       };

      
//       event.track.onmute = () => {
//         console.log(`Remote track ${event.track.kind} muted`);
//       };

      
//       event.track.onunmute = () => {
//         console.log(`Remote track ${event.track.kind} unmuted`);
//       };
//     };
    
    
//     pc.oniceconnectionstatechange = () => {
//       console.log(`ICE connection state changed: ${pc.iceConnectionState}`);
//       if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
//         toast.error("Media connection failed or disconnected.");
        
        
//         if (get().isCallAccepted) {
//           console.log("Call ended due to ICE connection state: " + pc.iceConnectionState);
//           setTimeout(() => {
//             if (get().isCallAccepted) { 
//               get().handleCallEnded();
//             }
//           }, 1000); 
//         }
//       } else if (pc.iceConnectionState === 'connected') {
//         toast.success("Media connection established!");
//       }
//     };
    
//     pc.onconnectionstatechange = () => {
//       console.log(`Connection state changed: ${pc.connectionState}`);
//       if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
        
//         if (get().isCallAccepted) {
//           console.log("Call ended due to connection state: " + pc.connectionState);
//           setTimeout(() => {
//             if (get().isCallAccepted) { 
//               get().handleCallEnded();
//             }
//           }, 1000); 
//         }
//       }
//     };
    
    
//     pc.onicecandidate = (event) => {
//       if (event.candidate && socket) {
//         console.log("Sending ICE candidate to caller");
//         socket.emit("ice-candidate", {
//           callId: callId,  
//           candidate: event.candidate,
//         });
//       }
//     };
    
    
//     console.log("Setting remote description");
//     await pc.setRemoteDescription(new RTCSessionDescription(offer));
    
//     console.log("Creating answer");
//     const answer = await pc.createAnswer();
    
//     console.log("Setting local description");
//     await pc.setLocalDescription(answer);
    
    
//     console.log("Sending answer to caller with callId:", callId);
//     socket.emit("answer-call", {
//       callId: callId,  
//       answer: answer,
//     });
    
    
//     set({ 
//       callType: callType, 
//       incall: true, 
//       isReceivingCall: false, 
//       incomingCall: null,
//       isCallAccepted: true, 
//       isInitiating: false 
//     });
    
//     console.log("Call accepted successfully");
//     toast.success("Call connected");
//     return Promise.resolve();
    
//   } catch (error) {
//     console.error("Error accepting call:", error);
//     toast.error("Failed to accept call: " + error.message);
//     set({ incall: false });
//     return Promise.reject(error);
//   }
// },

// rejectCall:()=>{
//   const socket=useAuthStore.getState().socket;
//   const { incomingCall } = get();
  
//   if(!incomingCall){
//     console.error("No incoming call to reject");
//     return;
//   }
//   const { callId } = incomingCall;  
  
//   console.log("Rejecting call with callId:", callId);

//   socket.emit("reject-call", { callId: callId });  
  
  
//   set({
//     isReceivingCall: false,
//     incomingCall: null,
//     onCallWithWhom: null,
//     callTimeout: null,
//     callType: null,
//     isInitiating: false,
//     isCallAccepted: false,
//     currentCallId: null  
//   });
  
//   console.log("Call state completely reset after rejection");
// },

 



  
  
//   toggleMute: () => {
//     const { localStream, isMuted } = get();
//     if (!localStream) {
//       console.error("Cannot toggle mute: No local stream");
//       return;
//     }
    
//     const audioTracks = localStream.getAudioTracks();
//     if (audioTracks.length === 0) {
//       console.error("No audio tracks found to toggle mute");
//       return;
//     }
    
//     const newMuteState = !isMuted;
//     console.log(`Toggling mute state to: ${newMuteState ? 'muted' : 'unmuted'}`);
    
//     audioTracks.forEach(track => {
//       const oldState = track.enabled;
//       track.enabled = !newMuteState;
//       console.log(`Audio track ${track.id} changed:`, {
//         label: track.label,
//         oldState: oldState,
//         newState: track.enabled
//       });
//       console.log(`Audio track ${track.id} enabled: ${track.enabled}`);
//     });
    
//     set({ isMuted: newMuteState });
//     toast.success(newMuteState ? "Microphone muted" : "Microphone unmuted");
//   },
  
  
//   toggleVideo: (isVideoOff) => {
//     const { localStream } = get();
//     if (!localStream) {
//       console.log("Cannot toggle video: No local stream");
//       return;
//     }
    
//     const videoTracks = localStream.getVideoTracks();
//     if (videoTracks.length === 0) {
//       console.log("No video tracks found to toggle");
//       return;
//     }
    
//     videoTracks.forEach(track => {
//       track.enabled = !isVideoOff;
//       console.log(`Video track ${track.id} enabled: ${track.enabled}`);
//     });
    
//     toast.success(isVideoOff ? "Camera turned off" : "Camera turned on");
//   },
// }));
















