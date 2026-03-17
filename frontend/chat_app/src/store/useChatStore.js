import {create} from "zustand"
import toast from "react-hot-toast"
import { axiosInstance } from "../lib/axios"
import {useAuthStore} from "./useAuthStore"
import { useQueryPagination } from "./useQueryPagination"
import { io } from "socket.io-client"
import { use } from "react"

const appendUniqueMessage = (messages, newMessage) => {
  if (messages.some((message) => message._id === newMessage._id)) {
    return messages;
  }
  return [...messages, newMessage];
};
export const useChatStore=create((set,get)=>({
    messages:[],
    friends:[],
    friendRequests: {
      sent: [],
      received: [],
    },
    unreadCounts: {},  
    selectedUser:null,
    isUsersLoding:false,
    isMessagesLoding:false,
    Users:[],
    searchResults: [],
    
    
    friendsPagination: {
      nextCursor: null,
      hasMore: false,
      isLoading: false,
    },
    messagesPagination: {
      nextCursor: null,
      hasMore: false,
      isLoading: false,
    },
    receivedRequestsPagination: {
      nextCursor: null,
      hasMore: false,
      isLoading: false,
    },
    sentRequestsPagination: {
      nextCursor: null,
      hasMore: false,
      isLoading: false,
    },
    searchPagination: {
      nextCursor: null,
      hasMore: false,
      isLoading: false,
      query: '',
    },

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
    SendingFriendRequest:async(Id)=>{
      try {
      const res=await axiosInstance.post(`/messages/friends/send/${Id}`);
       return res.data;
      }
      catch(error){
        throw error;
      }
    },
    removingFriendRequest:async(Id)=>{
      try{
        const res=await axiosInstance.delete(`/messages/friends/cancel/${Id}`);
        
      }
      catch(error){
        toast.error(error.response?.data?.message || "Failed to cancel request");
      }
    },

    
    removeFriend: async(Id) => {
      try {
        const res = await axiosInstance.delete(`/messages/friends/remove/${Id}`);
        toast.success("Friend removed successfully");
        return res.data;
      }
      catch(error) {
        toast.error(error.response?.data?.message || "Failed to remove friend");
        throw error;
      }
    },

    
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
    const socket=useAuthStore.getState().socket;
    
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
        useQueryPagination.setState((state) => ({
          messages: [...state.messages, tempMessage],
        }));
        
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === tempId ? res.data : message
        ),
      }));
      useQueryPagination.setState((state) => ({
        messages: state.messages.map((message) =>
          message._id === tempId ? res.data : message
        ),
      }));
    }
    catch(error){
      toast.error(error?.response?.data?.message );
      
      set({
        messages: get().messages.map(msg =>
          msg._id === tempId ? { ...msg, status: 'failed' } : msg
        ),
      });
      useQueryPagination.setState((state) => ({
        messages: state.messages.map((message) =>
          message._id === tempId ? { ...message, status: "failed" } : message
        ),
      }));
    } 
  },
  SubscribeToMessages: () => {
   const socket = useAuthStore.getState().socket;
    if (!socket) {
        return;
    }
    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();
      const currentUserId = useAuthStore.getState().authUser?._id;

      if(!currentUserId) return;
      const [userId1, userId2] = newMessage.chatId.split('_');
      const isMessageForMe = userId1 === currentUserId || userId2 === currentUserId;

      if (!isMessageForMe) {
         return;
      }

      
      const messageSenderId = newMessage.senderId;
      const isFromMe = messageSenderId === currentUserId;

      if (selectedUser && messageSenderId === selectedUser._id) {
        set((state) => ({
          messages: appendUniqueMessage(state.messages, newMessage),
        }));
        useQueryPagination.setState((state) => ({
          messages: appendUniqueMessage(state.messages, newMessage),
        }));
        
        axiosInstance.post(`/messages/${messageSenderId}/read`)
          .catch(err => console.error("Error", err));
      } 
      
      else if (!isFromMe) {
       set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [messageSenderId]: (state.unreadCounts?.[messageSenderId] || 0) + 1,
          },
        }));
      }
      
      else if (isFromMe && selectedUser) {
      
        set((state) => ({
          messages: appendUniqueMessage(state.messages, newMessage),
        }));
        useQueryPagination.setState((state) => ({
          messages: appendUniqueMessage(state.messages, newMessage),
        }));
      }
    });
   socket.on("connect_error", (error) => {
   });
},
 unsubscribeToMessages:()=>{
        const socket=useAuthStore.getState().socket;
        socket.off("newMessage");
     },
    setselectedUser:(selectedUser)=>{ 
      set({selectedUser});
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
        delete newCounts[senderId]; 
        return { unreadCounts: newCounts };
      });
    },


}));