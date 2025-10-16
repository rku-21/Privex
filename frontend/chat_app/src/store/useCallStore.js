import {create} from 'zustand';
import { useAuthStore } from './useAuthStore';
import toast from 'react-hot-toast';


export const useCallStore = create((set, get) => ({
  peerConnection: null,
  localStream: null,
  remoteStream: null,
  inCall: false,
  callType: null,
  incomingCall: null,
  isReceivingCall: false,
  isMuted: false,
  isVideoEnabled: true,
  currentCallId: null, // Track the current call ID for better call management
  isCallConnected: false, // Track if the call has been accepted and connected

   startCall: async (receiverId, type = "video") => {
    const {socket, authUser} = useAuthStore.getState();
    if(!socket) {
      toast.error("Socket not connected");
      console.error("Cannot start call: Socket not connected");
      return;
    }
    
    if(!receiverId) {
      toast.error("Invalid receiver");
      console.error("Cannot start call: Invalid receiver ID");
      return;
    }
    
    console.log(`Starting ${type} call to ${receiverId}`);
    
    try {
      // Close any existing call first
      const existingCall = get().peerConnection;
      if (existingCall) {
        console.log("Closing existing call before starting new one");
        existingCall.close();
      }
      
      // Create the peer connection with proper ICE servers
      const peer = new RTCPeerConnection({
        iceServers: [
          {urls: "stun:stun.l.google.com:19302"},
          {urls: "stun:stun1.l.google.com:19302"},
          {urls: "stun:stun2.l.google.com:19302"},
        ],
      });
      
      set({peerConnection: peer, callType: type, currentCallId: receiverId});
      
      // Log connection state changes
      peer.oniceconnectionstatechange = () => {
        console.log(`ICE connection state: ${peer.iceConnectionState}`);
      };

      // Handle the local media 
      console.log(`Requesting ${type} media`);
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video"  
      });
      
      console.log("Local stream obtained:", localStream.getTracks().map(t => t.kind).join(", "));

      // Add local tracks to peer connection 
      localStream.getTracks().forEach(track => {
        console.log(`Adding ${track.kind} track to peer connection`);
        peer.addTrack(track, localStream);
      });
      
      set({ localStream });

      // Prepare the remote stream
      const remoteStream = new MediaStream();
      
      // This is critical - we need to make sure we set up the ontrack handler
      // BEFORE setting the remote description
      peer.ontrack = event => {
        console.log("CALLER: Remote track received:", event.track.kind);
        console.log("CALLER: Track readyState:", event.track.readyState);
        
        // Use the streams provided by the event rather than creating new ones
        // The event.streams array contains the MediaStreams this track belongs to
        if (event.streams && event.streams[0]) {
          console.log(`CALLER: Using provided stream with ${event.streams[0].getTracks().length} tracks`);
          set({ remoteStream: event.streams[0] });
          
          // Setup stream change monitoring
          const currentStream = event.streams[0];
          currentStream.onaddtrack = () => {
            console.log(`CALLER: Track added to stream, now has ${currentStream.getTracks().length} tracks`);
            set({ remoteStream: currentStream });
          };
          
          currentStream.onremovetrack = () => {
            console.log(`CALLER: Track removed from stream, now has ${currentStream.getTracks().length} tracks`);
            set({ remoteStream: currentStream });
          };
        } else {
          // Fallback to manual track handling if no stream in event
          console.log("CALLER: No stream in event, adding track manually");
          if (!remoteStream.getTracks().some(t => t.id === event.track.id)) {
            console.log(`CALLER: Adding track ${event.track.id} (${event.track.kind}) to remoteStream`);
            remoteStream.addTrack(event.track);
          }
          
          // Always update the store with the current remoteStream
          console.log(`CALLER: Setting remoteStream with ${remoteStream.getTracks().length} tracks`);
          set({ remoteStream: remoteStream });
        }
        
        // Handle track starting to flow after initial connection
        event.track.onunmute = () => {
          console.log(`CALLER: Track ${event.track.kind} unmuted`);
          // Ensure the UI updates when tracks become active
          set(state => ({ remoteStream: state.remoteStream }));
        };
      };

      // Handle ICE candidates
      peer.onicecandidate = event => {
        if(event.candidate) {
          console.log("Sending ICE candidate to", receiverId);
          socket.emit("ice-candidate", {
            to: receiverId,
            candidate: event.candidate,
          });
        }
      };
      
      // Handle the connection state change
      peer.onconnectionstatechange = () => {
        console.log(`Connection state changed to: ${peer.connectionState}`);
        if(["disconnected", "failed", "closed"].includes(peer.connectionState)) {
          console.log("Connection state triggering call end");
          get().endCall();
        }
      };
      
      // Create an offer and send via socket (signaling)
      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === "video"
      });
      console.log("Created offer:", offer.type);
      
      await peer.setLocalDescription(offer);
      console.log("Set local description, sending call-user event");
      
      socket.emit("call-user", { to: receiverId, offer, type });
      
      // Listen for call status updates
      socket.once("call-status", (data) => {
        console.log("Call status:", data);
        if (data.status === "failed") {
          toast.error(data.message || "Call failed");
          get().endCall();
        } else if (data.status === "ringing") {
          toast.success("Calling...");
        }
      });
      
      // We're initiating a call, but it's not connected yet
      set({ 
        inCall: true,
        isCallConnected: false 
      });
    }
    catch (error) {
      toast.error("Error starting call: " + error.message);
      console.error("Error starting call:", error);
      // Clean up on error
      get().endCall();
    }
  },
  
  receiveCall: ({ from, offer, type }) => {
    set({
      incomingCall: { from, offer, type },
      isReceivingCall: true,
      callType: type,
    });
    // UI side will show a "incoming call" modal with accept/decline options
  },

  // ===========================================
  // Function to answer the call
  // ===========================================
  answerCall: async () => {
    const { socket, authUser } = useAuthStore.getState();
    const {incomingCall} = get();
    
    if(!socket) {
      console.error("Cannot answer call: Socket not connected");
      toast.error("Cannot connect to chat server");
      return;
    }
    
    if(!incomingCall) {
      console.error("Cannot answer call: No incoming call data");
      toast.error("Call information missing");
      return;
    }
    
    console.log(`Answering call from ${incomingCall.from} (${incomingCall.type})`);

    try {
      // Create the peer connection with proper ICE servers
      const peer = new RTCPeerConnection({
        iceServers: [
          {urls: "stun:stun.l.google.com:19302"},
          {urls: "stun:stun1.l.google.com:19302"},
          {urls: "stun:stun2.l.google.com:19302"},
        ],
      });
      
      console.log("Created peer connection for answering call");
      set({peerConnection: peer, currentCallId: incomingCall.from});
      
      // Log connection state changes
      peer.oniceconnectionstatechange = () => {
        console.log(`ICE connection state: ${peer.iceConnectionState}`);
      };
      
      // Capture the local media
      console.log(`Requesting ${incomingCall.type === "video" ? "video" : "audio"} media`);
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.type === "video"
      });
      
      console.log("Local stream obtained:", localStream.getTracks().map(t => t.kind).join(", "));
      localStream.getTracks().forEach(track => {
        console.log(`Adding ${track.kind} track to peer connection`);
        peer.addTrack(track, localStream);
      });
      set({localStream});


      // Prepare the remote stream 
      const remoteStream = new MediaStream();
      
      // This is critical - we need to make sure we set up the ontrack handler
      // BEFORE setting the remote description
      peer.ontrack = event => {
        console.log("RECEIVER: Remote track received:", event.track.kind);
        console.log("RECEIVER: Track readyState:", event.track.readyState);
        
        // Use the streams provided by the event rather than creating new ones
        // The event.streams array contains the MediaStreams this track belongs to
        if (event.streams && event.streams[0]) {
          console.log(`RECEIVER: Using provided stream with ${event.streams[0].getTracks().length} tracks`);
          set({ remoteStream: event.streams[0] });
          
          // Setup stream change monitoring
          const currentStream = event.streams[0];
          currentStream.onaddtrack = () => {
            console.log(`RECEIVER: Track added to stream, now has ${currentStream.getTracks().length} tracks`);
            set({ remoteStream: currentStream });
          };
          
          currentStream.onremovetrack = () => {
            console.log(`RECEIVER: Track removed from stream, now has ${currentStream.getTracks().length} tracks`);
            set({ remoteStream: currentStream });
          };
        } else {
          // Fallback to manual track handling if no stream in event
          console.log("RECEIVER: No stream in event, adding track manually");
          if (!remoteStream.getTracks().some(t => t.id === event.track.id)) {
            console.log(`RECEIVER: Adding track ${event.track.id} (${event.track.kind}) to remoteStream`);
            remoteStream.addTrack(event.track);
          }
          
          // Always update the store with the current remoteStream
          console.log(`RECEIVER: Setting remoteStream with ${remoteStream.getTracks().length} tracks`);
          set({ remoteStream: remoteStream });
        }
        
        // Handle track starting to flow after initial connection
        event.track.onunmute = () => {
          console.log(`RECEIVER: Track ${event.track.kind} unmuted`);
          // Ensure the UI updates when tracks become active
          set(state => ({ remoteStream: state.remoteStream }));
        };
      };

      // ICE handling 
      peer.onicecandidate = event => {
        if(event.candidate) {
          console.log("Sending ICE candidate to caller:", incomingCall.from);
          socket.emit("ice-candidate", {
            to: incomingCall.from,
            candidate: event.candidate,
          });
        }
      };

      // Set caller's offer as remote description
      console.log("Setting remote description from offer");
      await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

      // Create an answer and send it to the caller
      console.log("Creating answer");
      const answer = await peer.createAnswer();
      console.log("Setting local description");
      await peer.setLocalDescription(answer);
      
      console.log("Sending answer to caller:", incomingCall.from);
      socket.emit("answer-call", { to: incomingCall.from, answer });

      // Update state
      console.log("Call answered successfully, updating state");
      set({
        inCall: true,
        isCallConnected: true,
        isReceivingCall: false,
        incomingCall: null
      });
    } catch (error) {
      toast.error("Error answering call: " + error.message);
      console.error("Error answering call:", error);
      // Clean up on error
      get().endCall();
    }
  },

  // ===========================================
  //   reject the call
  // ===========================================
  rejectCall: () => {
    const { socket } = useAuthStore.getState();
    const { incomingCall } = get();
    
    if (socket && incomingCall) {
      console.log(`Rejecting call from ${incomingCall.from}`);
      socket.emit("reject-call", { to: incomingCall.from });
    } else {
      console.warn("Cannot reject call: Missing socket connection or incoming call data");
    }
    
    // reset call state
    set({
      incomingCall: null,
      isReceivingCall: false,
      callType: null,
    });
  },

  // Function for ending the call
  // sendNotification: true = send event to server, false = just cleanup locally
  endCall: (sendNotification = true) => {
    const {socket} = useAuthStore.getState();
    const {peerConnection, localStream, remoteStream, inCall, incomingCall, currentCallId} = get();
    
    // Determine the recipient ID from any available source
    const receiverId = currentCallId || incomingCall?.from;
    
    // Notify the other user if we're in a call, have socket connection, and need to notify
    if (socket?.connected && sendNotification) {
      if (receiverId) {
        console.log(`Ending call with specific user ${receiverId}`);
        socket.emit("end-call", { to: receiverId });
      } else {
        // Don't broadcast to everyone, just cleanup locally
        console.log("Call ended locally (no recipient specified)");
      }
    } else if (!sendNotification) {
      console.log("Ending call locally without notification (already notified)");
    } else {
      console.warn("Cannot send end-call event: Socket not connected");
    }

    // Stop all media tracks properly
    if (localStream) {
      console.log("Stopping local media tracks");
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped local ${track.kind} track`);
      });
    }
    
    // Don't stop remote tracks, just remove references to them
    // Remote tracks are controlled by the remote peer
    
    // Close connection
    if (peerConnection) {
      console.log("Closing peer connection");
      peerConnection.close();
    }

    // Reset store completely
    set({
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      inCall: false,
      callType: null,
      incomingCall: null,
      isReceivingCall: false,
      isMuted: false,
      isVideoEnabled: true,
      currentCallId: null,
      isCallConnected: false
    });
  },

  // writing the function for the toggleing the mic 
  toggleMic: () => {
    const {localStream, isMuted}=get();
    if (localStream) {
      console.log("Toggling microphone:", isMuted ? "unmuting" : "muting");
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        console.log(`Audio track ${track.id} enabled: ${track.enabled}`);
      });
      set({isMuted: !isMuted});
    } else {
      console.warn("Cannot toggle mic: No local stream available");
    }
  },

  // Function to set call connected state explicitly
  setCallConnected: (isConnected) => {
    set({ isCallConnected: isConnected });
    console.log(`Call connection status set to: ${isConnected}`);
  },

  // Function for toggling the video
  toggleVideo: () => {
    const {localStream, isVideoEnabled}=get();  
    if (localStream) {
      console.log("Toggling video:", isVideoEnabled ? "disabling" : "enabling");
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
        console.log(`Video track ${track.id} enabled: ${!isVideoEnabled}`);
      });
      set({isVideoEnabled: !isVideoEnabled});
    } else {
      console.warn("Cannot toggle video: No local stream available");
    }
  },
  
  // Function to toggle speaker output (system default vs specified device)
  toggleSpeaker: async (mediaElement) => {
    console.log("Toggling speaker output", mediaElement);
    try {
      // Check browser support for audio output selection
      if (!('AudioContext' in window) || !('setSinkId' in HTMLMediaElement.prototype)) {
        console.warn("Audio output device selection not supported by this browser");
        toast.error("Your browser doesn't support speaker selection");
        return false;
      }
      
      // Check if the media element is valid
      if (!mediaElement) {
        console.error("No valid media element provided");
        toast.error("Cannot change speaker - no audio element");
        return false;
      }
      
      console.log("Requesting media devices permissions");
      
      // Request permissions first to ensure we can access devices
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get available audio output devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("Available devices:", devices);
      
      const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');
      console.log("Audio output devices:", audioOutputDevices);
      
      if (audioOutputDevices.length === 0) {
        console.warn("No audio output devices found");
        toast.info("No speakers available");
        return false;
      }
      
      // If only one device is available, toggle volume instead
      if (audioOutputDevices.length === 1) {
        console.log("Only one audio output device, toggling volume instead");
        
        // Toggle between 100% and 60% volume as a fallback
        const newVolume = mediaElement.volume > 0.7 ? 0.6 : 1.0;
        mediaElement.volume = newVolume;
        
        toast.success(`Volume: ${Math.round(newVolume * 100)}%`);
        return true;
      }
      
      // Get current device ID
      let currentSinkId = '';
      try {
        currentSinkId = mediaElement.sinkId || '';
        console.log("Current sink ID:", currentSinkId);
      } catch (e) {
        console.warn("Could not get current sink ID:", e);
      }
      
      // Find next device in the list
      let nextDevice;
      const currentIndex = audioOutputDevices.findIndex(d => d.deviceId === currentSinkId);
      console.log("Current device index:", currentIndex);
      
      if (currentIndex === -1 || currentIndex === audioOutputDevices.length - 1) {
        nextDevice = audioOutputDevices[0]; // First device or default
      } else {
        nextDevice = audioOutputDevices[currentIndex + 1]; // Next device
      }
      
      console.log("Selected next device:", nextDevice);
      
      // Set the audio output to the next device
      try {
        await mediaElement.setSinkId(nextDevice.deviceId);
        console.log(`Audio output changed to: ${nextDevice.label || 'Unknown Device'}`);
        toast.success(`Speaker: ${nextDevice.label.split(' ').slice(0, 2).join(' ') || 'Default'}`);
        return true;
      } catch (sinkErr) {
        console.error("Error setting sink ID:", sinkErr);
        
        // Fallback - try with permissions prompt
        if (sinkErr.name === 'NotAllowedError') {
          toast.error("Permission needed for speaker access");
          
          // Some browsers need user gesture to allow speaker selection
          const confirmChange = window.confirm("Allow changing audio output device?");
          if (confirmChange) {
            try {
              await mediaElement.setSinkId(nextDevice.deviceId);
              toast.success(`Speaker: ${nextDevice.label || 'Default'}`);
              return true;
            } catch (finalErr) {
              console.error("Final attempt to set sink ID failed:", finalErr);
              toast.error("Could not change speaker");
            }
          }
        } else {
          toast.error("Speaker change not supported");
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error toggling speaker:", error);
      
      // Special handling for permission errors
      if (error.name === 'NotAllowedError') {
        toast.error("Permission denied to access audio devices");
      } else if (error.name === 'NotFoundError') {
        toast.error("No speaker devices found");
      } else {
        toast.error("Failed to change speaker");
      }
      
      return false;
    }
  },

    // ===================================================
  // 🌐 🔁 HANDLE ANSWER / ICE CANDIDATE (from socket)
  // ===================================================

  handleAnswer: async (answer) => {
    const {peerConnection}=get();
    if (!peerConnection) {
      console.error("Cannot handle answer: No peer connection");
      return;
    }
    
    console.log("Received answer, setting remote description");
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log("Remote description set successfully");
      
      // Mark call as connected since the other person answered
      set({ isCallConnected: true });
      console.log("Call marked as connected after receiving answer");
    } catch (error) {
      console.error("Error setting remote description:", error);
    }
  },

  handleIceCandidate: async (candidate) => {
    const {peerConnection}=get();
    if (!peerConnection) {
      console.error("Cannot handle ICE candidate: No peer connection");
      return;
    }
    
    if (!candidate) {
      console.warn("Received empty ICE candidate");
      return;
    }
    
    console.log("Received ICE candidate");
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("ICE candidate added successfully");
    }
    catch (error) {
      console.error("Error adding received ICE candidate:", error);
    } 
  }
}));

  