import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import cloudinary from '../lib/cloudinary.js';
import { getReceiverSocketId,io } from '../lib/socket.js';

export const getAllUsers = async (req, res) => {
    try {
        const userId=req.user.id;
        const filterAllUsers=await User.find({userId:{$ne:userId}}).select("-password");
         res.status(200).json(filterAllUsers);
    }
    catch(error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
}

// to get all friends to dashboard
export const getAllfriends=async(req,res)=>{
  try {
    const user = await User.findById(req.user._id).populate("friends", "fullname email profilePicture");

    res.status(200).json(user.friends);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch friends", error });
  }
}



export const getMessagesBetweenUsers = async (req, res)=> {
    try {
        const myId=req.user._id;
        const userTochatId=req.params.id; 
        const messages=await Message.find({
            $or: [
                {senderId: myId, receiverId: userTochatId},
                {senderId: userTochatId, receiverId: myId}
            ]
        })
        .sort({createdAt: 1}) 
        res.status(200).json(messages);
    }
    catch(error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
}

// send messages between two users
export const sendMessges= async (req, res) => {
    try {
        const {text , image} = req.body;
        const senderId=req.user._id; 
        const receiverId=req.params.id; 
        let imageUrl;
        if(image){
            //upload kar image ko cloudinary par and get secure url\
            const uploadResponse=await cloudinary.uploader.upload(image);
            imageUrl=uploadResponse.secure_url;
        }
        const newMessage=new Message ({
            senderId,
            receiverId,
            text, 
            image: imageUrl
        });
        await newMessage.save();
        const  receiverSocketId= getReceiverSocketId(receiverId);
         
        if(receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);

        }
           res.status(201).json(newMessage);
    }
    catch(error) {

        
        res.status(500).send({message:"internal server error   "})
    }
}

// /koi friend request bheje tab 
export const friendRequestSend= async (req, res)=>{
try {
    const fromUserId = req.user._id;
    const toUserId = req.params.id;

    if (fromUserId.toString() === toUserId) {
      return res.status(400).json({ error: "Cannot send request to yourself" });
    }

    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);

    if (!toUser) return res.status(404).json({ error: "User not found" });

  

    toUser.friendRequests.receiveds.push(fromUserId);
    fromUser.friendRequests.sent.push(toUser);
    await toUser.save();
    await fromUser.save();

    res.status(200).json({ message: "Friend request sent" });
  } catch (err) {

    res.status(500).json(err);
  }
}
// if he user want to remove the request


  export const removeRequest = async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const  toUserId  = req.params.id;            

    if (!toUserId) {
      return res.status(400).json({ message: "toUserId is required." });
    }

    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);

    if (!fromUser || !toUser) {
      return res.status(404).json({ message: "User not found." });
    }

    
    fromUser.friendRequests.sent = fromUser.friendRequests.sent.filter(
      (id) => id.toString() !== toUserId
    );

   
    toUser.friendRequests.receiveds = toUser.friendRequests.receiveds.filter(
      (id) => id.toString() !== fromUserId
    );


    await fromUser.save();
    await toUser.save();

    res.status(200).json({ message: "Friend request removed successfully." });

  } catch (error) {


    res.status(500).json({ message: "Internal server error." });
  }
};
//jab koi request ko accept kre tab
export const friendRequestAccept= async (req,res)=>{
    try {
    const currentUser = await User.findById(req.user._id);
    const fromUser = await User.findById(req.params.id);

    if (!fromUser) return res.status(404).json({ error: "User not found" });

    const index = currentUser.friendRequests.receiveds.indexOf(fromUser._id);
    if (index === -1) {
      return res.status(400).json({ error: "No such friend request" });
    }

    currentUser.friendRequests.receiveds.splice(index, 1);
    fromUser.friendRequests.sent=fromUser.friendRequests.sent.filter((id)=>id.toString()!==currentUser._id.toString()
   );
    currentUser.friends.push(fromUser._id);
    fromUser.friends.push(currentUser._id);

    await currentUser.save();
    await fromUser.save();

    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}
// jab koi reques reject kar de 
export const friendRejected=async(req,res)=>{
 try {
    const currentUser = await User.findById(req.user._id);
    const otherUser = await User.findById(req.params.id);

    if (!otherUser) return res.status(404).json({ error: "User not found" });

    
    currentUser.friends = currentUser.friends.filter(
      (id) => id.toString() !== otherUser._id.toString()
    );
     otherUser.friends = otherUser.friends.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    currentUser.friendRequests.receiveds = currentUser.friendRequests.receiveds.filter(
      (id) => id.toString() !== otherUser._id.toString()
    );
    otherUser.friendRequests.sent=otherUser.friendRequests.sent.filter((id)=>id.toString()!==currentUser._id.toString()
    );
   
    currentUser.friendRequests.sent=currentUser.friendRequests.sent.filter((id)=>id.toString()!==otherUser._id.toString()
   );
   otherUser.friendRequests.receiveds=otherUser.friendRequests.receiveds.filter((id)=>id.toString()!==currentUser._id.toString()
  );

    await currentUser.save();
    await otherUser.save();

    res.status(200).json({ message: "Friend removed/rejected" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// to get all friends request sended to users and show him  
export const getAllrequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("friendRequests.receiveds");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const receivedUserIds = user.friendRequests.receiveds;

 
    const receivedRequests = await User.find({
      _id: { $in: receivedUserIds },
    }).select("_id fullname email profilePicture");

    
    res.status(200).json(receivedRequests);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch friend requests",
      error: error.message,
    });
  }
};



// to get all the sendRequsts 
export const getAllsendRequest=async(req,res)=>{
  try {
    const authUserId=req.user._id;
   
      const user = await User.findById(authUserId).select("friendRequests.sent");
        if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
        const sentRequests = await User.find({
      _id: { $in: user.friendRequests.sent },
    }).select("_id fullname email profilePicture");

    res.status(200).json(sentRequests);
}
  catch(error){
    throw (error.message)
    res.status(500).json({message:"Failed to fetch send request",error});
  }
}
