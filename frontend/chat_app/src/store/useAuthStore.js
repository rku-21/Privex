import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { io } from "socket.io-client";
import toast from 'react-hot-toast';
import { useChatStore } from './useChatStore';
import { useCallStore } from './useCallStore';
import { UserStar } from 'lucide-react';


const params = new URLSearchParams(window.location.search);
const serverPort = params.get("server");

const BASE_URL =
  import.meta.env.MODE === "development"
    ? `http://localhost:${serverPort || 5001}`
    : "/";

const normalizeTyperUserId = (payload) => {
  if (!payload) return null;
  if (typeof payload === "string") return payload;
  if (typeof payload === "object") {
    return payload.typerUserId || payload.userId || payload._id || null;
  }
  return null;
};

const callEventDedup = {
  rejected: {
    lastCallId: null,
    lastAt: 0,
  },
};


export const useAuthStore = create((set, get) => ({

  authUser: null,
  isSigningUp: false,
  isRequestingSignup:false,
  isLoginingUp: false,
  isUpdateingProfileUP: false,
  isCheckingAuth: true,
  socket: null,
  onlineUsers: [],
  UserStatus:{},


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
  requestSignup:async(signupData)=>{
    set({isRequestingSignup:true});
    try{
      const res = await axiosInstance.post('/auth/request-signup', signupData);
      return res;
    }catch(error){
      toast.error("signup request fails");
    }
    finally{
      set({isRequestingSignup:false});
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
      const { socket } = get();
      
      // Call logout API first
      await axiosInstance.post("/auth/logout");
      
      // Disconnect socket gracefully
      if (socket?.connected) {
        console.log("Disconnecting socket...");
        socket.disconnect();
        // Give server time to process disconnect
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Clear auth state
      set({ authUser: null, socket: null, onlineUsers: [] });
      toast.success("Logged out successfully");
      
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },





  // connecting the user to the socket once he connected 
  connectSocket: () => {
    const { authUser, socket } = get();

    // not authenticated user 
    if (!authUser || !authUser._id) {
       return;
    }
    // check wheater the socket is connected or not its return true or false
    if (socket?.connected) {
      return;
    }

    console.log(`Connecting socket for user ${authUser._id}`);

    const newSocket = io(BASE_URL, {
      query: { userId: authUser._id },
      reconnection: true,
      transports: ['websocket'],
      withCredentials: true,
      secure: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // connect is a built-in event from Socket.IO that fires when the client successfully connects to the server.
    newSocket.on("connect", () => {
      console.log(`Socket connected with ID: ${newSocket.id}`);

      newSocket.emit("user-online",authUser._id);
    });

    

    
    // also a client side event fired when the connection is failed
    newSocket.on("connect_error", (error) => {
        toast.error("Chat server connection error");
    });

    // clean up the old socket of the user 
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
     // set with new socket 
    set({ socket: newSocket });
    
    // always listen for the online users and update it 
    newSocket.on("getOnlineUsers", (userIds) => {
        console.log(`📊 Updated online users: ${JSON.stringify(userIds)}`);
        set({ onlineUsers: userIds });
    });
    
      newSocket.on("typing", (payload) => {
        const typerUserId = normalizeTyperUserId(payload);
        if (!typerUserId) return;
        set((state) => ({
          UserStatus: {
            ...state.UserStatus,
            [typerUserId]: "typing",
          }
        }));
      });
    newSocket.on("stopTyping", (payload) => {
      const typerUserId = normalizeTyperUserId(payload);
      if (!typerUserId) return;
      set((state)=>({
        UserStatus:{
          ...state.UserStatus,
          [typerUserId]:"online",
        }
      }))
      
    })

    newSocket.on("call-rejected", (payload = {}) => {
      const callStore = useCallStore.getState();
      const callId = payload?.callId || null;
      const now = Date.now();

      const isDuplicate =
        !!callId &&
        callEventDedup.rejected.lastCallId === callId &&
        now - callEventDedup.rejected.lastAt < 5000;

      if (isDuplicate) {
        return;
      }

      callEventDedup.rejected.lastCallId = callId;
      callEventDedup.rejected.lastAt = now;

      if (!callStore.isInitiating && !callStore.incall) {
        return;
      }

      toast.error("Your call was rejected");
      callStore.handleCallEnded();
    });


    newSocket.on("call-initiated", (data) => {
      const callStore = useCallStore.getState();
      callStore.setCurrentCallId(data.callId);

      const pendingIce = callStore.pendingIce || [];
      if (pendingIce.length > 0) {
        pendingIce.forEach((candidate) => {
          newSocket.emit("ice-candidate", {
            callId: data.callId,
            candidate,
          });
        });
        callStore.setPendingIce([]);
      }
    });


    newSocket.on("incoming-call", (data) => {
      const callStore = useCallStore.getState();
      callStore.handleIncomingCall(data);



    });



    newSocket.on("call-timeout", (data) => {
      const callStore = useCallStore.getState();
      callStore.stopRingtone();
      callStore.handleCallEnded("timeout");
    });


    newSocket.on("call-accepted", (data) => {
      const { peerConnection, currentCallId } = useCallStore.getState();

      if (!peerConnection) {
        return;
      }

      if (!data || !data.answer) {
        return;
      }


      if (data.callId && currentCallId && data.callId !== currentCallId) {
        console.warn("CallId mismatch");
      }
      peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
        .then(() => {
          useCallStore.getState().callerSideStateWhenAccepted();
        })
        .catch(err => {
          toast.error("Connection error");
        });
    });


    newSocket.on("ice-candidate", (data) => {
      const { peerConnection, currentCallId } = useCallStore.getState();

      if (!peerConnection) {
        return;
      }

      if (!data || !data.candidate) {
        return;
      }


      if (data.callId && currentCallId && data.callId !== currentCallId) {
        console.warn("CallId mismatch");
      }

      try {

        const candidate = new RTCIceCandidate(data.candidate);
        peerConnection.addIceCandidate(candidate)
          .then(() => console.log("ICE candidate added successfully"))
          .catch(err => console.error("Error adding ICE candidate", err));
      } catch (error) {
        console.error("Error creating ICE candidate", error);
      }
    });




    newSocket.on("call-ended", (data) => {
      toast.error("Call ended by other user");
      useCallStore.getState().handleCallEnded();
    });


    newSocket.on("call-cancelled", (data) => {
      toast.error("The caller has cancelled the call");
      useCallStore.getState().handleCallEnded();
    });


    newSocket.on("peer-disconnected", (data) => {
      const { currentCallId, isCallAccepted } = useCallStore.getState();
      if (isCallAccepted && data.callId && currentCallId === data.callId) {
        toast.error("Call ended - peer disconnected");
        useCallStore.getState().handleCallEnded();
      }
    });


  },
  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.removeAllListeners(); // use to remove all the listener to this socket 
      socket.disconnect(); // use to disconnect this socket
    }
    set({ socket: null, onlineUsers: [] });
  },
}));

