import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useQueryPagination=create((set,get)=>({

     isUsersLoding:false,
     isMessagesLoding:false,
     messages:[],

     friendsPagination: {
      nextCursor: null,
      hasMore: false,
      isLoading: false,
    },
    friends:[],

    messagesPagination :{
        nextCursor:null,
        hasMore:null,
        isLoading:false
    },

    receivedRequestsPagination: {
      nextCursor: null,
      hasMore: false,
      isLoading: false,
    },
    friendRequests: {
      sent: [],
      received: [],
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
    searchResults: [],


    searchUsers : async(query, reset=true)=>{
        const currentState=get();

        if(!query  || query.trim()===''){
               set({
                     searchResults:[],
                     searchPagination :{
                     nextCursor: null,
                     hasMore: false,
                     isLoading: false,
                     query: '',
                   }
                });
                return;
        }

    // New search → isUsersLoding = true → show main loader
    // Scroll → isUsersLoding = false → don’t block the UI

        if(currentState.searchPagination.isLoading) return; // prevent multiple rapid requests
 
        
//searchPagination: { ...currentState.searchPagination, isLoading: true, query }
// You’re updating the pagination part of the state.
// ...currentState.searchPagination → keep all existing pagination values (like nextCursor, hasMore)
// isLoading: true → mark that an API request is in progress (so you don’t trigger duplicate requests)
// query → store the current search term in the pagination state
       set({
            isUsersLoding:reset,
            searchPagination :{
                ...currentState.searchPagination,
                isLoading:true,
                query
            }

        });

        try {
            const cursor=reset?null:currentState.searchPagination.nextCursor;
            const params=new URLSearchParams({
                query,
                limit:'20',
            });
            if(cursor){
                params.append('cursor',cursor);
            }
             const res = await axiosInstance.get(`/messages/search?${params}`);
             set(state=>({
                searchResults:reset?res.data.users:[...state.searchResults,...res.data.users],
                searchPagination:{
                    nextCursor:res.data.nextCursor,
                    hasMore:res.data.hasMore,
                    isLoading:false,
                    query,
                },
             }));
            } catch(error){
                toast.error(error.response?.data?.message);
                set({
                    searchPagination :{
                        ...currentState.searchPagination,
                        isLoading:false,
                    }
                });
            } finally{
                set({isUsersLoding:false});
            }
    },
    
    loadMoreSearchResults: async () => {
    try {
        const { searchPagination } = get();
        if (searchPagination.query) {
            await get().searchUsers(searchPagination.query, false);
        }
    } catch (error) {
            toast.error("Failed to load more results"); 
    }
  },

getFriends:async (reset=true)=>{
    const currentState=get();
    if(currentState.friendsPagination.isLoading) return;

    set({
        isUsersLoding:reset,
        friendsPagination:{
            ...currentState.friendsPagination,
            isLoading:true,
        }
    });
    try {
        const cursor=reset?null:currentState.friendsPagination.nextCursor;
        const params = cursor ? `?cursor=${cursor}&limit=20` : '?limit=20';
        const res = await axiosInstance.get(`/friends${params}`);
        set(state=>({
            friends:reset?res.data.friends:[...state.friends,...res.data.friends],
            friendsPagination:{
                nextCursor:res.data.nextCursor,
                hasMore:res.data.hasMore,
                isLoading:false
            }
        }));
    }catch(error){
        toast.error("Failed to load more friends");
        set({
            friendsPagination:{
                ...currentState.friendsPagination,
                isLoading:false,
            }
        })
    } finally{
        set({isUsersLoding:false});
    }
},
loadMoreFriends : async()=>{
    try {
        await get().getFriends(false);

    }catch(error){
        toast.error(error.response?.data?.message);
    }
},

getPendingRequests: async (reset = true) => {
        const currentState = get();
        if (currentState.receivedRequestsPagination.isLoading) return;
        
        set({ receivedRequestsPagination: { ...currentState.receivedRequestsPagination, isLoading: true } });
        
        try {
            const cursor = reset ? null : currentState.receivedRequestsPagination.nextCursor;
            const params = cursor ? `?cursor=${cursor}&limit=20` : '?limit=20';
            const res = await axiosInstance.get(`/friends/requests${params}`);
            
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
            toast.error("Error in feacthing the requests");
            set({ receivedRequestsPagination: { ...currentState.receivedRequestsPagination, isLoading: false } });
        }
 },
 loadMoreReceivedRequests: async () => {
     try {
        await get().getPendingRequests(false);
     } catch(error){
        toast.error(error.response?.data?.message);
     }
 },

  getsendedRequests: async (reset = true) => {
        const currentState = get();
        if (currentState.sentRequestsPagination.isLoading) return;
        
        set({ sentRequestsPagination: { ...currentState.sentRequestsPagination, isLoading: true } });
        
        try {
            const cursor = reset ? null : currentState.sentRequestsPagination.nextCursor;
            const params = cursor ? `?cursor=${cursor}&limit=20` : '?limit=20';
            const res = await axiosInstance.get(`friends/send${params}`);
            
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
       try{
         await get().getsendedRequests(false);
       }catch(error){
          toast.error(error.response?.data?.message);
       }
    },

     // get the message between the user with pagination efficiently
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
    loadMoreMessages: async (userId) => {
        try {
            if(!userId) return;
            await get().getMessages(userId,false)
        }catch(error){
            toast.error(error.response?.data?.message);
        }
       
    },








        
    













    








}))