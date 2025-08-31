import {create} from "zustand"
import toast from "react-hot-toast"
import { axiosInstance } from "../lib/axios"
import {useAuthStore} from "./useAuthStore"
export const useChatStore=create((set,get)=>({
    messages:[],
    friends:[],
    friendRequests: {
    sent: [],
    received: [],
  },
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
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },
  SubscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
   const socket = useAuthStore.getState().socket;
   socket.on("newMessage", (newMessage) => {

    set({
        messages: [...get().messages, newMessage],
      });
    });
  },

     unsubscribeToMessages:()=>{
        const socket=useAuthStore.getState().socket;
        socket.off("newMessage");
     },
    setSelectedUser:(selectedUser)=>{ set({selectedUser})}

}))