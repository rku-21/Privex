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
  const { localStream, peerConnection, ringtoneAudio, callTimeout } = get();
  const socket = useAuthStore.getState().socket;
  const calleeId = useAuthStore.getState().selectedUser?._id; // capture before reset

  // Stop ringing sound if it's playing
  get().stopRingtone();
  console.log("Stopped ringtone - call ended");

  // Clear any existing timeout
  if (callTimeout) {
    clearTimeout(callTimeout);
  }

  if (localStream) localStream.getTracks().forEach(track => track.stop());
  if (peerConnection) peerConnection.close();

  // Emit before resetting state
  if (socket && calleeId) {
    socket.emit("call-ended", { to: calleeId });
    console.log("call-ended event emitted for user:", calleeId);
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
    onCallWithWhom: null,  // Set to null instead of {}
    callTimeout: null  // Ensure timeout is cleared in state
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
    onCallWithWhom: null,  // Change from {} to null for more explicit reset
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
    if (!data || !data.from || !data.offer) {
      console.error("Invalid incoming call data:", data);
      return;
    }
    
    // Use callType from data if provided, otherwise default to "audio"
    const callType = data.callType || data.type || "audio";
    
    // Set up auto-reject timeout (30 seconds)
    const autoRejectTimeout = setTimeout(() => {
      const { isReceivingCall, isCallAccepted } = get();
      // Only auto-reject if the call is still receiving and not accepted
      if (isReceivingCall && !isCallAccepted) {
        console.log("Auto-rejecting call after 30 seconds timeout");
        get().rejectCall();  // Auto-reject the call
      }
    }, 30000);
    
    // Update state with incoming call information
    set({
      isReceivingCall: true,
      incomingCall: {
        from: data.from,
        offer: data.offer,
        callType: callType
      },
      callTimeout: autoRejectTimeout  // Store the timeout reference
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
  }, 100); // Small delay to ensure audio is properly initialized

  // Set timeout for 30 seconds
  const timeout = setTimeout(() => {
    const { isCallAccepted } = get();
    if (!isCallAccepted) {
      console.log("Call not answered within 30 seconds, ending call");
      
      // First emit timeout event to the callee
      socket.emit("call-timeout", {
        to: receiverId,
        from: useAuthStore.getState().authUser._id  // Add caller ID for better tracking
      });
      console.log("call-timeout event emitted to:", receiverId);
      
      // Wait a short moment to ensure the event has time to be processed
      setTimeout(() => {
        // Then clean up local state
        get().stopRingtone();
        get().handleCallEnded('timeout');
        
        // Clear any existing timeout
        clearTimeout(timeout);
        set({ callTimeout: null });
      }, 500); // Small delay to ensure callee receives the event
    }
  }, 30000);

  // Store the timeout in state
  set({ callTimeout: timeout });

  set({ callTimeout: timeout });

  
  
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
    const remoteStream = new MediaStream();
    set({ remoteStream });
    console.log("Remote stream prepared:", remoteStream);

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log(`Received remote track: ${event.track.kind} [enabled: ${event.track.enabled}]`);
      
      event.streams[0].getTracks().forEach(track => {
        console.log(`Adding ${track.kind} track to remote stream`);
        remoteStream.addTrack(track);
      });
      
      // Update remote stream in state to trigger UI update
      set({ remoteStream: remoteStream });
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

    // 4️⃣ Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: receiverId,
          candidate: event.candidate,
        });
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
  const { incomingCall, callTimeout } = get();
  
  // Clear auto-reject timeout if it exists
  if (callTimeout) {
    console.log("Clearing auto-reject timeout - call being accepted");
    clearTimeout(callTimeout);
    set({ callTimeout: null });
  }
  
  if(!incomingCall) {
    console.error("No incoming call to accept");
    return Promise.reject("No incoming call to accept");
  }
  
  const { from, offer, callType } = incomingCall;
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
    const remoteStream = new MediaStream();
    set({ remoteStream });
    
    // 4. Setup track handler
    pc.ontrack = (event) => {
      console.log(`Remote track received: ${event.track.kind} [enabled: ${event.track.enabled}]`);
      
      // Handle tracks from event.streams[0]
      event.streams[0].getTracks().forEach(track => {
        console.log(`Adding ${track.kind} track to remote stream [enabled: ${track.enabled}]`);
        // Make sure audio tracks are enabled by default
        if (track.kind === 'audio') {
          track.enabled = true;
        }
        remoteStream.addTrack(track);
      });
      
      // Update state to trigger UI refresh
      set({ remoteStream: remoteStream });
      
      // Debug log for audio tracks after adding
      const audioTracks = remoteStream.getAudioTracks();
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
          to: callerId,
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
    console.log("Sending answer to caller:", callerId);
    socket.emit("answer-call", {
      to: callerId,
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
  const { incomingCall, callTimeout } = get();
  
  // Clear auto-reject timeout if it exists
  if (callTimeout) {
    console.log("Clearing existing call timeout");
    clearTimeout(callTimeout);
  }
  
  if(!incomingCall){
    console.error("No incoming call to reject");
    return;
  }
  const {from}=incomingCall;
  
  // Handle the case where 'from' can be an object with user details or just an ID string
  const callerId = typeof from === 'object' && from !== null ? from._id : from;
  
  console.log("Rejecting call from:", callerId);

  socket.emit("reject-call",{to:callerId});
  
  // Complete state reset
  set({
    isReceivingCall: false,
    incomingCall: null,
    onCallWithWhom: null,
    callTimeout: null,
    callType: null,
    isInitiating: false,
    isCallAccepted: false
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











