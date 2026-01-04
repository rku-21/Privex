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

  signup: async ({ fullname, email, phone, password }) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", { fullname, email, phone, password });
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

  // Set authenticated user after OTP verification
  setAuthUser: (user) => {
    set({ authUser: user });
    get().connectSocket();
  },

  updateProfile: async (data) => {
    set({ isUpdateingProfileUP: true });
    try {
      const res = await axiosInstance.put("auth/update-profile", data);
      set({ authUser: res.data });
     
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
      // Removed toast to prevent spam on reconnects
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
      console.log("📥 Received online users:", userIds);
      set({ onlineUsers: userIds });
    });



      // Handle call rejected
    newSocket.on("call-rejected", () => {
      console.log("Call was rejected by the callee");
      toast.error("Your call was rejected");
      // Clean up resources
      useCallStore.getState().endCall();
    });
    // Handle call events
    // 🆕 Handle call initiated confirmation (caller receives callId from server)
    newSocket.on("call-initiated", (data) => {
      console.log("✅ Call initiated, received callId from server:", data.callId);
      const callStore = useCallStore.getState();
      callStore.setCurrentCallId(data.callId);
      
      // 🔥 FLUSH PENDING ICE CANDIDATES
      const pendingIce = callStore.pendingIce || [];
      if (pendingIce.length > 0) {
        console.log(`✅ Flushing ${pendingIce.length} buffered ICE candidates`);
        pendingIce.forEach(candidate => {
          newSocket.emit("ice-candidate", {
            callId: data.callId,
            candidate: candidate
          });
        });
        callStore.setPendingIce([]);
      }
      
      console.log("✅ currentCallId set, ICE candidates can now be sent");
    });

    // Handle incoming call events
    newSocket.on("incoming-call", (data) => {
      console.log("🆕 Incoming call received with callId:", data.callId);
      // Use the proper store action to update call state
      const callStore = useCallStore.getState();
      callStore.handleIncomingCall(data);
      
      
     
    });
    

    // Handle call timeout
    newSocket.on("call-timeout", (data) => {
      console.log("🆕 [CLIENT] Received call-timeout event for callId:", data.callId);
      const callStore = useCallStore.getState();

      // Stop any ringing sound
      callStore.stopRingtone();
      
      // 🔴 FIX: Use CallStore's handleCallEnded, not AuthStore's set()
      callStore.handleCallEnded("timeout");
      
      console.log("[CLIENT] Call state completely reset after timeout");
    });

    // Handle call accepted
    newSocket.on("call-accepted", (data) => {
      console.log("🆕 Call accepted for callId:", data.callId);
      
      // Get the current peer connection
      const { peerConnection, currentCallId } = useCallStore.getState();
      
      if (!peerConnection) {
        console.error("Received call-accepted but no peer connection exists");
        return;
      }
      
      if (!data || !data.answer) {
        console.error("Received call-accepted but no answer data");
        return;
      }
      
      // Verify callId matches (optional but recommended)
      if (data.callId && currentCallId && data.callId !== currentCallId) {
        console.warn("CallId mismatch! Expected:", currentCallId, "Got:", data.callId);
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
      console.log("🆕 ICE candidate received for callId:", data.callId);
      const { peerConnection, currentCallId } = useCallStore.getState();
      
      if (!peerConnection) {
        console.error("Received ICE candidate but no peer connection exists");
        return;
      }
      
      if (!data || !data.candidate) {
        console.error("Invalid ICE candidate data received");
        return;
      }
      
      // Verify callId matches (optional but recommended)
      if (data.callId && currentCallId && data.callId !== currentCallId) {
        console.warn("CallId mismatch in ICE! Expected:", currentCallId, "Got:", data.callId);
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
    newSocket.on("call-ended", (data) => {
      console.log("🆕 Call ended for callId:", data.callId);
      toast.error("Call ended by other user");
      
      // Use our dedicated handler to reset call state
      useCallStore.getState().handleCallEnded();
    });

    // Handle caller cancelling the call before being answered
    newSocket.on("call-cancelled", (data) => {
      console.log("🆕 Call cancelled for callId:", data.callId);
      toast.error("The caller has cancelled the call");
      // Use our dedicated handler to reset call state
      useCallStore.getState().handleCallEnded();
    });
    
    // Handle peer disconnection (network issues, browser closed, etc.)
    newSocket.on("peer-disconnected", (data) => {
      console.log("🆕 Peer disconnected. UserId:", data.userId, "CallId:", data.callId);
      
      // Check if we're in a call with this user
      const { currentCallId, isCallAccepted } = useCallStore.getState();
      if (isCallAccepted && data.callId && currentCallId === data.callId) {
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

