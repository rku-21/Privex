import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dropIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Drop old email and phone indexes
    try {
      await db.collection('users').dropIndex('email_1');
      console.log('✓ Dropped email_1 index');
    } catch (err) {
      console.log('email_1 index does not exist or already dropped');
    }
    
    try {
      await db.collection('users').dropIndex('phone_1');
      console.log('✓ Dropped phone_1 index');
    } catch (err) {
      console.log('phone_1 index does not exist or already dropped');
    }
    
    console.log('\nIndexes dropped successfully! Now restart your server.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

dropIndexes();
