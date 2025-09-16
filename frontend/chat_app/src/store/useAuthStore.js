import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { io } from "socket.io-client";
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.MODE ==="development"?"http://localhost:5001":"/";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoginingUp: false,
    isUpdateingProfileUP: false,
    isCheckingAuth:true,
    socket: null,
    onlineUsers: [],
    checkAuth: async () => {
        try {
            set({ isCheckingAuth:true});
            
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data });
            get().connectSocket();
        }
        catch (error) {

            set({ authUser: null });

        }
        finally {
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
        }
        catch (error) {
            toast.error(error.response.data.message);
        }
        finally {
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
        }
        catch (error) {
            toast.error(error.response.data.message);
        }
        finally {
            set({ isLoginingUp: false });
        }

    },
 
    
    updateProfile: async (data) => {
        set({ isUpdateingProfileUP: true });
        try {
            const res = await axiosInstance.put("auth/update-profile", data);
            set({ authUser: res.data });
            toast.success("profile updated successfully");
        }
        catch (error) {
            toast.error(error.response.data.message);
        }
        finally {
            set({ isUpdateingProfileUP: false });
        }

    },
profile: async () => {
        try {
            const res = await axiosInstance.get("auth/check");
            set({ authUser: res.data });
            return res.data;
        }
        catch (error) {

            toast.error("something went wrong");
        }
    },
    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            toast.success("Logged out successfully");
            get().disconnectSocket();
        }
        catch (error) {
            toast.error(error.response.data.message);
        }
    },

    connectSocket: () => {
        const {authUser}=get();
        if(!authUser || !authUser._id || get().socket?.connected) return;
        const socket = io(BASE_URL, {
            query: {
                userId:authUser._id,
            },
        });
        socket.connect();
        set({socket:socket});
        socket.on("getOnlineUsers", (userIds)=>{
            set({onlineUsers:userIds});
        });
    },
    disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
