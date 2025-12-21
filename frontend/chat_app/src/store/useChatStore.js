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
    searchResults: [],
    
    // Pagination states
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
    
    // Search users with cursor-based pagination
    searchUsers: async (query, reset = true) => {
        const currentState = get();
        
        console.log("searchUsers called:", { query, reset });
        
        if (!query || query.trim() === '') {
            console.log("Empty query, clearing results");
            set({ 
                searchResults: [], 
                searchPagination: { nextCursor: null, hasMore: false, isLoading: false, query: '' }
            });
            return;
        }
        
        if (currentState.searchPagination.isLoading) return;
        
        set({ 
            isUsersLoding: reset,
            searchPagination: { ...currentState.searchPagination, isLoading: true, query }
        });
        
        try {
            const cursor = reset ? null : currentState.searchPagination.nextCursor;
            const params = new URLSearchParams({
                query,
                limit: '20'
            });
            if (cursor) params.append('cursor', cursor);
            
            console.log("Making request to:", `/messages/search?${params}`);
            const res = await axiosInstance.get(`/messages/search?${params}`);
            console.log("Search response:", res.data);
            
            set(state => ({
                searchResults: reset ? res.data.users : [...state.searchResults, ...res.data.users],
                searchPagination: {
                    nextCursor: res.data.nextCursor,
                    hasMore: res.data.hasMore,
                    isLoading: false,
                    query,
                },
            }));
        } catch (error) {
            console.error("Search error:", error);
            toast.error(error.response?.data?.message || "Failed to search users");
            set({ searchPagination: { ...currentState.searchPagination, isLoading: false } });
        } finally {
            set({ isUsersLoding: false });
        }
    },
    
    loadMoreSearchResults: async () => {
        const { searchPagination } = get();
        if (searchPagination.query) {
            await get().searchUsers(searchPagination.query, false);
        }
    },
    getFriends: async (reset = true) => {
        const currentState = get();
        if (currentState.friendsPagination.isLoading) return;
        
        set({ 
            isUsersLoding: reset,
            friendsPagination: { ...currentState.friendsPagination, isLoading: true }
        });
        
        try {
            const cursor = reset ? null : currentState.friendsPagination.nextCursor;
            const params = cursor ? `?cursor=${cursor}&limit=20` : '?limit=20';
            const res = await axiosInstance.get(`/messages/friends${params}`);
            
            set(state => ({
                friends: reset ? res.data.friends : [...state.friends, ...res.data.friends],
                friendsPagination: {
                    nextCursor: res.data.nextCursor,
                    hasMore: res.data.hasMore,
                    isLoading: false,
                },
            }));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch friends");
            set({ friendsPagination: { ...currentState.friendsPagination, isLoading: false } });
        } finally {
            set({ isUsersLoding: false });
        }
    },
    
    loadMoreFriends: async () => {
        await get().getFriends(false);
    },

   getPendingRequests: async (reset = true) => {
        const currentState = get();
        if (currentState.receivedRequestsPagination.isLoading) return;
        
        set({ receivedRequestsPagination: { ...currentState.receivedRequestsPagination, isLoading: true } });
        
        try {
            const cursor = reset ? null : currentState.receivedRequestsPagination.nextCursor;
            const params = cursor ? `?cursor=${cursor}&limit=20` : '?limit=20';
            const res = await axiosInstance.get(`/messages/friends-requests${params}`);
            
            set(state => ({
                friendRequests: {
                    ...state.friendRequests,
                    received: reset ? res.data.requests : [...state.friendRequests.received, ...res.data.requests],
                },
                receivedRequestsPagination: {
                    nextCursor: res.data.nextCursor,
                    hasMore: res.data.hasMore,
                    isLoading: false,
                },
            }));
        } catch (error) {
            toast.error("Error fetching pending requests");
            set({ receivedRequestsPagination: { ...currentState.receivedRequestsPagination, isLoading: false } });
        }
    },
    
    loadMoreReceivedRequests: async () => {
        await get().getPendingRequests(false);
    },
  getsendedRequests: async (reset = true) => {
        const currentState = get();
        if (currentState.sentRequestsPagination.isLoading) return;
        
        set({ sentRequestsPagination: { ...currentState.sentRequestsPagination, isLoading: true } });
        
        try {
            const cursor = reset ? null : currentState.sentRequestsPagination.nextCursor;
            const params = cursor ? `?cursor=${cursor}&limit=20` : '?limit=20';
            const res = await axiosInstance.get(`/messages/friends-send${params}`);
            
            set(state => ({
                friendRequests: {
                    ...state.friendRequests,
                    sent: reset ? res.data.requests : [...state.friendRequests.sent, ...res.data.requests],
                },
                sentRequestsPagination: {
                    nextCursor: res.data.nextCursor,
                    hasMore: res.data.hasMore,
                    isLoading: false,
                },
            }));
        } catch (error) {
            toast.error(error.message);
            set({ sentRequestsPagination: { ...currentState.sentRequestsPagination, isLoading: false } });
        }
    },
    
    loadMoreSentRequests: async () => {
        await get().getsendedRequests(false);
    },




    getMessages: async (userId, reset = true) => {
        const currentState = get();
        if (currentState.messagesPagination.isLoading) return;
        
        set({ 
            isMessagesLoding: reset,
            messagesPagination: { ...currentState.messagesPagination, isLoading: true }
        });
        
        try {
            const cursor = reset ? null : currentState.messagesPagination.nextCursor;
            const params = cursor ? `?cursor=${cursor}&limit=50` : '?limit=50';
            const res = await axiosInstance.get(`/messages/${userId}${params}`);
            
            set(state => ({
                messages: reset ? res.data.messages : [...res.data.messages, ...state.messages],
                messagesPagination: {
                    nextCursor: res.data.nextCursor,
                    hasMore: res.data.hasMore,
                    isLoading: false,
                },
            }));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch messages");
            set({ messagesPagination: { ...currentState.messagesPagination, isLoading: false } });
        } finally {
            set({ isMessagesLoding: false });
        }
    },
    
    loadMoreMessages: async () => {
        const { selectedUser } = get();
        if (!selectedUser) return;
        await get().getMessages(selectedUser._id, false);
    },
    SendingFriendRequest:async(Id)=>{
      try {
        console.log("Sending friend request to:", Id);
        const res=await axiosInstance.post(`/messages/friends/send/${Id}`);
        console.log("Friend request sent successfully:", res.data);
        return res.data;
      }
      catch(error){
        console.error("Error in SendingFriendRequest:", error.response?.data || error.message);
        throw error;
      }
    },
    removingFriendRequest:async(Id)=>{
      try{
        const res=await axiosInstance.delete(`/messages/friends/cancel/${Id}`);
        toast.success("Friend request cancelled");
      }
      catch(error){
        toast.error(error.response?.data?.message || "Failed to cancel request");
      }
    },

    // function to remove an existing friend
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
    if (!socket) {
      console.log("No socket available, cannot subscribe");
      return;
    }

    // 🔄 Remove any previous "newMessage" listener to prevent duplicate firing
    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();
      const currentUserId = useAuthStore.getState().authUser?._id;
      console.log("📩 New message received via socket:", newMessage);
      console.log("Current selected user:", selectedUser?.fullname, selectedUser?._id);
      console.log("Current user ID:", currentUserId);

      // Parse chatId to determine if this message involves current user
      const [userId1, userId2] = newMessage.chatId.split('_');
      const isMessageForMe = userId1 === currentUserId || userId2 === currentUserId;

      if (!isMessageForMe) {
        console.log("Message not for current user, ignoring");
        return;
      }

      // Determine who sent the message (the other person in the chat)
      const messageSenderId = newMessage.senderId;
      const isFromMe = messageSenderId === currentUserId;

      console.log("Message is from me:", isFromMe);
      console.log("Message sender ID:", messageSenderId);

      // ✅ Case 1: Message is from currently selected user (incoming message in open chat)
      if (selectedUser && messageSenderId === selectedUser._id) {
        console.log("✅ Message is from selected user, adding to chat");
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
        // Mark as read since chat is open
        axiosInstance.post(`/messages/${messageSenderId}/read`)
          .catch(err => console.error("Error marking message as read:", err));
      } 
      // ✅ Case 2: Message from someone else (not current chat) - increment unread count
      else if (!isFromMe) {
        console.log("📬 Message is from other user, incrementing unread count for:", messageSenderId);
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [messageSenderId]: (state.unreadCounts?.[messageSenderId] || 0) + 1,
          },
        }));
      }
      // ✅ Case 3: Message sent by me (from another device/tab) - add to chat if same user selected
      else if (isFromMe && selectedUser) {
        console.log("💬 Message sent by me, adding to current chat");
        set((state) => ({
          messages: [...state.messages, newMessage],
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