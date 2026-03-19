import {create} from "zustand"
import toast from "react-hot-toast"
import { axiosInstance } from "../lib/axios"
import {useAuthStore} from "./useAuthStore"
import { useQueryPagination } from "./useQueryPagination"

const appendUniqueMessage = (messages, newMessage) => {
  if (messages.some((message) => message._id === newMessage._id)) {
    return messages;
  }
  return [...messages, newMessage];
};
export const useChatStore=create((set,get)=>({
    friends:[],
    friendRequests: {
      sent: [],
      received: [],
    },
    unreadCounts: {},  
    ackedMessageIds: {},
    selectedUser:null,
    isUsersLoding:false,
    isMessagesLoding:false,
    Users:[],
    searchResults: [],


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
    //send the friend request to user 
    SendingFriendRequest:async(Id)=>{
      try {
      const res=await axiosInstance.post(`/friends/send/${Id}`);
       return res.data;
      }
      catch(error){
        throw error;
      }
    },

    // remove the user request 
    removingFriendRequest:async(Id)=>{
      try{
        const res=await axiosInstance.delete(`/friends/cancel/${Id}`);
        
      }
      catch(error){
        toast.error(error.response?.data?.message || "Failed to cancel request");
      }
    },

    // remove the user from the friend 
     removeFriend: async(Id) => {
      try {
        const res = await axiosInstance.delete(`/friends/remove/${Id}`);
        toast.success("Friend removed successfully");
        return res.data;
      }
      catch(error) {
        toast.error(error.response?.data?.message || "Failed to remove friend");
        throw error;
      }
    },

    // Accept the friend request of user 
    AcceptsTheRequests:async(Id)=>{
      try {
        const res=await axiosInstance.post(`/friends/accept/${Id}`);
      }
      catch(error){

        toast.error(error.message)
      }

    },


   // send message to the user this is happening inside the chat-container
   sendMessages: async (messageData) => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;

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
        useQueryPagination.setState((state) => ({
          messages: [...state.messages, tempMessage],
        }));

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData,
        {
          headers: socket?.id ? { "x-socket-id": socket.id } : undefined,
        }
      );
      const ackId = String(res.data?._id || "");
      const isAlreadyAcked = !!get().ackedMessageIds[ackId];
      useQueryPagination.setState((state) => ({
        messages: state.messages.map((message) =>
          message._id === tempId
            ? { ...res.data, status: isAlreadyAcked ? "sent" : "sending" }
            : message
        ),
      }));
      if (isAlreadyAcked) {
        set((state) => {
          const nextAcked = { ...state.ackedMessageIds };
          delete nextAcked[ackId];
          return { ackedMessageIds: nextAcked };
        });
      }
    }
    catch(error){
      toast.error(error?.response?.data?.message );
      useQueryPagination.setState((state) => ({
        messages: state.messages.map((message) =>
          message._id === tempId ? { ...message, status: "failed" } : message
        ),
      }));
    }
  },


  // receiver subscribing to the message 
  SubscribeToMessages: () => {
   const socket = useAuthStore.getState().socket;
    if (!socket) {
        return;
    }
    socket.off("newMessage");
    socket.off("message-sent-Ack");

    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();
      const currentUserId = String(useAuthStore.getState().authUser?._id || "");

      if (!currentUserId) return;
      const [userId1, userId2] = (newMessage.chatId || "").split("_");
      const isMessageForMe = userId1 === currentUserId || userId2 === currentUserId;

      if (!isMessageForMe) {
         return;
      }

      const messageSenderId = String(newMessage.senderId);
      const isFromMe = messageSenderId === currentUserId;
      const selectedUserId = typeof selectedUser === "string" ? selectedUser : selectedUser?._id;
      const isCurrentChatOpen =
        !!selectedUserId &&
        [currentUserId, String(selectedUserId)].sort().join("_") === newMessage.chatId;

      if (isCurrentChatOpen) {
        useQueryPagination.setState((state) => ({
          messages: appendUniqueMessage(state.messages, newMessage),
        }));

        if (!isFromMe) {
          axiosInstance.post(`/messages/${messageSenderId}/read`)
            .catch(err => console.error("Error", err));
        }
        return;
      }

      if (!isFromMe) {
       set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [messageSenderId]: (state.unreadCounts?.[messageSenderId] || 0) + 1,
          },
        }));
      }
    });

    // listen for this message Ack and mark message as delivered-to-server (single tick)
    socket.on("message-sent-Ack",(message)=>{
      if (!message?._id) return;
      const ackId = String(message._id);
      set((state) => ({
        ackedMessageIds: {
          ...state.ackedMessageIds,
          [ackId]: true,
        },
      }));
      useQueryPagination.setState((state) => ({
        messages: state.messages.map((msg) =>
          String(msg._id) === ackId ? { ...msg, status: "sent" } : msg
        ),
      }));
    })



   socket.on("connect_error", (error) => {
   });
},

// when you are not chatting with the selectedUser 
      unsubscribeToMessages:()=>{
        const socket=useAuthStore.getState().socket;
        socket.off("newMessage");
        socket.off("message-sent-Ack");
     },
    setselectedUser: async (selectedUser)=>{ 
      set({selectedUser});

      if (selectedUser) {
        localStorage.setItem("chat-selected-user", JSON.stringify(selectedUser));
      } else {
        localStorage.removeItem("chat-selected-user");
        return;
      }

      const selectedUserId = typeof selectedUser === "string" ? selectedUser : selectedUser?._id;
      if (!selectedUserId) {
        return;
      }

      // when selecting a chat, mark all messages from that user as read and clear unread badge locally
      try {
         await axiosInstance.post(`/messages/${selectedUserId}/read`);
         set((state) => {
           const newCounts = { ...state.unreadCounts }; // make a copy 
           delete newCounts[selectedUserId];//delete unread of selecteduser and return !
           return { unreadCounts: newCounts };
         });
      }catch(error){
        toast.error(error.response?.data?.message || "Failed to mark messages as read");
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