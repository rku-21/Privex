import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { io } from "socket.io-client";
import toast from 'react-hot-toast';
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

    // --- CALL EVENTS ---
    // We need to handle incoming call events at the auth store level
    // This ensures that calls are received even if the chat container isn't mounted
    newSocket.on("incoming-call", (data) => {
      console.log("[AUTH] Incoming call received:", data);
      
      // Notify the user about the incoming call
      toast.success(`Incoming ${data.type || 'video'} call`, { duration: 8000 });
      
      // Update call store state
      useCallStore.getState().receiveCall(data);
      
      // Dispatch custom event that can be caught by any mounted component
      const event = new CustomEvent('incomingCall', { detail: data });
      window.dispatchEvent(event);
    });
    
    // Log all socket events for debugging
    newSocket.onAny((event, ...args) => {
      console.log(`[Socket Event] ${event}:`, args);
    });
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

