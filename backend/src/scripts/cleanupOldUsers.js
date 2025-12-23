import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import Friendship from '../models/friendShip.model.js';

dotenv.config();

/**
 * Migration Script: Clean up old user schema fields
 * 
 * Removes deprecated fields from User documents:
 * - friends (Array) - moved to Friendship collection
 * - friendRequests (Object) - moved to Friendship collection
 * 
 * Also recalculates friendsCount based on actual friendships
 */

const cleanupOldUsers = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to check\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      const userDoc = user.toObject();
      let needsUpdate = false;
      const updates = {};

      // Check for old fields
      if ('friends' in userDoc) {
        console.log(`🗑️  User ${user.email} has old 'friends' field (${userDoc.friends?.length || 0} items)`);
        needsUpdate = true;
      }

      if ('friendRequests' in userDoc) {
        console.log(`🗑️  User ${user.email} has old 'friendRequests' field`);
        needsUpdate = true;
      }

      // Recalculate friendsCount based on Friendship collection
      const actualFriendsCount = await Friendship.countDocuments({
        $or: [
          { userId: user._id, status: 'accepted' },
          { friendId: user._id, status: 'accepted' }
        ]
      });

      if (userDoc.friendsCount !== actualFriendsCount) {
        console.log(`📊 User ${user.email}: friendsCount ${userDoc.friendsCount} → ${actualFriendsCount}`);
        updates.friendsCount = actualFriendsCount;
        needsUpdate = true;
      }

      if (needsUpdate) {
        // Remove old fields using $unset
        const unsetFields = {};
        if ('friends' in userDoc) unsetFields.friends = 1;
        if ('friendRequests' in userDoc) unsetFields.friendRequests = 1;

        await User.updateOne(
          { _id: user._id },
          {
            $unset: unsetFields,
            $set: updates
          }
        );

        console.log(`✅ Cleaned up user: ${user.email}\n`);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updatedCount} users`);
    console.log(`   ⏭️  Skipped: ${skippedCount} users (already clean)`);
    console.log('   🎉 Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run migration
console.log('🚀 Starting User Schema Cleanup Migration\n');
cleanupOldUsers();
