import User from "../models/user.model.js";
import Friendship from "../models/friendShip.model.js";


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
        const requests=await Friendship.find(query)
            .sort({createdAt:-1})
            .limit(parseInt(limit)+1)
            .populate('friendId','_id fullname email profilePicture');

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
                error:error.message,
            })
        }
}

export const getAllfriends=async(req,res)=>{
    try {
        const {cursor,limit=20}=req.query;
        const userId=req.user._id;
        const query={
            userId:userId,
            status:"accepted"
        }
        if(cursor){
            query.createdAt={$lt : new Date(cursor)};
        }
        const friendship=await Friendship.find(query).sort({createdAt:-1}).limit(parseInt(limit)+1).populate('friendId','_id fullname email profilePicture');

        const hasMore=friendship.length>limit;
        const nextCursor=hasMore?friendship[limit-1].createdAt:null;
        const friends=friendship.slice(0,limit).map(f=>f.friendId);

        res.status(200).json({
            friends,
            nextCursor:nextCursor,
            hasMore:hasMore
        })
    } catch(error){
        res.status(500).json({
            message:"internal server error",
            error:error.message,
        })

    }
}
export const friendRequestSend=async(req,res)=>{
    try{
        const fromUserId=req.user._id;
        const toUserId=req.params.id;

        if(fromUserId.toString()===toUserId) {
            return res.status(400).json({
               message:"cannot send the request to yourself"
            })
        }
        const toUser=await User.findById(toUserId);
        if(!toUser) return res.status(404).json({message:"User not found"});

        const alreadyFriend=await Friendship.findOne({
            userId:fromUserId,
            friendId:toUserId,
            status:"accepted"
        });
        if(alreadyFriend) return res.status(400).json({message:"alredy friendship exist"});

        const friendShip=new Friendship({
            userId:fromUserId,
            friendId:toUserId,
            status:"pending"

        });

        await friendShip.save();
        res.status(200).json({message:"friend request send"});


    }catch(error){
        res.status(500).json({
            message:"Internal server Error",
            error:error.message,
        })
    }
};


//controller for removing the send request 
export const removeRequest=async (req,res)=>{
    try{
        const fromUserId=req.user._id;
        const toUserId=req.params.id;

        const toUser=await User.findById(toUserId);
        if(!toUser) return res.status(404).json({message:"user not found"});
        const friendship=await Friendship.findOneAndDelete({
            userId:fromUserId,
            friendId:toUserId,
            status:"pending",
        });
        if(!friendship) return res.status(404).json({message:"friendship not found"});

        res.status(200).json({message:"request cancelled succesfully"});
    }catch(error){
        res.status(500).json({message:"Internal Server Error"});

    }
}
// controllers for the friend request rejected
export const friendRejected=async(req,res)=>{
   try {
        const currentUserId=req.user._id;
    const otherUserId=req.params.id;

    const otherUser=await User.findById(otherUserId);
        if(!otherUser) return res.status(404).json({message:"user not found"});

        const wasAccepted=await Friendship.findOne({
            $or:[
                {userId:currentUserId,friendId:otherUserId,status:"accepted"},
                {userId:otherUserId,friendId:currentUserId,status:"accepted"}
            ]
        });

        const result=await Friendship.deleteMany({
            $or:[
                {userId:currentUserId,friendId:otherUserId},
                {userId:otherUserId,friendId:currentUserId}
            ]
        });
        if(result.deletedCount>0 && wasAccepted){
            await User.findByIdAndUpdate(currentUserId,{$inc :{friendsCount:-1}});
            await User.findByIdAndUpdate(otherUserId,{$inc:{friendsCount:-1}});
        }
        res.status(200).json({message:"friend removed"});


   }catch(error){
      res.status(500).json({message:"Internal Server Error"});
   }


};

// controller for the friend request accepted
export const friendRequestAccept=async(req,res)=>{
    try{
        const currentUserId=req.user._id;
        const fromUserId=req.params.id;

        const fromUser=await User.findById(fromUserId);
        if(!fromUser) return res.status(404).json({message:"user not found"});

        const friendShip=await Friendship.findOneAndUpdate(
            {
                userId:fromUserId,
                friendId:currentUserId,
                status:"pending"
            },
            {
                status:"accepted",
            },
            {
                new :true,
            },
        );
        if(!friendShip) return res.status(404).json({message:"No such Friend request"});

        // make bidirctional friendship
        await Friendship.create({
            userId:currentUserId,
            friendId:fromUserId,
            status:"accepted",
        });

        // update the friend count 
        await User.findByIdAndUpdate(currentUserId,{$inc:{friendsCount:1}});
        await User.findByIdAndUpdate(fromUserId,{$inc:{friendsCount:1}});

        res.status(200).json({message:"Friend request accepted sucessfully"});
    } catch(error){
        res.status(500).json({message:"Internal server Error"});
    }
}







