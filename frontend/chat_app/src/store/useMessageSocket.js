//file just for the practice
import {create} from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { useQueryPagination } from "./useQueryPagination";
// always think in terms of a single user that we are setting state for this user
export const useMessageSocket=create((set,get)=>({
    unreadCounts:{}, //store unread message for this user with his friends 
    ackedMessageIds:{}, // my message which are sended but not seen

    selectedUser:null,
    isMessagesLoading:false,


    sendMessages:async(messageData)=>{
        // create a temp message add to ui
        const {selectedUser}=get();
        const socket=useAuthStore.getState().socket;

        const authUser=useAuthStore.getState().authUser;

        const tempId=Date.now().toString();

        const chatId=[authUser._id,selectedUser._id].sort().join('_');
        

        const tempMessage={
            _id:tempId,
            senderId:authUser._id,
            receiverId:selectedUser._id,
            chatId:chatId,
            text:messageData.text,
            image:messageData.image ||null,
            status:"sending",
            createdAt:new Date().toISOString(),
        };

        useQueryPagination.setState((state)=>({
            messages:[...state.messages,tempMessage]
        }));

        // send the request to backend
        try {
            const res=await axiosInstance.post()

        }catch(error){

        }








    }






}))