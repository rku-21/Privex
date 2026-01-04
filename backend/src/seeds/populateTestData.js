import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import Friendship from '../models/friendShip.model.js';

dotenv.config();

// Fake user data
const maleNames = [
  'Rahul Sharma', 'Amit Kumar', 'Arjun Patel', 'Rohan Gupta', 'Vikram Singh',
  'Karan Verma', 'Aditya Reddy', 'Siddharth Joshi', 'Nikhil Mehta', 'Dev Kapoor',
  'Rajat Malhotra', 'Varun Nair', 'Aman Rao', 'Harsh Agarwal', 'Ayush Pandey',
  'Kunal Shah', 'Prateek Dubey', 'Shubham Jain', 'Vishal Desai', 'Akash Tiwari',
  'Yash Khanna', 'Rishi Bansal', 'Manish Sinha', 'Deepak Iyer', 'Ankit Choudhary'
];

const femaleNames = [
  'Priya Sharma', 'Ananya Singh', 'Sneha Patel', 'Neha Gupta', 'Riya Verma',
  'Pooja Reddy', 'Isha Joshi', 'Kavya Mehta', 'Diya Kapoor', 'Simran Malhotra',
  'Tanvi Nair', 'Aisha Rao', 'Shruti Agarwal', 'Nisha Pandey', 'Kriti Shah',
  'Aditi Dubey', 'Sakshi Jain', 'Megha Desai', 'Pallavi Tiwari', 'Anjali Khanna',
  'Ritika Bansal', 'Swati Sinha', 'Divya Iyer', 'Nikita Choudhary', 'Tanya Kapoor'
];

const maleProfilePics = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Karan&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Siddharth&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Nikhil&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Dev&backgroundColor=ffdfbf',
];

const femaleProfilePics = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Neha&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Riya&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Isha&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Kavya&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Diya&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Simran&backgroundColor=ffdfbf',
];

const sampleMessages = [
  "Hey! How are you doing?",
  "Great to connect with you!",
  "What's up?",
  "How was your day?",
  "Did you see the latest update?",
  "That's awesome!",
  "Sure, sounds good!",
  "Let's catch up soon",
  "Thanks for your help!",
  "See you later!",
  "Have a great day!",
  "LOL, that's funny!",
  "I agree with you",
  "What do you think?",
  "That makes sense",
  "Good morning!",
  "Good night!",
  "Take care!",
  "Talk to you soon",
  "Awesome! 🎉",
  "Perfect timing!",
  "You're right",
  "Interesting!",
  "Tell me more",
  "That's cool!"
];

const generateEmail = (name) => {
  const username = name.toLowerCase().replace(/\s+/g, '.');
  return `${username}${Math.floor(Math.random() * 1000)}@test.com`;
};

const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

async function populateTestData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing test data (optional - comment out if you want to keep existing data)
    console.log('🗑️ Clearing existing test users...');
    await User.deleteMany({ email: { $regex: '@test.com$' } });
    await Message.deleteMany({});
    await Friendship.deleteMany({});
    console.log('✅ Cleared test data');

    // Hash password once for all users
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    
    // Create users
    console.log('👥 Creating 50 test users...');
    const users = [];

    // Create 25 male users
    for (let i = 0; i < 25; i++) {
      const name = maleNames[i];
      const user = await User.create({
        fullname: name,
        email: generateEmail(name),
        password: hashedPassword,
        profilePicture: maleProfilePics[i % maleProfilePics.length],
        about: `Hi, I'm ${name.split(' ')[0]}! Love chatting and making new friends.`,
        friendsCount: 0
      });
      users.push(user);
      console.log(`✅ Created male user: ${name}`);
    }

    // Create 25 female users
    for (let i = 0; i < 25; i++) {
      const name = femaleNames[i];
      const user = await User.create({
        fullname: name,
        email: generateEmail(name),
        password: hashedPassword,
        profilePicture: femaleProfilePics[i % femaleProfilePics.length],
        about: `Hey! I'm ${name.split(' ')[0]}. Happy to be here!`,
        friendsCount: 0
      });
      users.push(user);
      console.log(`✅ Created female user: ${name}`);
    }

    console.log(`✅ Created ${users.length} users successfully!`);

    // Create friendships (each user gets 5-10 random friends)
    console.log('🤝 Creating friendships...');
    const friendshipPairs = new Set();
    
    for (const user of users) {
      const numFriends = Math.floor(Math.random() * 6) + 5; // 5-10 friends
      let friendsAdded = 0;
      
      while (friendsAdded < numFriends) {
        const randomFriend = getRandomElement(users);
        
        // Don't friend yourself and avoid duplicates
        if (randomFriend._id.toString() !== user._id.toString()) {
          const pairKey = [user._id.toString(), randomFriend._id.toString()].sort().join('-');
          
          if (!friendshipPairs.has(pairKey)) {
            // Create friendship in both directions
            await Friendship.create({
              userId: user._id,
              friendId: randomFriend._id,
              status: 'accepted'
            });
            
            await Friendship.create({
              userId: randomFriend._id,
              friendId: user._id,
              status: 'accepted'
            });
            
            // Update friend counts
            await User.findByIdAndUpdate(user._id, { $inc: { friendsCount: 1 } });
            await User.findByIdAndUpdate(randomFriend._id, { $inc: { friendsCount: 1 } });
            
            friendshipPairs.add(pairKey);
            friendsAdded++;
          }
        }
      }
    }
    
    console.log(`✅ Created ${friendshipPairs.size} friendships!`);

    // Create messages between friends
    console.log('💬 Creating messages between friends...');
    let messageCount = 0;
    
    for (const user of users) {
      // Get user's friends
      const friendships = await Friendship.find({ 
        userId: user._id, 
        status: 'accepted' 
      }).limit(5); // Message with 5 random friends
      
      for (const friendship of friendships) {
        // Generate chatId (sorted IDs to ensure consistency)
        const chatId = [user._id.toString(), friendship.friendId.toString()]
          .sort()
          .join('-');
        
        // Create 3-8 messages in conversation
        const numMessages = Math.floor(Math.random() * 6) + 3;
        
        for (let i = 0; i < numMessages; i++) {
          const isFromUser = Math.random() > 0.5;
          
          await Message.create({
            chatId: chatId,
            senderId: isFromUser ? user._id : friendship.friendId,
            text: getRandomElement(sampleMessages),
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time in last 7 days
          });
          
          messageCount++;
        }
      }
    }
    
    console.log(`✅ Created ${messageCount} messages!`);

    console.log('\n🎉 Test data population complete!');
    console.log(`📊 Summary:`);
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🤝 Friendships: ${friendshipPairs.size * 2} (bidirectional)`);
    console.log(`   💬 Messages: ${messageCount}`);
    console.log(`\n🔑 Test Login Credentials:`);
    console.log(`   Email: ${users[0].email}`);
    console.log(`   Password: Test@123`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error populating test data:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

populateTestData();
