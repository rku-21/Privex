import mongoose from 'mongoose';
export const connectDB = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        return conn;
    } catch(error) {
        console.error('❌ MongoDB connection error:', error.message);
        // Don't exit - let app continue with degraded functionality
        console.warn('⚠️ App will continue without database connection');
    }
}