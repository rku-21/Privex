// the best thing is always think in terms of the authUser and make state in keeping in mind that you are making the state for him alone ,, now what can be state ok 
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
    unreadCounts: {},  
    ackedMessageIds: {},
    selectedUser:null,
    isMessagesLoding:false,

    // send message to the user this is happening inside the chat-container
   sendMessages: async (messageData) => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

        const  tempId=Date.now().toString();
        // Calculate chatId same way as backend
        const chatId = [authUser._id.toString(), selectedUser._id].sort().join('_');
        
        const tempMessage={
          _id: tempId,
          senderId: authUser._id,
          receiverId:selectedUser._id,
          chatId: chatId,  // ✅ Add chatId to temp message
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
  // authUser subscribing to the messages 
  SubscribeToMessages: () => {
   const socket = useAuthStore.getState().socket;
    if (!socket) {
        return;
    }
    socket.off("newMessage");
    socket.off("message-sent-Ack");

    // listen for the new messages 
    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();

      //just for the safety wheater the user is online or not 
      const currentUserId = String(useAuthStore.getState().authUser?._id || "");
      if (!currentUserId) return;

      // is the currentUserid match any then user is involve in this message 
      const [userId1, userId2] = (newMessage.chatId || "").split("_");
      const isMessageForMe = userId1 === currentUserId || userId2 === currentUserId;
      
      // if the user is not involve in this message just return 
      if (!isMessageForMe) {
         return;
      }

      // get teh sendrId & check currentUser is sender ?? 
      const messageSenderId = String(newMessage.senderId);
      const isFromMe = messageSenderId === currentUserId;

      // get the selecteduserId
      const selectedUserId = typeof selectedUser === "string" ? selectedUser : selectedUser?._id;

      
      // check is chat open between the users 
      const isCurrentChatOpen =
        !!selectedUserId &&
        [currentUserId, String(selectedUserId)].sort().join("_") === newMessage.chatId;
      

      // if current chat open add message to current chat uniquely 
      if (isCurrentChatOpen) {
        useQueryPagination.setState((state) => ({
          messages: appendUniqueMessage(state.messages, newMessage),
        }));
        
        // as chat is open mark the message is read instantly (this can be bottleneck)
        if (!isFromMe) {
          axiosInstance.post(`/messages/${messageSenderId}/read`)
            .catch(err => console.error("Error marking message as read:", err));
        }
        return;
      }

      //now the case that chat is not open 
      // if the chat not open and some one send message to me increase the count for that particular user 
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

      // add the acked_id to ackedMessagesIds
      set((state) => ({
        ackedMessageIds: {
          ...state.ackedMessageIds,
          [ackId]: true,
        },
      }));

      // find the message rececived in messages and upadte as sent 
      useQueryPagination.setState((state) => ({
        messages: state.messages.map((msg) =>
          String(msg._id) === ackId ? { ...msg, status: "sent" } : msg
        ),
      }));
    });

    // Listen for message seen acknowledgment (double tick)
    socket.on("message-seen-Ack", (data) => {
      if (!data?.senderId || !data?.chatId) return;
      
      const { senderId, chatId } = data;
      const currentUserId = String(useAuthStore.getState().authUser?._id || "");
      
      if (senderId !== currentUserId) {
        return;
      }

      // Update messages from this sender in THIS chat to "seen" status
      useQueryPagination.setState((state) => ({
        messages: state.messages.map((msg) =>
          msg.chatId === chatId &&
          String(msg.senderId) === currentUserId && 
          msg.status !== "failed"
            ? { ...msg, status: "seen" }
            : msg
        ),
      }));
      });

    socket.on("connect_error", (error) => {
      toast.error(error.response?.data);
   });
},

// when you are not chatting with the selectedUser // chat colse and opening new chat  (chat swithcing) 
      unsubscribeToMessages:()=>{
        const authUser=useAuthStore.getState().authUser;
        if(!authUser) return;
        const socket=useAuthStore.getState().socket;
        if(!socket) return ;

        // first close the old listener of this user with old selectedUser
        socket.off("newMessage");
        socket.off("message-sent-Ack");
        socket.off("message-seen-Ack");
     },
     // now user select other chat 
     setselectedUser: async (selectedUser)=>{ 
      set({selectedUser});
      
      // store in local Storage this open chat ko
      if (selectedUser) {
        localStorage.setItem("chat-selected-user", JSON.stringify(selectedUser));
      } else {
        localStorage.removeItem("chat-selected-user");
        return;
      }
      
      // now get the selected user Id 
      const selectedUserId = typeof selectedUser === "string" ? selectedUser : selectedUser?._id;
      if (!selectedUserId) {
        return;
      }
      
      // as the authUser have selected this user i should emit the seen message to sender of this (selectedUser should know that his all send message is seen by the user)
      const authUser = useAuthStore.getState().authUser;
      const socket = useAuthStore.getState().socket;

      // if (socket && authUser) {
      //   socket.emit("message-seen-Ack", {
      //     receiver: selectedUser,
      //     sender: authUser
      //   });
      // }

      // for now the marking is done using http but its bottle neck use socket event to do so 

      // mark this selectedUser all unread messages as read as its chat is open 
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



    // already handled in socket logic above this both but may require if want to upadte the state directly from the other part of the app 
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