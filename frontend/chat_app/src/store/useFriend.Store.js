import toast from "react-hot-toast";
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useFriendStore = create((set, get) => ({
    friend:[],
    friendRequests:{
        sent:[],
        received:[],
    },


    // send the friend request handler 
     SendingFriendRequest:async(userId)=>{
        try {
            if(!userId) return;
            const res=await axiosInstance.post(`/friends/send/${userId}`);
            return res.data;
        }catch(error){
            toast.error("Unable to send Friend Request");
        }

     },

     // remove frined request handler
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
}));