import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import Friendship from '../models/friendShip.model.js';
import cloudinary from '../lib/cloudinary.js';
import { getReceiverSocketId, io } from '../lib/socket.js';
import { getUserSockets } from '../lib/redis.js';
import mongoose from 'mongoose';


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

// Search users with cursor-based pagination
export const searchUsers = async (req, res) => {
    try {
        const userId = req.user._id;
        const { query, cursor, limit = 20 } = req.query;

        console.log("Search request:", { query, cursor, limit, userId });

        if (!query || query.trim() === "") {
            return res.status(200).json({ users: [], nextCursor: null, hasMore: false });
        }

        // Build search query
        const searchQuery = {
            _id: { $ne: userId },
            $or: [
                { fullname: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        };

        if (cursor) {
            searchQuery.createdAt = { $lt: new Date(cursor) };
        }

        console.log("MongoDB query:", JSON.stringify(searchQuery));

        const users = await User.find(searchQuery)
            .select("fullname email profilePicture createdAt")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit) + 1);

        console.log(`Found ${users.length} users`);

        // For each user, check relationship status
        const usersWithStatus = await Promise.all(users.map(async (user) => {
            // Check if friends (accepted friendship where I'm userId)
            const isFriend = await Friendship.findOne({
                userId: userId,
                friendId: user._id,
                status: "accepted"
            });

            // Check if I sent a request (pending friendship where I'm userId)
            const sentRequest = await Friendship.findOne({
                userId: userId,
                friendId: user._id,
                status: "pending"
            });

            // Check if they sent me a request (pending friendship where they're userId)
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
        console.error("Error searching users:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
}

// Get user by ID (for call interfaces)
export const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select("fullname profilePicture");
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

// to get all friends to dashboard with cursor-based pagination
export const getAllfriends = async (req, res) => {
  try {
    const { cursor, limit = 20 } = req.query;
    const userId = req.user._id;

    // Find friendships where I'm the userId and status is accepted
    // We only need one direction since we create bidirectional friendships
    const query = {
      userId: userId,
      status: "accepted"
    };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const friendships = await Friendship.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) + 1)
      .populate('friendId', 'fullname email profilePicture');

    const hasMore = friendships.length > limit;
    const friends = friendships.slice(0, limit).map(f => f.friendId);
    const nextCursor = hasMore ? friendships[limit - 1].createdAt : null;

    console.log(`Fetched ${friends.length} friends for user ${userId}`);

    res.status(200).json({ 
      friends, 
      nextCursor,
      hasMore 
    });
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ message: "Failed to fetch friends", error });
  }
}



// Get messages with cursor-based pagination
export const getMessagesBetweenUsers = async (req, res) => {
  try {
    const myId = req.user._id;
    const userTochatId = req.params.id;
    const { cursor, limit = 50 } = req.query;

    // Check if users are friends before allowing message retrieval
    const friendship = await Friendship.findOne({
      $or: [
        { userId: myId, friendId: userTochatId, status: "accepted" },
        { userId: userTochatId, friendId: myId, status: "accepted" }
      ]
    });

    if (!friendship) {
      return res.status(403).json({ 
        message: "You can only view messages with your friends",
        messages: [],
        nextCursor: null,
        hasMore: false
      });
    }

    // Create consistent chatId
    const chatId = [myId.toString(), userTochatId].sort().join('_');

    const query = { chatId };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // newest first
      .limit(parseInt(limit) + 1);

    const hasMore = messages.length > limit;
    const result = messages.slice(0, limit).reverse(); // reverse to show oldest first in chat
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

// send messages between two users
export const sendMessges = async (req, res) => {
  try {
    const { text, image, video } = req.body;
    const senderId = req.user._id;
    const receiverId = req.params.id;

    // Check if users are friends before allowing message send
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
    });

    await newMessage.save();

    // 🚀 PRODUCTION: Send to ALL devices of the receiver
    const receiverSocketIds = await getUserSockets(receiverId);
    if (receiverSocketIds.length > 0) {
      receiverSocketIds.forEach(socketId => {
        io.to(socketId).emit("newMessage", newMessage);
      });
      console.log(`💬 Message sent to ${receiverSocketIds.length} device(s) of user ${receiverId}`);
    } else {
      console.log(`📵 User ${receiverId} is offline, message saved to DB`);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};


// Send friend request
export const friendRequestSend = async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const toUserId = req.params.id;

    if (fromUserId.toString() === toUserId) {
      return res.status(400).json({ error: "Cannot send request to yourself" });
    }

    const toUser = await User.findById(toUserId);
    if (!toUser) return res.status(404).json({ error: "User not found" });

    // Check if friendship already exists
    const existingFriendship = await Friendship.findOne({
      userId: fromUserId,
      friendId: toUserId
    });

    if (existingFriendship) {
      return res.status(400).json({ error: "Friend request already sent or you are already friends" });
    }

    // Create new friendship request
    const friendship = new Friendship({
      userId: fromUserId,
      friendId: toUserId,
      status: "pending"
    });

    await friendship.save();

    res.status(200).json({ message: "Friend request sent" });
  } catch (err) {
    console.error("Error sending friend request:", err);
    res.status(500).json({ error: "Server error" });
  }
}
// Remove sent friend request
export const removeRequest = async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const toUserId = req.params.id;

    if (!toUserId) {
      return res.status(400).json({ message: "toUserId is required." });
    }

    const result = await Friendship.findOneAndDelete({
      userId: fromUserId,
      friendId: toUserId,
      status: "pending"
    });

    if (!result) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    res.status(200).json({ message: "Friend request removed successfully." });
  } catch (error) {
    console.error("Error removing request:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
// Accept friend request
export const friendRequestAccept = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const fromUserId = req.params.id;

    const fromUser = await User.findById(fromUserId);
    if (!fromUser) return res.status(404).json({ error: "User not found" });

    // Find and update the pending friendship
    const friendship = await Friendship.findOneAndUpdate(
      {
        userId: fromUserId,
        friendId: currentUserId,
        status: "pending"
      },
      { status: "accepted" },
      { new: true }
    );

    if (!friendship) {
      return res.status(400).json({ error: "No such friend request" });
    }

    // Create reverse friendship for bidirectional relationship
    await Friendship.create({
      userId: currentUserId,
      friendId: fromUserId,
      status: "accepted"
    });

    // Update friends count
    await User.findByIdAndUpdate(currentUserId, { $inc: { friendsCount: 1 } });
    await User.findByIdAndUpdate(fromUserId, { $inc: { friendsCount: 1 } });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    console.error("Error accepting friend request:", err);
    res.status(500).json({ error: "Server error" });
  }
}
// Reject friend request or remove friend
export const friendRejected = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.id;

    const otherUser = await User.findById(otherUserId);
    if (!otherUser) return res.status(404).json({ error: "User not found" });

    // Delete all friendships between these users
    const result = await Friendship.deleteMany({
      $or: [
        { userId: currentUserId, friendId: otherUserId },
        { userId: otherUserId, friendId: currentUserId }
      ]
    });

    // Update friends count if they were friends
    if (result.deletedCount > 0) {
      const wasAccepted = await Friendship.findOne({
        $or: [
          { userId: currentUserId, friendId: otherUserId, status: "accepted" },
          { userId: otherUserId, friendId: currentUserId, status: "accepted" }
        ]
      });

      if (wasAccepted) {
        await User.findByIdAndUpdate(currentUserId, { $inc: { friendsCount: -1 } });
        await User.findByIdAndUpdate(otherUserId, { $inc: { friendsCount: -1 } });
      }
    }

    res.status(200).json({ message: "Friend removed/rejected" });
  } catch (err) {
    console.error("Error rejecting/removing friend:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// Get all received friend requests with cursor pagination
export const getAllrequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cursor, limit = 20 } = req.query;

    const query = {
      friendId: userId,
      status: "pending"
    };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const requests = await Friendship.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) + 1)
      .populate('userId', '_id fullname email profilePicture');

    const hasMore = requests.length > limit;
    const receivedRequests = requests.slice(0, limit).map(r => r.userId);
    const nextCursor = hasMore ? requests[limit - 1].createdAt : null;

    res.status(200).json({
      requests: receivedRequests,
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({
      message: "Failed to fetch friend requests",
      error: error.message,
    });
  }
};



