import {app, server, io} from "./lib/socket.js";
import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './lib/db.js';
import cookieParser from 'cookie-parser';
import { protectRoute } from './middleware/auth.protectRoute.js';
import cors from "cors";
import path from "path";

console.log('🚀 Step 1: Starting server initialization...');
console.log('Node version:', process.version);

dotenv.config();
const __dirname = path.resolve();

console.log('📦 Step 2: Importing route files...');
import authRoutes from './route/auth.route.js';
import messageRoutes from './route/message.route.js';
console.log('✅ Routes imported successfully');

console.log('⚙️ Step 3: Setting up middleware...');
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
console.log('✅ Middleware setup complete');

console.log('🌐 Step 4: Configuring CORS...');
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
console.log('✅ CORS configured');

console.log('🏗️ Step 5: Checking environment for production setup...');
if(process.env.NODE_ENV === "production") {
  console.log('🔧 Production environment detected');
  console.log('📁 Setting up static file serving...');
  app.use(express.static(path.join(__dirname, "../frontend/chat_app/dist")));
  console.log('✅ Static files configured');

  console.log('🔄 Setting up catch-all route for SPA...');
  // FIXED: Changed from "/*" to "*"
  app.get("*", (req, res) => {
    console.log('📤 Serving index.html for path:', req.path);
    res.sendFile(path.join(__dirname, "../frontend/chat_app/dist/index.html"));
  });
  console.log('✅ Catch-all route configured');
} else {
  console.log('🛠️ Development environment detected');
}

console.log('🚨 Step 6: Setting up error handling middleware...');
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
console.log('✅ Error handler configured');

const port = process.env.PORT || 5001;

console.log('🔌 Step 7: Setting up route handlers...');
console.log('🛣️ Mounting auth routes...');
app.use("/api/auth", authRoutes);
console.log('✅ Auth routes mounted');

console.log('🛣️ Mounting message routes...');
app.use("/api/messages", protectRoute, messageRoutes);
console.log('✅ Message routes mounted');

console.log('🎯 Step 8: Starting server...');
server.listen(port, () => {
  console.log('✅ Server is running on port number', port);
  console.log('🗄️ Connecting to database...');
  connectDB();
  console.log('🎉 Server startup complete!');
});

console.log('📋 Step 9: Server initialization sequence complete');
console.log('==================================================');

