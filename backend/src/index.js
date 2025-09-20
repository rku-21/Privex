import {app, server} from "./lib/socket.js";
import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './lib/db.js';
import cookieParser from 'cookie-parser';
import { protectRoute } from './middleware/auth.protectRoute.js';
import cors from "cors";
import path from "path";



dotenv.config();
const __dirname = path.resolve();


import authRoutes from './route/auth.route.js';
import messageRoutes from './route/message.route.js';




app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());



app.use(
  cors({
    origin:"http://localhost:5173",
    credentials: true,
  })
);



if(process.env.NODE_ENV === "production") {

  
 app.use((req, res, next) => {
  if (req.path === '/ping') return next();  // Skip static middleware for /ping
  express.static(path.join(__dirname, "../frontend/chat_app/dist"))(req, res, next);
});
-+
  app.get('/ping', (req, res) => res.status(200).send('OK'));



// Match everything EXCEPT /api routes
app.get(/^(?!\/api).*/, (req, res) => {
  
    res.sendFile(path.join(__dirname, "../frontend/chat_app/dist/index.html"));
});
} else {
  console.log('🛠️ Development environment detected');
}


app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});


const port = process.env.PORT || 5001;



app.use("/api/auth", authRoutes);



app.use("/api/messages", protectRoute, messageRoutes);


console.log('🎯 Step 8: Starting server...');
server.listen(port,'0.0.0.0', () => {
  console.log('✅ Server is running on port number', port);

  connectDB();
  
});


