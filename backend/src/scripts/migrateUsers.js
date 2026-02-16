import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Friendship from "../models/friendShip.model.js";

dotenv.config();

const migrateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const users = await User.find({});
    let migratedCount = 0;
    let friendshipCount = 0;

    for (const user of users) {
      const existingFriendshipsCount = await Friendship.countDocuments({
        userId: user._id,
        status: "accepted",
      });

      if (user.friends && user.friends.length > 0 && existingFriendshipsCount === 0) {
        for (const friendId of user.friends) {
          const exists = await Friendship.findOne({
            $or: [
              { userId: user._id, friendId: friendId },
              { userId: friendId, friendId: user._id },
            ],
          });

          if (!exists) {
            await Friendship.create({
              userId: user._id,
              friendId: friendId,
              status: "accepted",
            });
            friendshipCount++;
          }
        }
      }

      const actualFriendsCount = await Friendship.countDocuments({
        userId: user._id,
        status: "accepted",
      });

      await User.updateOne(
        { _id: user._id },
        {
          $unset: {
            friends: "",
            friendRequests: "",
          },
          $set: {
            friendsCount: actualFriendsCount,
          },
        }
      );

      migratedCount++;
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

migrateUsers();
