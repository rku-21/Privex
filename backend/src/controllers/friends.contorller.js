import User from "../models/user.model";
import Friendship from "../models/friendShip.model";
import mongoose from "mongoose";


// get friend request 
export const getAllrequests=async(req,res)=>{
    try {
        const userId=req.user._id;
        const {cursor,limit=20}=req.query;

        const query={
            friendId:userId,
            status:"pending",
        };
        if(cursor){
            query.createdAt={$lt :new Date(cursor)};
        }
        const requests= await Friendship.find(query).sort({createdAt:-1}).limit(parseInt(limit)+1).populate('userId','_id fullname email profilePicture');

        const hasMore=requests.length>limit;
        const receivedRequest=requests.slice(0,limit).map(r=>r.userId); // remove the userid just need user details 
        const nextCursor=hasMore?requests[limit-1].createdAt:null;
        res.status(200).json({
            requests:receivedRequest,
            nextCursor:nextCursor,
            hasMore:hasMore,
        });

    }catch(error){
        res.status(500).json({
            mesage:"internal server error",
            error:error.message,
        });

    }
};

export const getAllsendRequest=async(req,res)=>{
    try {
        const userId=req.user._id;
        const {cursor,limit=20}=req.query;
        const query={
            userId:userId,
            status:"pending",
        }
        if(cursor){
            query.createdAt={$lt :new Date(cursor)};
        }
        const requests=Friendship.find(query).sort({createdAt:-1}).populate('friendId','_id fullname email profilePicture');

        const hasMore=requests.length>limit;
        const sendRequests=requests.slice(0,limit).map(r=>r.friendId);
        const nextCursor=hasMore?requests[limit-1].createdAt:null;

        res.status(200).json({
            sendRequests,
            nextCursor:nextCursor,
            hasMore:hasMore
        });
        }catch(error){
            res.status(500).json({
                message:"internal server error",
                error:error.mesage,
            })
        }
}