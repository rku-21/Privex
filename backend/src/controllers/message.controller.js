import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import Friendship from '../models/friendShip.model.js';
import cloudinary from '../lib/cloudinary.js';
import { getReceiverSocketId, io } from '../lib/socket.js';
import { getUserSockets } from '../lib/redisPresence.js';
import mongoose from 'mongoose';


// function to return the all user at once except the authUser itself (very bad when large user)
export const getAllUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const filterAllUsers = await User.find({ userId: { $ne: userId } }).select("-password");
    res.status(200).json(filterAllUsers);
  }
  catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}



// search  using efficiently using cursor in search bars 
export const searchUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { query, cursor, limit = 20 } = req.query;
    if (!query || query.trim() === "") {
      return res.status(200).json({ users: [], nextCursor: null, hasMore: false });
    }
    const searchQuery = {
      _id: { $ne: userId },
      $or: [
        // search the user whose fullname contain query or email contain query 'i' make its case insensitive
        { fullname: { $regex: query, $options: 'i' } }, 
        { email: { $regex: query, $options: 'i' } }
      ]
    };

    if (cursor) {
      searchQuery.createdAt = { $lt: new Date(cursor) };
    }
    const users = await User.find(searchQuery)
      .select("fullname email profilePicture createdAt")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) + 1);
   

    const usersWithStatus = await Promise.all(users.map(async (user) => {
      const isFriend = await Friendship.findOne({
        userId: userId,
        friendId: user._id,
        status: "accepted"
      });
      const sentRequest = await Friendship.findOne({
        userId: userId,
        friendId: user._id,
        status: "pending"
      });
      const receivedRequest = await Friendship.findOne({
        userId: user._id,
        friendId: userId,
        status: "pending"
      });

      return {
        ...user.toObject(),
        relationshipStatus: isFriend ? "friend" : sentRequest ? "sent" : receivedRequest ? "received" : "none"
      };
    }));

    const hasMore = users.length > limit;
    const result = usersWithStatus.slice(0, limit);
    const nextCursor = hasMore ? users[limit - 1].createdAt : null;

    res.status(200).json({
      users: result,
      nextCursor,
      hasMore
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}


// get user for the call interface on the caller side 
export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("fullname profilePicture");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}




// using cursor based pagination get the message between user in the chat 
export const getMessagesBetweenUsers = async (req, res) => {
  try {
    const myId = req.user._id;
    const userTochatId = req.params.id;
    const { cursor, limit = 50 } = req.query;

    const friendship = await Friendship.findOne({
      $or: [
        { userId: myId, friendId: userTochatId, status: "accepted" },
        { userId: userTochatId, friendId: myId, status: "accepted" }
      ]
    });

    if (!friendship) {
      return res.status(403).json({
        message: "You both are not friends",
        messages: [],
        nextCursor: null,
        hasMore: false
      });
    }
    const chatId = [myId.toString(), userTochatId].sort().join('_');
    const query = { chatId };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) + 1);

    const hasMore = messages.length > limit;
    const result = messages.slice(0, limit).reverse();
    const nextCursor = hasMore ? messages[limit - 1].createdAt : null;

    res.status(200).json({
      messages: result,
      nextCursor,
      hasMore
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

// when client send the message by http , method take it save to db and emit message to the other client 
export const sendMessges = async (req, res) => {
  try {
    const { text, image, video } = req.body;
    const senderId = req.user._id;
    const receiverId = req.params.id;

    // checking if the user are friends or not first
    const friendship = await Friendship.findOne({
      $or: [
        { userId: senderId, friendId: receiverId, status: "accepted" },
        { userId: receiverId, friendId: senderId, status: "accepted" }
      ]
    });

    if (!friendship) {
      return res.status(403).json({
        message: "You can only send messages to your friends"
      });
    }

    // Create consistent chatId
    const chatId = [senderId.toString(), receiverId].sort().join('_');

    let fileUrl;
    let fileType = null;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        resource_type: "image",
      });
      fileUrl = uploadResponse.secure_url;
      fileType = "image";
    } else if (video) {
      const uploadResponse = await cloudinary.uploader.upload(video, {
        resource_type: "video",
      });
      fileUrl = uploadResponse.secure_url;
      fileType = "video";
    }

    const newMessage = new Message({
      chatId,
      senderId,
      text,
      image: fileType === "image" ? fileUrl : null,
      video: fileType === "video" ? fileUrl : null,
      status:"sent",
    });

    await newMessage.save();

    // socket id of the tab/device that initiated this HTTP request
    const senderSocketIdHeader = req.headers["x-socket-id"];
    const activeSenderSocketId = Array.isArray(senderSocketIdHeader)
      ? senderSocketIdHeader[0]
      : senderSocketIdHeader;

    // Broadcast to sender's other tabs/devices so same-account sessions stay in sync.
    const senderSocketIds = await getUserSockets(senderId);
    const otherSenderSocketIds = activeSenderSocketId
      ? senderSocketIds.filter((socketId) => socketId !== activeSenderSocketId)
      : senderSocketIds;

    if (otherSenderSocketIds.length > 0) {
      otherSenderSocketIds.forEach((socketId) => {
        io.to(socketId).emit("newMessage", newMessage);
      });
    }

    // Always ack sender devices after DB save, even if receiver is offline.
    if (senderSocketIds.length > 0) {
      senderSocketIds.forEach((socketId) => {
        io.to(socketId).emit("message-sent-Ack", newMessage);
      });
    }

    const receiverSocketIds = await getUserSockets(receiverId);
    if (receiverSocketIds.length > 0) {
      receiverSocketIds.forEach((socketId) => {
        io.to(socketId).emit("newMessage", newMessage);
      });

    } else {
      console.log(` user is offline  message saved to DB`);
    }
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message", error);
    res.status(500).send({ message: "Internal server error" });
  }
};


// Mark message as Read when user open the chat 
export const markMessagesAsRead = async (req, res) => {
  try {
    const receiverId = req.user._id;
    const senderId = req.params.id;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "Invalid Ids" });
    }

    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid ids" });
    }
    const chatId = [receiverId.toString(), senderId].sort().join('_');

    
    const result = await Message.updateMany(
      {
        chatId: chatId,
        senderId: new mongoose.Types.ObjectId(senderId),
        read: false
      },
      { $set: { read: true } }
    );

    res.status(200).json({
      message: "All messages Marked as read",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
   res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}
