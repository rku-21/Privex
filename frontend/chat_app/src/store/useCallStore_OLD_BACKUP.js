import { create } from "zustand";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { use, useEffect } from "react";
import { useChatStore } from "./useChatStore";

export const useCallStore=create((set,get)=>({
  peerConnection:null,
  localStream:null,
  remoteStream:null,
  incall:false,
  callType:null,
  isReceivingCall:false,
  incomingCall:null,
  isMuted:false,
  isInitiating:false,
  isCallAccepted:false,
  onCallWithWhom:{},
  callTimeout: null,
  currentCallId: null, // 🆕 Track current call session ID

  // Initialize ringtone
  initRingtone: () => {
    if (typeof window !== 'undefined' && !get().ringtoneAudio) {
      const audio = new Audio('/sounds/callingTime.mp3');
      audio.loop = true;
      set({ ringtoneAudio: audio });
    }
  },

  // Play ringtone
  playRingtone: () => {
    const { ringtoneAudio, initRingtone } = get();
    if (!ringtoneAudio) {
      initRingtone();
    }
    const audio = get().ringtoneAudio;
    if (audio) {
      audio.play().catch(err => {
        console.error("Error playing ringtone:", err);
        toast.error("Could not play ringtone");
      });
    }
  },

  // Stop ringtone
  stopRingtone: () => {
    const { ringtoneAudio } = get();
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
    }
  },

  ringtoneAudio: null,


  setlocalStream:(stream)=>set({localStream:stream}),
  setremoteStream:(stream)=>set({remoteStream:stream}),
  setPeerConnection:(pc)=>set({peerConnection:pc}),
  setInCall:(value)=>set({incall:value}),
  setCallType:(type)=>set({callType:type}),

 // End a call and clean up resources
endCall: () => {
  console.log("endCall function called");
  const { localStream, peerConnection, callTimeout, currentCallId } = get();
  const socket = useAuthStore.getState().socket;

  // Stop ringing sound if it's playing
  get().stopRingtone();
  console.log("Stopped ringtone - call ended");

  // Clear any existing timeout
  if (callTimeout) {
    clearTimeout(callTimeout);
  }

  if (localStream) localStream.getTracks().forEach(track => track.stop());
  if (peerConnection) peerConnection.close();

  // 🆕 Emit with callId (production way)
  if (socket && currentCallId) {
    socket.emit("call-ended", { callId: currentCallId });
    console.log("call-ended event emitted for callId:", currentCallId);
  }

  // Immediate state reset
  set({
    peerConnection: null,
    localStream: null,
    remoteStream: null,
    incall: false,
    callType: null,
    isReceivingCall: false,
    incomingCall: null,
    isInitiating: false,
    isCallAccepted: false,
    onCallWithWhom: null,
    callTimeout: null,
    currentCallId: null  // 🆕 Clear callId
  });
  
  console.log("Call state completely reset, onCallWithWhom cleared");
  
  // Clean up the chat container state
  const chatStore = useChatStore.getState();
  chatStore.setselectedUser(null);
  
  // Force a navigation to clear the UI state
  if (typeof window !== 'undefined') {
    window.history.pushState({}, '', '/');
  }
  
  console.log("Call ended and state reset");
},
// Used specifically when receiving a call-ended or call-cancelled event
  handleCallEnded: (reason = '') => {
  console.log("handleCallEnded function called - resetting all call state", reason ? `(Reason: ${reason})` : '');
  
  // Get current state
  const { localStream, peerConnection } = get();
  
  // Clean up resources
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  
  if (peerConnection) {
    peerConnection.close();
  }

  // Reset all call-related state
  set({
    peerConnection: null,
    localStream: null,
    remoteStream: null,
    incall: false,
    callType: null,
    isReceivingCall: false,
    incomingCall: null,
    isInitiating: false,
    isCallAccepted: false,
    onCallWithWhom: null,
    currentCallId: null,  // 🆕 Clear callId
  });
  
  console.log("Call state reset complete, onCallWithWhom set to null");
  
  // Show appropriate message based on reason
  if (reason === 'timeout') {
    toast.error("Call timed out");
  }  // Reset all state
  set({
    peerConnection: null,
    localStream: null,
    remoteStream: null,
    incall: false,
    callType: null,
    isReceivingCall: false,
    incomingCall: null,
    isInitiating: false,
    isCallAccepted: false,
    onCallWithWhom: {}
  });

  // Clean up the chat container state
  const chatStore = useChatStore.getState();
  chatStore.setselectedUser(null);
  
  // Force a navigation to clear the UI state
  if (typeof window !== 'undefined') {
    window.history.pushState({}, '', '/');
  }
  
  console.log("Call state has been completely reset and selectedUser set to null");
},
// set caller side state after accepting the call
  callerSideStateWhenAccepted:()=>{
  console.log("Call has been accepted by callee, updating caller state");
  const { ringtoneAudio, callTimeout } = get();
  
  // Stop ringing sound
  get().stopRingtone();
  console.log("Stopped ringtone - call accepted");

  // Clear the 30-second timeout
  if (callTimeout) {
    clearTimeout(callTimeout);
  }

  set({
    isCallAccepted: true,
    isInitiating: false,
    incall: true,
    callTimeout: null
  });
  toast.success("Call has been accepted");
},

  
  // Handle incoming call
  handleIncomingCall: (data) => {
    console.log("handleIncomingCall called with:", data);
    
    // Validate the incoming data
    if (!data || !data.from || !data.offer || !data.callId) {
      console.error("Invalid incoming call data:", data);
      return;
    }
    
    // Use callType from data if provided, otherwise default to "audio"
    const callType = data.callType || data.type || "audio";
    
    // 🆕 Server handles timeout, no need for client-side timeout
    // Just update state with incoming call information
    set({
      isReceivingCall: true,
      incomingCall: {
        callId: data.callId,  // 🆕 Store callId
        from: data.from,
        offer: data.offer,
        callType: callType
      },
      currentCallId: data.callId  // 🆕 Track current call session
    });
    
    set({
      onCallWithWhom: {
        fullname: data.from?.fullname,
        profilePicture: data.from?.profilePicture
      }
    });

    console.log("Call state updated with auto-reject timeout:", {
      isReceivingCall: get().isReceivingCall,
      incomingCall: get().incomingCall
    });
  },

  // first initiate the call
 initiateCall: async (receiverId, callType) => {
  console.log("Initiating call to:", receiverId, "with type:", callType);

  const socket = useAuthStore.getState().socket;

  // Initialize and start playing ringing sound
  get().initRingtone();
  setTimeout(() => {
    get().playRingtone();
    console.log("Started playing ringtone");
  }, 100);

  // 🆕 Server handles timeout automatically (30s), no need for client-side timeout
  
  set({ callType: callType, incall: true, isInitiating: true});

  try {
    // 1️⃣ Create PeerConnection with STUN servers
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ]
    });
    console.log("PeerConnection created:", pc);

    set({ peerConnection: pc });

    // 2️⃣ Get local media (audio or video)
    const constraints = callType === "video" ? { video: true, audio: true } : { audio: true };
    const localStream = await navigator.mediaDevices.getUserMedia(constraints);
    set({ localStream });
    console.log("Local stream obtained:", localStream);
    console.log("Local stream audio tracks:", localStream.getAudioTracks());
    console.log("Local stream audio track enabled:", localStream.getAudioTracks()[0]?.enabled);

    // Add tracks to the peer connection
    localStream.getTracks().forEach(track => {
      console.log(`Adding track to peer connection: ${track.kind} [enabled: ${track.enabled}]`);
      pc.addTrack(track, localStream);
    });

    // 3️⃣ Prepare remote stream
    set({ remoteStream: null }); // Clear first
    console.log("Remote stream prepared");

    // Handle incoming tracks - use the stream from the event directly
    pc.ontrack = (event) => {
      console.log(`Received remote track: ${event.track.kind} [enabled: ${event.track.enabled}]`);
      
      // Use the first stream from the event directly (this is the remote peer's stream)
      if (event.streams && event.streams[0]) {
        const incomingStream = event.streams[0];
        console.log("Using remote stream from event:", incomingStream.id);
        console.log("Remote stream tracks:", incomingStream.getTracks().map(t => `${t.kind}:${t.id}`));
        
        // Set the remote stream only once when we first receive it
        const currentRemote = get().remoteStream;
        if (!currentRemote || currentRemote.id !== incomingStream.id) {
          set({ remoteStream: incomingStream });
          console.log("Remote stream set successfully");
        }
      }
    };
    console.log("ontrack handler set up");
    
    // Monitor connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state changed: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
        toast.error("Media connection failed or disconnected.");
        
        // If call was already accepted, handle as a remote end
        if (get().isCallAccepted) {
          console.log("Call ended due to ICE connection state: " + pc.iceConnectionState);
          setTimeout(() => {
            if (get().isCallAccepted) { // Double-check we're still in a call
              get().handleCallEnded();
            }
          }, 1000); // Small delay to allow for potential reconnection
        }
      } else if (pc.iceConnectionState === 'connected') {
        toast.success("Media connection established!");
      }
    };
    
    pc.onconnectionstatechange = () => {
      console.log(`Connection state changed: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
        // If call was already accepted, handle as a remote end
        if (get().isCallAccepted) {
          console.log("Call ended due to connection state: " + pc.connectionState);
          setTimeout(() => {
            if (get().isCallAccepted) { // Double-check we're still in a call
              get().handleCallEnded();
            }
          }, 1000); // Small delay to allow for potential reconnection
        }
      }
    };

    // 4️⃣ Handle ICE candidates - will be updated after receiving callId from server
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const { currentCallId } = get();
        if (currentCallId) {
          socket.emit("ice-candidate", {
            callId: currentCallId,  // 🆕 Use callId instead of userId
            candidate: event.candidate,
          });
        }
      }
    };
    console.log("icecandidate handler set up");

    // 5️⃣ Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("Offer created and set as local description:", offer);

    // 6️⃣ Send offer to the receiver via socket ans emiting function
    socket.emit("call-user", {
      to: receiverId,
      offer: offer,
      callType: callType,
      from: useAuthStore.getState().authUser._id,
    });
    const targetUser=useChatStore.getState().friends.find((friend)=>friend._id===receiverId);
    set({
      onCallWithWhom: {
        fullname: targetUser?.fullname,
        profilePicture: targetUser?.profilePicture
      }
    });

    console.log("Call initiated to:", receiverId);

  } catch (error) {
    console.error("Error initiating call:", error);
    toast.error("Error initiating call");
    set({ inCall: false });
  }
},

 // make the function for accepting the call
 acceptCall: async () => {
  const socket = useAuthStore.getState().socket;
  const { incomingCall } = get();
  
  if(!incomingCall) {
    console.error("No incoming call to accept");
    return Promise.reject("No incoming call to accept");
  }
  
  const { callId, from, offer, callType } = incomingCall;  // 🆕 Extract callId
  const callerId = typeof from === 'object' && from !== null ? from._id : from;
  
  console.log("Accepting call from:", callerId, "with offer:", offer);
  
  try {
    // 1. Create RTCPeerConnection if it doesn't exist
    let pc = get().peerConnection;
    if (!pc) {
      console.log("Creating new peer connection for accepting call");
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ]
      });
      set({ peerConnection: pc });
    }
    
    // 2. Get local media stream
    let localStream = get().localStream;
    if (!localStream) {
      console.log("Getting local media stream");
      const constraints = callType === "video" ? { video: true, audio: true } : { audio: true };
      localStream = await navigator.mediaDevices.getUserMedia(constraints);
      set({ localStream });
      
      // Add local tracks to peer connection
      localStream.getTracks().forEach(track => {
        console.log(`Adding ${track.kind} track to peer connection [enabled: ${track.enabled}]`);
        pc.addTrack(track, localStream);
      });
    }
    
    // 3. Set up remote stream for incoming media
    set({ remoteStream: null }); // Clear first
    
    // 4. Setup track handler - use the stream from event directly
    pc.ontrack = (event) => {
      console.log(`Remote track received: ${event.track.kind} [enabled: ${event.track.enabled}]`);
      
      // Use the remote stream from the event directly
      if (event.streams && event.streams[0]) {
        const incomingStream = event.streams[0];
        console.log("Using remote stream from event:", incomingStream.id);
        console.log("Remote stream tracks:", incomingStream.getTracks().map(t => `${t.kind}:${t.id}`));
        
        // Set the remote stream only once when we first receive it
        const currentRemote = get().remoteStream;
        if (!currentRemote || currentRemote.id !== incomingStream.id) {
          set({ remoteStream: incomingStream });
          console.log("Remote stream set successfully");
        }
        
        // Debug log for audio tracks
        const audioTracks = incomingStream.getAudioTracks();
        console.log(`Remote stream has ${audioTracks.length} audio tracks`);
        audioTracks.forEach(track => {
          console.log("Audio Track State:", {
            id: track.id,
            label: track.label,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState
          });
        });
      }

      // Monitor track ended events
      event.track.onended = () => {
        console.log(`Remote track ${event.track.kind} ended`);
      };

      // Monitor track mute events
      event.track.onmute = () => {
        console.log(`Remote track ${event.track.kind} muted`);
      };

      // Monitor track unmute events
      event.track.onunmute = () => {
        console.log(`Remote track ${event.track.kind} unmuted`);
      };
    };
    
    // Monitor connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state changed: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
        toast.error("Media connection failed or disconnected.");
        
        // If call was already accepted, handle as a remote end
        if (get().isCallAccepted) {
          console.log("Call ended due to ICE connection state: " + pc.iceConnectionState);
          setTimeout(() => {
            if (get().isCallAccepted) { // Double-check we're still in a call
              get().handleCallEnded();
            }
          }, 1000); // Small delay to allow for potential reconnection
        }
      } else if (pc.iceConnectionState === 'connected') {
        toast.success("Media connection established!");
      }
    };
    
    pc.onconnectionstatechange = () => {
      console.log(`Connection state changed: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
        // If call was already accepted, handle as a remote end
        if (get().isCallAccepted) {
          console.log("Call ended due to connection state: " + pc.connectionState);
          setTimeout(() => {
            if (get().isCallAccepted) { // Double-check we're still in a call
              get().handleCallEnded();
            }
          }, 1000); // Small delay to allow for potential reconnection
        }
      }
    };
    
    // 5. Set up ICE candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log("Sending ICE candidate to caller");
        socket.emit("ice-candidate", {
          callId: callId,  // 🆕 Use callId instead of userId
          candidate: event.candidate,
        });
      }
    };
    
    // 6. Accept the offer
    console.log("Setting remote description");
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    
    console.log("Creating answer");
    const answer = await pc.createAnswer();
    
    console.log("Setting local description");
    await pc.setLocalDescription(answer);
    
    // 7. Send answer back to caller
    console.log("Sending answer to caller with callId:", callId);
    socket.emit("answer-call", {
      callId: callId,  // 🆕 Use callId instead of userId
      answer: answer,
    });
    
    // 8. Update state to show call is accepted
    set({ 
      callType: callType, 
      incall: true, 
      isReceivingCall: false, 
      incomingCall: null,
      isCallAccepted: true, 
      isInitiating: false 
    });
    
    console.log("Call accepted successfully");
    toast.success("Call connected");
    return Promise.resolve();
    
  } catch (error) {
    console.error("Error accepting call:", error);
    toast.error("Failed to accept call: " + error.message);
    set({ incall: false });
    return Promise.reject(error);
  }
},
// make the function for rejecting the call
rejectCall:()=>{
  const socket=useAuthStore.getState().socket;
  const { incomingCall } = get();
  
  if(!incomingCall){
    console.error("No incoming call to reject");
    return;
  }
  const { callId } = incomingCall;  // 🆕 Extract callId
  
  console.log("Rejecting call with callId:", callId);

  socket.emit("reject-call", { callId: callId });  // 🆕 Use callId
  
  // Complete state reset
  set({
    isReceivingCall: false,
    incomingCall: null,
    onCallWithWhom: null,
    callTimeout: null,
    callType: null,
    isInitiating: false,
    isCallAccepted: false,
    currentCallId: null  // 🆕 Clear callId
  });
  
  console.log("Call state completely reset after rejection");
},

 



  
  // Toggle mute state
  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (!localStream) {
      console.error("Cannot toggle mute: No local stream");
      return;
    }
    
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.error("No audio tracks found to toggle mute");
      return;
    }
    
    const newMuteState = !isMuted;
    console.log(`Toggling mute state to: ${newMuteState ? 'muted' : 'unmuted'}`);
    
    audioTracks.forEach(track => {
      const oldState = track.enabled;
      track.enabled = !newMuteState;
      console.log(`Audio track ${track.id} changed:`, {
        label: track.label,
        oldState: oldState,
        newState: track.enabled
      });
      console.log(`Audio track ${track.id} enabled: ${track.enabled}`);
    });
    
    set({ isMuted: newMuteState });
    toast.success(newMuteState ? "Microphone muted" : "Microphone unmuted");
  },
  
  // Toggle video on/off
  toggleVideo: (isVideoOff) => {
    const { localStream } = get();
    if (!localStream) {
      console.log("Cannot toggle video: No local stream");
      return;
    }
    
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) {
      console.log("No video tracks found to toggle");
      return;
    }
    
    videoTracks.forEach(track => {
      track.enabled = !isVideoOff;
      console.log(`Video track ${track.id} enabled: ${track.enabled}`);
    });
    
    toast.success(isVideoOff ? "Camera turned off" : "Camera turned on");
  },
}));



// Note: Socket event handling is now in useAuthStore.js
// This ensures events are properly registered when the socket is created











