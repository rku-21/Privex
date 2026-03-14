import "dotenv/config";
import express from 'express';
import { connectDB } from './lib/db.js';
import cookieParser from 'cookie-parser';
import { protectRoute } from './middleware/auth.protectRoute.js';
import cors from "cors";
import path from "path";
// import { checkRedisHealth } from "./lib/redis.js";
import {app, server} from "./lib/socket.js";
const __dirname = path.resolve();
const port = process.env.PORT || 5001;


import authRoutes from './route/auth.route.js';
import messageRoutes from './route/message.route.js';
import { testEmailService } from './lib/emailService.js';




app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.NODE_ENV === "production" 
      ? true
      : ["http://localhost:5173","http://localhost:5174"],
    credentials: true,
  })
);

// API routes 
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Health check
app.get("/api/health", async (req, res) => {
  try {
    const redisHealth = await checkRedisHealth();
    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      redis: redisHealth,
      email: {
        configured: emailConfigured,
        user: emailConfigured ? process.env.EMAIL_USER.substring(0, 3) + '***' : 'not set'
      },
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message
    });
  }
});

if (process.env.NODE_ENV === "production") {
  const frontendPath = path.resolve(
    process.cwd(),
    "..",
    "frontend",
    "chat_app",
    "dist"
  );

  console.log("Serving frontend from:", frontendPath);

  app.use(express.static(frontendPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}




app.use((err, req, res, next) => {
  console.error('Server Error', err);
  res.status(500).json({ error: 'Internal server error' });
});

console.log('Starting server...');
if (!process.env.BREVO_API_KEY) {
  console.error('Email servie not configured');
 } else {
  console.log('email service configured');
}

server.listen(port, '0.0.0.0', async () => {
   console.log(`server is listening on ${port}`)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    await testEmailService();
  }
  connectDB().catch(err => {
    console.error('Database connection failed', err.message);
  });
});


