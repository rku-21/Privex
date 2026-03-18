import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import Friendship from '../models/friendShip.model.js';
import PendingSignup from '../models/pendingSignup.model.js';
import Message from '../models/message.model.js';

dotenv.config();

/**
 * Complete Database Cleanup Script
 * 
 * This will:
 * 1. Delete ALL users
 * 2. Delete ALL friendships
 * 3. Delete ALL pending signups
 * 4. Delete ALL messages
 * 5. Drop all collections to ensure clean schema
 */

const cleanDatabase = async () => {
  try {
    console.log('🚨 WARNING: This will DELETE ALL DATA from the database!\n');
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get counts before deletion
    const userCount = await User.countDocuments();
    const friendshipCount = await Friendship.countDocuments();
    const pendingCount = await PendingSignup.countDocuments();
    const messageCount = await Message.countDocuments();

    console.log('📊 Current Database State:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Friendships: ${friendshipCount}`);
    console.log(`   - Pending Signups: ${pendingCount}`);
    console.log(`   - Messages: ${messageCount}\n`);

    // Delete all documents
    console.log('🗑️  Deleting all data...\n');

    console.log('🗑️  Deleting messages...');
    await Message.deleteMany({});
    console.log('✅ All messages deleted');

    console.log('🗑️  Deleting friendships...');
    // await Friendship.deleteMany({});
    console.log('✅ All friendships deleted');

    console.log('🗑️  Deleting pending signups...');
    // await PendingSignup.deleteMany({});
    console.log('✅ All pending signups deleted');

    console.log('🗑️  Deleting users...');
    // await User.deleteMany({});
    console.log('✅ All users deleted\n');

    // Drop collections to ensure clean schema
    console.log('🔨 Dropping collections to reset schema...\n');

    try {
      await mongoose.connection.db.dropCollection('users');
      console.log('✅ Users collection dropped');
    } catch (err) {
      if (err.message.includes('ns not found')) {
        console.log('⏭️  Users collection already dropped');
      }
    }

    try {
      await mongoose.connection.db.dropCollection('friendships');
      console.log('✅ Friendships collection dropped');
    } catch (err) {
      if (err.message.includes('ns not found')) {
        console.log('⏭️  Friendships collection already dropped');
      }
    }

    try {
      await mongoose.connection.db.dropCollection('pendingsignups');
      console.log('✅ Pending signups collection dropped');
    } catch (err) {
      if (err.message.includes('ns not found')) {
        console.log('⏭️  Pending signups collection already dropped');
      }
    }

    try {
      await mongoose.connection.db.dropCollection('messages');
      console.log('✅ Messages collection dropped');
    } catch (err) {
      if (err.message.includes('ns not found')) {
        console.log('⏭️  Messages collection already dropped');
      }
    }

    console.log('\n🎉 Database cleaned successfully!\n');
    console.log('📋 Summary:');
    console.log(`   ✅ Deleted ${userCount} users`);
    console.log(`   ✅ Deleted ${friendshipCount} friendships`);
    console.log(`   ✅ Deleted ${pendingCount} pending signups`);
    console.log(`   ✅ Deleted ${messageCount} messages`);
    console.log('   ✅ All collections dropped and reset\n');
    console.log('🚀 Database is now clean and ready for fresh data!');
    console.log('💡 Next: Create new users via signup or seed script\n');

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run cleanup
console.log('🚀 Starting Complete Database Cleanup\n');
console.log('⚠️  This action cannot be undone!\n');

cleanDatabase();
