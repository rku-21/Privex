import {create} from "zustand"
import toast from "react-hot-toast"
import { axiosInstance } from "../lib/axios"
import {useAuthStore} from "./useAuthStore"
import { io } from "socket.io-client"
import { use } from "react"
// Try to load selected user from localStorage
// const getInitialSelectedUser = () => {
//   try {
//     const storedUser = localStorage.getItem("chat-selected-user");
//     if (storedUser) {
//       return JSON.parse(storedUser);
//     }
//   } catch (error) {
//     console.error("Error parsing stored selected user:", error);
//     localStorage.removeItem("chat-selected-user");
//   }
//   return null;
// };

export const useChatStore=create((set,get)=>({
    messages:[],
    friends:[],
    friendRequests: {
      sent: [],
      received: [],
    },
    unreadCounts: {},  // Move unreadCounts to top level
    selectedUser:null,
    isUsersLoding:false,
    isMessagesLoding:false,
    Users:[],

    getAllUsers:async()=>{
      set({isUsersLoding:true});
      try {
        const res=await axiosInstance.get("/messages/users");
        set({Users:res.data});
      }
      catch(error){
        toast.error(error.response.data.message);
      }
      finally{
        set({isUsersLoding:false});
      }

    },
    getFriends:async()=>{
        set({isUsersLoding:true});
        try {
            const res=await axiosInstance.get("/messages/friends");
            set({friends:res.data});
        }
        catch(error){
            toast.error(error.response.data.message);
        }
        finally{
            set({isUsersLoding:false});
        }
    },

   getPendingRequests: async () => {
    try {
        const res = await axiosInstance.get("/messages/friends-requests");
       set(state => ({
        friendRequests: {
       ...state.friendRequests,
       received: res.data,
  },
}));
    } catch (error) {
        toast.error("Error fetching pending requests");
    }
  },
  getsendedRequests:async()=>{
    try{
      const res= await axiosInstance.get("/messages/friends-send");

    
      set(state=>({
        friendRequests:{
          ...state.friendRequests,
          sent:res.data,
        }
        
      }))
    }
    catch(error){
      toast.error(error.message);
    }
  },




    getMessages:async(userId)=>{
        set({isMessagesLoding:true});
        try{
            const res=await axiosInstance.get(`/messages/${userId}`);
            set({messages:res.data});
        }catch(error){
            toast.error(error.response.data.message);
        }finally{
            set({isMessagesLoding:false});
        }
    },
    SendingFriendRequest:async(Id)=>{
      try {
        const res=await axiosInstance.post(`/messages/friends/send/${Id}`);
      }
      catch(error){

        toast.error(error.message);
      }
    },
    removingFriendRequest:async(Id)=>{
      try{
        const res=await axiosInstance.delete(`/messages/friends/remove/request/${Id}`);
      }
      catch(error){

        toast.error(error.message);
      }
    },


    // function to accept the request
    AcceptsTheRequests:async(Id)=>{
      try {
        const res=await axiosInstance.post(`/messages/friends/accept/${Id}`);
      }
      catch(error){

        toast.error(error.message)
      }

    },




  sendMessages: async (messageData) => {
    const { selectedUser, messages } = get();
    //  make a temporary message object for optimistic UI
        const  tempId=Date.now().toString();
        const tempMessage={
          _id: tempId,
          senderId:useAuthStore.getState().authUser?._id,
          receiverId:selectedUser._id,
          text:messageData.text,
          image:messageData.image||null,
          status:"sending",
          createdAt: new Date().toISOString(),
        };
        set({messages:[...messages,tempMessage]});
        
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    }
    catch(error){
      toast.error(error?.response?.data?.message );
      // Update the temporary message status to 'failed'
      set({
        messages: get().messages.map(msg =>
          msg._id === tempId ? { ...msg, status: 'failed' } : msg
        ),
      });
    } 
  },
  SubscribeToMessages: () => {
    console.log("Subscribing to new messages via socket");
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // 🔄 Remove any previous "newMessage" listener to prevent duplicate firing
    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();
      const currentUserId = useAuthStore.getState().authUser?._id;
      console.log("New message received via socket:", newMessage);
      console.log("Current selected user:", selectedUser?.fullname, selectedUser?._id);

      // Check if this message is for the current user
      if (newMessage.receiverId !== currentUserId) {
        console.log("Message not for current user, ignoring");
        return;
      }

      // ✅ Case 1: Message is from currently selected user
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        console.log("Message is from selected user, adding to chat");
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
        // Mark as read since chat is open
        axiosInstance.post(`/messages/${newMessage.senderId}/read`)
          .catch(err => console.error("Error marking message as read:", err));
      } 
      // ✅ Case 2: Message from someone else - increment their unread count
      else {
        console.log("Message is from other user, incrementing unread count for:", newMessage.senderId);
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [newMessage.senderId]: (state.unreadCounts?.[newMessage.senderId] || 0) + 1,
          },
        }));
      }
    });

    // Handle errors
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
},


     unsubscribeToMessages:()=>{
        const socket=useAuthStore.getState().socket;
        socket.off("newMessage");
     },
    setselectedUser:(selectedUser)=>{ 
      set({selectedUser});
      // Save to localStorage if exists, otherwise remove
      if (selectedUser) {
        localStorage.setItem("chat-selected-user", JSON.stringify(selectedUser));
      } else {
        localStorage.removeItem("chat-selected-user");
      }
    },
    IncrementUnreadCount: (senderId) => {
      set((state) => ({
        unreadCounts: {
          ...state.unreadCounts,
          [senderId]: (state.unreadCounts?.[senderId] || 0) + 1,
        },
      }));
    },

    ResetUnreadCount: (senderId) => {
      set((state) => {
        const newCounts = { ...state.unreadCounts };
        delete newCounts[senderId]; // remove the key completely
        return { unreadCounts: newCounts };
      });
    },


}))