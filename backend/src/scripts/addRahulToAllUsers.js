import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import Friendship from '../models/friendShip.model.js';

dotenv.config();

const addRahulToAllUsers = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Rahul Raj
    const rahul = await User.findOne({ email: "upadhyayrahul21642@gmail.com" });
    
    if (!rahul) {
      console.log('❌ Rahul Raj not found!');
      process.exit(1);
    }

    console.log(`👤 Found: ${rahul.fullname} (${rahul.email})`);
    console.log(`   ID: ${rahul._id}\n`);

    // Get all other users
    const allUsers = await User.find({ _id: { $ne: rahul._id } });
    console.log(`📋 Found ${allUsers.length} other users\n`);

    let friendshipsCreated = 0;
    let alreadyExists = 0;

    for (const user of allUsers) {
      // Check if friendship already exists
      const exists = await Friendship.findOne({
        $or: [
          { userId: rahul._id, friendId: user._id },
          { userId: user._id, friendId: rahul._id }
        ]
      });

      if (!exists) {
        // Create bidirectional friendship
        await Friendship.create({
          userId: rahul._id,
          friendId: user._id,
          status: 'accepted'
        });
        
        await Friendship.create({
          userId: user._id,
          friendId: rahul._id,
          status: 'accepted'
        });

        // Update friends count for both users
        await User.findByIdAndUpdate(rahul._id, { $inc: { friendsCount: 1 } });
        await User.findByIdAndUpdate(user._id, { $inc: { friendsCount: 1 } });

        console.log(`✅ Added friendship with: ${user.fullname}`);
        friendshipsCreated++;
      } else {
        console.log(`⏭️  Already friends with: ${user.fullname}`);
        alreadyExists++;
      }
    }

    console.log('\n✅ Process completed!');
    console.log(`📊 Summary:`);
    console.log(`   - New friendships created: ${friendshipsCreated}`);
    console.log(`   - Already existing: ${alreadyExists}`);
    console.log(`   - Total users processed: ${allUsers.length}`);

    // Get updated Rahul
    const updatedRahul = await User.findById(rahul._id);
    console.log(`\n👥 Rahul's total friends: ${updatedRahul.friendsCount}`);

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

addRahulToAllUsers();
