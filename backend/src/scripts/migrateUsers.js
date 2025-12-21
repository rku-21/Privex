import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import Friendship from '../models/friendShip.model.js';

dotenv.config();

const migrateUsers = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📋 Starting user migration...');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);

    let migratedCount = 0;
    let friendshipCount = 0;

    for (const user of users) {
      console.log(`\n👤 Migrating user: ${user.fullname} (${user.email})`);

      // Count existing friendships for this user
      const existingFriendshipsCount = await Friendship.countDocuments({
        userId: user._id,
        status: 'accepted'
      });

      // If user has old friends array and no friendships in new collection, migrate them
      if (user.friends && user.friends.length > 0 && existingFriendshipsCount === 0) {
        console.log(`  📤 Migrating ${user.friends.length} friends to Friendship collection...`);
        
        for (const friendId of user.friends) {
          // Check if friendship already exists
          const exists = await Friendship.findOne({
            $or: [
              { userId: user._id, friendId: friendId },
              { userId: friendId, friendId: user._id }
            ]
          });

          if (!exists) {
            // Create friendship
            await Friendship.create({
              userId: user._id,
              friendId: friendId,
              status: 'accepted'
            });
            friendshipCount++;
          }
        }
      }

      // Calculate friendsCount from Friendship collection
      const actualFriendsCount = await Friendship.countDocuments({
        userId: user._id,
        status: 'accepted'
      });

      // Update user: remove old fields and set friendsCount
      await User.updateOne(
        { _id: user._id },
        {
          $unset: {
            friends: "",
            friendRequests: ""
          },
          $set: {
            friendsCount: actualFriendsCount
          }
        }
      );

      console.log(`  ✅ Updated user - friendsCount: ${actualFriendsCount}`);
      migratedCount++;
    }

    console.log('\n✅ Migration completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Users migrated: ${migratedCount}`);
    console.log(`   - Friendships created: ${friendshipCount}`);

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateUsers();
