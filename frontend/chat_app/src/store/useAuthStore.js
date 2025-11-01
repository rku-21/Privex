import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { io } from "socket.io-client";
import toast from 'react-hot-toast';
import { useChatStore } from './useChatStore';
import { useCallStore } from './useCallStore';


const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({

  authUser: null,
  isSigningUp: false,
  isLoginingUp: false,
  isUpdateingProfileUP: false,
  isCheckingAuth: true,
  socket: null,
  onlineUsers: [],

  // ----------------- AUTH -----------------
  checkAuth: async () => {
    try {
      set({ isCheckingAuth: true });
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async ({ fullname, email, password }) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", { fullname, email, password });
      set({ authUser: res.data });
      toast.success("Account Created Successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoginingUp: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in Successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoginingUp: false });
    }
  },

  updateProfile: async (data) => {
    set({ isUpdateingProfileUP: true });
    try {
      const res = await axiosInstance.put("auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      set({ isUpdateingProfileUP: false });
    }
  },

  profile: async () => {
    try {
      const res = await axiosInstance.get("auth/check");
      set({ authUser: res.data });
      return res.data;
    } catch (error) {
      toast.error("Something went wrong");
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },

  // ----------------- SOCKET -----------------
  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser || !authUser._id) {
      console.log("Cannot connect socket: No authenticated user");
      return;
    }
    
    if (socket?.connected) {
      console.log("Socket already connected, reusing existing connection");
      return;
    }

    console.log(`Connecting socket for user ${authUser._id}`);
    
    const newSocket = io(BASE_URL, {
      query: { userId: authUser._id },
      reconnection: true,
      transports: ['websocket'],
      withCredentials: true,
      secure:true,

      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // Handle connection events
    newSocket.on("connect", () => {
      console.log(`Socket connected with ID: ${newSocket.id}`);
      toast.success("Connected to chat server");
    });
    
    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast.error("Chat server connection error");
    });
    
    // Make sure old listeners are removed
    if (socket) {
      console.log("Cleaning up old socket connection");
      socket.removeAllListeners();
      socket.disconnect();
    }

    // Save socket
    set({ socket: newSocket });

    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });



      // Handle call rejected
    // Handle call rejection
    newSocket.on("call-rejected", () => {
      console.log("Call was rejected by the callee");
      toast.error("Your call was rejected");
      // Clean up resources
      useCallStore.getState().endCall();
    });

    // Also handle the reject-call event (for backward compatibility)
    newSocket.on("reject-call", () => {
      console.log("Call was rejected by the callee (via reject-call event)");
      toast.error("Your call was rejected");
      // Clean up resources
      useCallStore.getState().endCall();
    });
    
    // Log all socket events for debugging
    newSocket.onAny((event, ...args) => {
      console.log(`[Socket Event] ${event}:`, args);
    });


    // Handle call events
    // Handle incoming call events
    newSocket.on("incoming-call", (data) => {
      console.log("Incoming call received:", data);
      // Use the proper store action to update call state
      const callStore = useCallStore.getState();
      callStore.handleIncomingCall(data);
      
      // Simple notification that a call is incoming
      toast.success("Incoming call received", {
        id: "incoming-call",
        duration: 3000
      });
    });
    

    // Handle call timeout
    newSocket.on("call-timeout", (data) => {
      console.log("[CALLEE] Received call-timeout event:", data);
      const callStore = useCallStore.getState();

      // First stop any ringing sound
      callStore.stopRingtone();

      // Force immediate state reset for UI
      callStore.set({
        peerConnection: null,
        localStream: null,
        remoteStream: null,
        incall: false,
        callType: null,
        isReceivingCall: false,
        incomingCall: null,
        isInitiating: false,
        isCallAccepted: false,
        onCallWithWhom: null  // Explicitly set to null
      });
      
      // Show notification to user
      toast.error("Call timed out", { 
        id: 'call-timeout',
        duration: 3000
      });
      
      console.log("[CALLEE] Call state completely reset, onCallWithWhom cleared");
    });

    // Handle call accepted
    newSocket.on("call-accepted", (data) => {
      console.log("Call accepted by callee:", data);
      
      // Get the current peer connection
      const { peerConnection } = useCallStore.getState();
      
      if (!peerConnection) {
        console.error("Received call-accepted but no peer connection exists");
        return;
      }
      
      if (!data || !data.answer) {
        console.error("Received call-accepted but no answer data");
        return;
      }
      
      console.log("Setting remote description with answer");
      peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
        .then(() => {
          console.log("Remote description set successfully on caller side");
          // Update call store to reflect that call is accepted
          useCallStore.getState().callerSideStateWhenAccepted();
        })
        .catch(err => {
          console.error("Error setting remote description on caller side:", err);
          toast.error("Connection error");
        });
    });

    // Handle ICE candidates
    newSocket.on("ice-candidate", (data) => {
      console.log("ICE candidate received:", data.candidate);
      const { peerConnection } = useCallStore.getState();
      
      if (!peerConnection) {
        console.error("Received ICE candidate but no peer connection exists");
        return;
      }
      
      if (!data || !data.candidate) {
        console.error("Invalid ICE candidate data received");
        return;
      }
      
      try {
        // Create RTCIceCandidate from the received data
        const candidate = new RTCIceCandidate(data.candidate);
        console.log(`Adding ICE candidate [type: ${candidate.type}, protocol: ${candidate.protocol}]`);
        
        peerConnection.addIceCandidate(candidate)
          .then(() => console.log("ICE candidate added successfully"))
          .catch(err => console.error("Error adding ICE candidate:", err));
      } catch (error) {
        console.error("Error creating ICE candidate:", error);
      }
    });

   
    
    // Handle call ended event
    newSocket.on("call-ended", () => {
      console.log("Call ended by remote peer");
      toast.error("Call ended by other user");
      
      // Use our dedicated handler to reset call state
      useCallStore.getState().handleCallEnded();
    });

    // Handle caller cancelling the call before being answered
    newSocket.on("call-cancelled", () => {
      console.log("Call was cancelled by the caller before being answered");
      toast.error("The caller has cancelled the call");
      // Use our dedicated handler to reset call state
      useCallStore.getState().handleCallEnded();
    });
    
    // Handle peer disconnection (network issues, browser closed, etc.)
    newSocket.on("peer-disconnected", (data) => {
      console.log("Peer disconnected:", data.userId);
      
      // Check if we're in a call with this user
      const { selectedUser, isCallAccepted } = useCallStore.getState();
      if (isCallAccepted && selectedUser && selectedUser._id === data.userId) {
        toast.error("Call ended - peer disconnected");
        useCallStore.getState().handleCallEnded();
      }
    });

    // We've moved this handler earlier in the code
  },











  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.removeAllListeners();
      socket.disconnect();
    }
    set({ socket: null, onlineUsers: [] });
  },
}));