// Get all sent friend requests with cursor pagination
export const getAllsendRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cursor, limit = 20 } = req.query;

    const query = {
      userId: userId,
      status: "pending"
    };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const requests = await Friendship.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) + 1)
      .populate('friendId', '_id fullname email profilePicture');

    const hasMore = requests.length > limit;
    const sentRequests = requests.slice(0, limit).map(r => r.friendId);
    const nextCursor = hasMore ? requests[limit - 1].createdAt : null;

    res.status(200).json({
      requests: sentRequests,
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error("Error fetching sent requests:", error);
    res.status(500).json({ message: "Failed to fetch send request", error });
  }
}

// Mark messages as read when user opens chat
export const markMessagesAsRead = async (req, res) => {
  try {
    const receiverId = req.user._id;
    const senderId = req.params.id;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }

    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Create chatId
    const chatId = [receiverId.toString(), senderId].sort().join('_');

    // Mark unread messages from sender as read
    const result = await Message.updateMany(
      {
        chatId: chatId,
        senderId: new mongoose.Types.ObjectId(senderId),
        read: false
      },
      { $set: { read: true } }
    );

    res.status(200).json({
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error);
    res.status(500).json({
      message: "Failed to mark messages as read",
      error: error.message || "Unknown error"
    });
  }
}
