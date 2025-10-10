import { create } from "zustand";
import { useAuthStore } from "./useAuthStore.js";
import toast from "react-hot-toast";

export const useCallStore = create((set, get) => ({
  incomingCall: null,
  peerConnection: null,
  localStream: null,
  remoteStream: null,
  inCall: false,
  callType: null, // 'audio' or 'video'
  isReceivingCall: false,
  isLocalVideoEnabled: false,
  isRemoteVideoEnabled: false,

  // 📞 Start call
  startCall: async (receiverId, type = 'video') => {
    const { socket } = useAuthStore.getState();
    if (!socket) {
      console.error("Cannot start call: No socket connection");
      toast.error("Cannot connect to chat server");
      return;
    }
    
    if (!receiverId) {
      console.error("Cannot start call: No receiver ID provided");
      toast.error("Cannot start call: Invalid recipient");
      return;
    }
    
    console.log(`Starting ${type} call to user ${receiverId}`);

    // Store receiverId globally for persistence across component unmounts
    window._currentCallRecipient = receiverId;
    
    // Create peer connection with improved STUN/TURN servers
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" }
      ],
    });
    
    // Store recipient ID on the peer connection object for reference
    peer._lastRecipient = receiverId;
    
    set({ peerConnection: peer });

    try {
      console.log(`Requesting user media with video: ${type === 'video'}, audio: true`);
      
      // Local media with more specific constraints for better quality
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: true,
      });
      
      // Check if video track exists and is enabled
      const hasVideoTrack = localStream.getVideoTracks().length > 0;
      console.log(`Local stream has video tracks: ${hasVideoTrack}`);
      
      // Add all tracks to peer connection
      localStream.getTracks().forEach((track) => {
        console.log(`Adding track to peer connection: ${track.kind}, enabled: ${track.enabled}`);
        peer.addTrack(track, localStream);
      });
      
      set({ 
        localStream, 
        isLocalVideoEnabled: hasVideoTrack 
      });

      // Remote media with enhanced handling
      const remoteStream = new MediaStream();
      peer.ontrack = (event) => {
        console.log(`Received remote track: ${event.track.kind}, enabled: ${event.track.enabled}, readyState: ${event.track.readyState}`);
        
        // Make sure we have the event.streams[0]
        if (!event.streams || !event.streams[0]) {
          console.warn("Received track without stream, adding track directly");
          remoteStream.addTrack(event.track);
        } else {
          event.streams[0].getTracks().forEach((track) => {
            console.log(`Adding remote track to stream: ${track.kind}, enabled=${track.enabled}, id=${track.id}`);
            
            // Make sure track is enabled for video
            if (track.kind === 'video' && !track.enabled) {
              console.log("Enabling disabled video track");
              track.enabled = true;
            }
            
            remoteStream.addTrack(track);
          });
        }
        
        // Check if remote stream has video tracks
        const hasRemoteVideo = remoteStream.getVideoTracks().length > 0;
        console.log(`Remote stream has video tracks: ${hasRemoteVideo}`);
        
        // Log details about all tracks in the remote stream
        const videoTracks = remoteStream.getVideoTracks();
        const audioTracks = remoteStream.getAudioTracks();
        console.log(`Remote stream now has ${videoTracks.length} video tracks and ${audioTracks.length} audio tracks`);
        
        if (videoTracks.length > 0) {
          console.log(`Video track details: enabled=${videoTracks[0].enabled}, readyState=${videoTracks[0].readyState}`);
        }
        
        // Immediately set the stream in the state to update UI
        set({ 
          remoteStream,
          isRemoteVideoEnabled: hasRemoteVideo 
        });
        
        // Add a delayed check to make sure video tracks are still working
        setTimeout(() => {
          const currentVideoTracks = remoteStream.getVideoTracks();
          if (currentVideoTracks.length > 0) {
            console.log("Delayed check - Remote video track status:", 
              currentVideoTracks.map(t => `enabled: ${t.enabled}, readyState: ${t.readyState}`).join(', '));
          }
        }, 2000);
      };
      
      // Handle connection state changes with automatic disconnection
      peer.onconnectionstatechange = () => {
        console.log("Connection state changed:", peer.connectionState);
        
        // Auto-end call if connection fails or disconnects
        if (peer.connectionState === "failed" || 
            peer.connectionState === "disconnected" ||
            peer.connectionState === "closed") {
          console.log("Call disconnected due to connection state:", peer.connectionState);
          
          // Delay slightly to allow potential reconnect
          setTimeout(() => {
            if (peer.connectionState === "failed" || 
                peer.connectionState === "disconnected" ||
                peer.connectionState === "closed") {
              toast.error("Call disconnected");
              get().endCall();
            }
          }, 5000);
        }
      };
      
      // Handle ICE connection state changes
      peer.oniceconnectionstatechange = () => {
        console.log("ICE connection state changed:", peer.iceConnectionState);
      };
    } catch (err) {
      console.error("Error getting user media:", err);
      toast.error("Couldn't access camera or microphone. Please check permissions.");
      return;
    }

    // ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate to:", receiverId);
        socket.emit("ice-candidate", { to: receiverId, candidate: event.candidate });
      }
    };

    try {
      // Create & send offer
      console.log("Creating offer for:", receiverId);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("call-user", { to: receiverId, offer, type });
      console.log("Call offer sent to:", receiverId);

      set({ inCall: true, callType: type });
    } catch (err) {
      console.error("Error creating or sending offer:", err);
      toast.error("Call setup failed. Please try again.");
    }
  },

  // 📞 Handle incoming call
  receiveCall: ({ from, offer, type = 'video' }) => {
    console.log(`Receiving ${type} call from ${from}`, { hasOffer: !!offer });
    
    // No toast notification here - we'll use only the custom toast in ChatContainer
    
    // Store incoming call data
    set({ 
      incomingCall: { from, offer, type },
      isReceivingCall: true,
      callType: type
    });
    
    // Play ringtone sound
    try {
      const audio = new Audio('/ringtone.mp3');
      audio.loop = true;
      audio.play();
      
      // Store audio reference to stop it later
      window._ringtoneAudio = audio;
      
      // Stop ringtone after 30 seconds if not answered
      setTimeout(() => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      }, 30000);
    } catch (err) {
      console.error("Error playing ringtone:", err);
    }
  },

  // 📞 Reject call with improved reliability
  rejectCall: () => {
    const { socket } = useAuthStore.getState();
    const { incomingCall } = get();
    
    console.log("rejectCall called with state:", {
      hasSocket: !!socket,
      incomingCall
    });
    
    // Stop ringtone if playing
    if (window._ringtoneAudio) {
      console.log("Stopping ringtone in rejectCall");
      window._ringtoneAudio.pause();
      window._ringtoneAudio.currentTime = 0;
      window._ringtoneAudio = null;
    }
    
    if (socket && incomingCall?.from) {
      console.log("Sending reject-call to:", incomingCall.from);
      
      // Send rejection multiple times to ensure it gets through
      socket.emit("reject-call", { to: incomingCall.from });
      
      // Backup rejection after a short delay
      setTimeout(() => {
        socket.emit("reject-call", { to: incomingCall.from });
      }, 300);
    } else {
      console.warn("Cannot reject call: Missing socket or recipient ID", {
        hasSocket: !!socket,
        recipientId: incomingCall?.from
      });
    }
    
    // Clean up state
    set({ incomingCall: null, isReceivingCall: false, callType: null });
  },

  // 📞 Answer call with improved reliability
  answerCall: async () => {
    const { socket } = useAuthStore.getState();
    const { incomingCall } = get();
    
    console.log("answerCall called with state:", {
      hasSocket: !!socket,
      incomingCall
    });
    
    // Stop ringtone if playing
    if (window._ringtoneAudio) {
      console.log("Stopping ringtone in answerCall");
      window._ringtoneAudio.pause();
      window._ringtoneAudio.currentTime = 0;
      window._ringtoneAudio = null;
    }
    
    if (!socket) {
      console.error("Cannot answer call: No socket connection");
      toast.error("Cannot connect to chat server");
      return;
    }
    
    if (!incomingCall) {
      console.error("Cannot answer call: No incoming call data");
      toast.error("Call connection error");
      return;
    }

    // Store caller ID globally for persistence across component unmounts
    window._currentCallRecipient = incomingCall.from;
    
    // Create peer connection with improved STUN/TURN servers
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" }
      ],
    });
    
    // Store caller ID on the peer connection object for reference
    peer._lastRecipient = incomingCall.from;
    
    set({ peerConnection: peer });

    // Use the call type from incomingCall
    const type = incomingCall.type || 'video';
    console.log(`Answering ${type} call from ${incomingCall.from}`);
    
    try {
      // Local media with more specific constraints for better quality
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: true,
      });
      
      // Check if video track exists and is enabled
      const hasVideoTrack = localStream.getVideoTracks().length > 0;
      console.log(`Local stream has video tracks: ${hasVideoTrack}`);
      
      localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));
      set({ 
        localStream,
        isLocalVideoEnabled: hasVideoTrack
      });

      const remoteStream = new MediaStream();
      
      // Enhanced ontrack handler with better debugging and reliability
      peer.ontrack = (event) => {
        console.log(`Received remote track: ${event.track.kind}, enabled: ${event.track.enabled}, readyState: ${event.track.readyState}`);
        
        // Make sure we have the event.streams[0]
        if (!event.streams || !event.streams[0]) {
          console.warn("Received track without stream, adding track directly");
          remoteStream.addTrack(event.track);
        } else {
          event.streams[0].getTracks().forEach((track) => {
            console.log(`Adding remote track to stream: ${track.kind}, enabled=${track.enabled}, id=${track.id}`);
            
            // Make sure track is enabled for video
            if (track.kind === 'video' && !track.enabled) {
              console.log("Enabling disabled video track");
              track.enabled = true;
            }
            
            remoteStream.addTrack(track);
          });
        }
        
        // Check if remote stream has video tracks
        const hasRemoteVideo = remoteStream.getVideoTracks().length > 0;
        console.log(`Remote stream has video tracks: ${hasRemoteVideo}`);
        
        // Log details about all tracks in the remote stream
        const videoTracks = remoteStream.getVideoTracks();
        const audioTracks = remoteStream.getAudioTracks();
        console.log(`Remote stream now has ${videoTracks.length} video tracks and ${audioTracks.length} audio tracks`);
        
        if (videoTracks.length > 0) {
          console.log(`Video track details: enabled=${videoTracks[0].enabled}, readyState=${videoTracks[0].readyState}`);
        }
        
        // Immediately set the stream in the state to update UI
        set({ 
          remoteStream,
          isRemoteVideoEnabled: hasRemoteVideo 
        });
        
        // Add a delayed check to make sure video tracks are still working
        setTimeout(() => {
          const currentVideoTracks = remoteStream.getVideoTracks();
          if (currentVideoTracks.length > 0) {
            console.log("Delayed check - Remote video track status:", 
              currentVideoTracks.map(t => `enabled: ${t.enabled}, readyState: ${t.readyState}`).join(', '));
          }
        }, 2000);
      };
      
      // Handle connection state changes
      peer.onconnectionstatechange = () => {
        console.log("Connection state changed:", peer.connectionState);
      };
      
      // Handle ICE connection state changes
      peer.oniceconnectionstatechange = () => {
        console.log("ICE connection state changed:", peer.iceConnectionState);
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate to:", incomingCall.from);
          socket.emit("ice-candidate", { to: incomingCall.from, candidate: event.candidate });
        }
      };

      await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      console.log("Sending answer to:", incomingCall.from);
      socket.emit("answer-call", { to: incomingCall.from, answer });
      
      set({ 
        inCall: true, 
        isReceivingCall: false, 
        callType: type
      });
      
      // Keep a copy of incoming call data for reconnection purposes
      window._lastIncomingCall = {...incomingCall};
      
    } catch (err) {
      console.error("Error answering call:", err);
      toast.error("Couldn't access camera or microphone. Please check permissions.");
      
      // Reject the call if we couldn't answer
      socket.emit("reject-call", { to: incomingCall.from });
      set({ isReceivingCall: false, incomingCall: null });
    }
  },

  // 📞 Handle call answered
  handleCallAnswered: async (answer) => {
    const { peerConnection } = get();
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  },

  // 📡 Handle ICE candidate
  handleIceCandidate: async (candidate) => {
    const { peerConnection } = get();
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    }
  },

  // ❌ End call
  endCall: () => {
    const { socket } = useAuthStore.getState();
    const { peerConnection, localStream, remoteStream, incomingCall } = get();
    
    // Store info about the current call recipient before we clean up
    let recipientId = null;
    
    // Try to find the recipient from various sources
    if (incomingCall?.from) {
      recipientId = incomingCall.from;
    } else if (peerConnection?._lastRecipient) {
      recipientId = peerConnection._lastRecipient;
    } else if (window._currentCallRecipient) {
      recipientId = window._currentCallRecipient;
    }
    
    console.log("Ending call with recipient:", recipientId);
    
    // If we have a recipient, notify them that we're ending the call
    // This is critical - make multiple attempts to ensure it gets through
    if (socket && recipientId) {
      // Send immediately
      socket.emit("call-ended", { to: recipientId });
      
      // Then send again after a short delay as a backup
      setTimeout(() => {
        socket.emit("call-ended", { to: recipientId });
      }, 500);
      
      // And send one more time with reason
      setTimeout(() => {
        socket.emit("call-ended", { 
          to: recipientId,
          reason: "explicit_end" 
        });
      }, 1000);
    }
    
    // Cleanup resources
    if (peerConnection) {
      try {
        // First remove all tracks to trigger proper cleanup events
        const senders = peerConnection.getSenders();
        senders.forEach(sender => {
          if (sender.track) {
            sender.track.stop();
            try {
              peerConnection.removeTrack(sender);
            } catch (e) {
              console.log("Error removing track", e);
            }
          }
        });
        
        // Close the connection after tracks are removed
        peerConnection.close();
      } catch (err) {
        console.error("Error closing peer connection:", err);
      }
    }
    
    // Cleanup local media
    if (localStream) {
      try {
        localStream.getTracks().forEach((t) => {
          console.log(`Stopping local track: ${t.kind} (${t.id})`);
          t.enabled = false; // Immediately disable
          t.stop();
        });
      } catch (err) {
        console.error("Error stopping local stream tracks:", err);
      }
    }
    
    // Cleanup remote media
    if (remoteStream) {
      try {
        remoteStream.getTracks().forEach((t) => {
          console.log(`Stopping remote track: ${t.kind} (${t.id})`);
          t.enabled = false; // Immediately disable
          t.stop();
        });
      } catch (err) {
        console.error("Error stopping remote stream tracks:", err);
      }
    }

    // Reset state
    set({
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      inCall: false,
      incomingCall: null,
      isReceivingCall: false,
      callType: null,
      isLocalVideoEnabled: false,
      isRemoteVideoEnabled: false
    });
    
    // Clear any global state used for call persistence
    delete window._currentCallRecipient;
  },
  
  // Handle when peer ends call - with improved cleanup
  handleCallEnded: () => {
    const { peerConnection, localStream, remoteStream } = get();
    
    console.log("Remote party ended call, cleaning up all resources");
    
    // Clean up peer connection
    if (peerConnection) {
      try {
        // First remove all tracks to trigger proper cleanup events
        const senders = peerConnection.getSenders();
        senders.forEach(sender => {
          if (sender.track) {
            sender.track.stop();
            try {
              peerConnection.removeTrack(sender);
            } catch (e) {
              console.log("Error removing track", e);
            }
          }
        });
        
        // Close the connection after tracks are removed
        peerConnection.close();
      } catch (err) {
        console.error("Error closing peer connection:", err);
      }
    }
    
    // Cleanup local media
    if (localStream) {
      try {
        localStream.getTracks().forEach((t) => {
          console.log(`Stopping local track: ${t.kind} (${t.id})`);
          t.enabled = false; // Immediately disable
          t.stop();
        });
      } catch (err) {
        console.error("Error stopping local stream tracks:", err);
      }
    }
    
    // Cleanup remote media
    if (remoteStream) {
      try {
        remoteStream.getTracks().forEach((t) => {
          console.log(`Stopping remote track: ${t.kind} (${t.id})`);
          t.enabled = false; // Immediately disable
          t.stop();
        });
      } catch (err) {
        console.error("Error stopping remote stream tracks:", err);
      }
    }
    
    // Clear any global state used for call persistence
    delete window._currentCallRecipient;
    delete window._lastIncomingCall;

    // Reset all state values
    set({
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      inCall: false,
      incomingCall: null,
      isReceivingCall: false,
      callType: null,
      isLocalVideoEnabled: false,
      isRemoteVideoEnabled: false
    });
  },
  
  // Toggle between audio and video call
  toggleVideoCall: async () => {
    const { localStream, peerConnection, callType } = get();
    const { socket } = useAuthStore.getState();
    
    // If we're already in a call, we need to modify the stream
    if (!localStream || !peerConnection) return;
    
    const newType = callType === 'video' ? 'audio' : 'video';
    console.log(`Toggling call type from ${callType} to ${newType}`);
    
    try {
      // If switching to video, add video track
      if (newType === 'video') {
        console.log("Creating new video stream");
        
        // Create a completely new stream for video
        const newMediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false  // Don't duplicate audio tracks
        });
        
        // Get the new video track
        const videoTrack = newMediaStream.getVideoTracks()[0];
        
        if (videoTrack) {
          console.log("Adding video track to peer connection", videoTrack.id);
          
          // Store videoTrack ID for debugging
          const videoTrackId = videoTrack.id;
          
          // Add track to peer connection
          const existingSenders = peerConnection.getSenders();
          const videoSender = existingSenders.find(sender => 
            sender.track && sender.track.kind === 'video'
          );
          
          if (videoSender) {
            console.log("Replacing existing video track", videoSender.track?.id, "with", videoTrackId);
            await videoSender.replaceTrack(videoTrack);
          } else {
            console.log("Adding new video track to connection", videoTrackId);
            peerConnection.addTrack(videoTrack, newMediaStream);
          }
          
          // Create a new stream that combines the old audio with new video
          const combinedStream = new MediaStream();
          
          // Add existing audio tracks from local stream
          localStream.getAudioTracks().forEach(track => {
            combinedStream.addTrack(track);
          });
          
          // Add the new video track
          combinedStream.addTrack(videoTrack);
          
          // Store the combined stream as the new localStream
          set({ 
            localStream: combinedStream, 
            isLocalVideoEnabled: true 
          });
          
          // Debug check that stream actually has video
          console.log("New combined stream has video tracks:", 
            combinedStream.getVideoTracks().length, 
            "first track ID:", combinedStream.getVideoTracks()[0]?.id);
        }
      } else {
        // If switching to audio only, disable video track
        const videoTracks = localStream.getVideoTracks();
        console.log(`Disabling ${videoTracks.length} video tracks`);
        
        if (videoTracks.length > 0) {
          videoTracks.forEach(track => {
            // Just disable the track instead of stopping completely
            track.enabled = false;
            
            // Optional: stop the track if we want to completely remove it
            track.stop();
            
            // Find the sender for this track and replace with null track
            const senders = peerConnection.getSenders();
            const sender = senders.find(s => s.track && s.track.id === track.id);
            if (sender) {
              console.log("Removing video track from sender", track.id);
              sender.replaceTrack(null);
            }
          });
        }
        
        set({ isLocalVideoEnabled: false });
      }
      
      // Update the call type
      set({ callType: newType });
      
      // Renegotiate the connection
      if (peerConnection) {
        console.log("Creating new offer to renegotiate connection");
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        // Find the recipient ID
        let recipientId = null;
        
        // Check for recent ICE candidate recipient
        if (peerConnection._lastIceCandidateTo) {
          recipientId = peerConnection._lastIceCandidateTo;
        } 
        // Check for incoming call sender
        else if (get().incomingCall?.from) {
          recipientId = get().incomingCall.from;
        }
        // Check if we're connected with the current selected user
        else if (localStream) {
          // Try to extract from any stored connection info
          const connectedPeers = peerConnection.getStats();
          recipientId = connectedPeers?.selectedCandidatePair?.remoteCandidateId;
        }
        
        console.log("Sending update-call to:", recipientId);
        
        // Send the new offer to the peer
        socket.emit("update-call", { 
          offer,
          type: newType,
          to: recipientId
        });
      }
      
    } catch (err) {
      console.error("Error toggling video:", err);
    }
  },
}));
