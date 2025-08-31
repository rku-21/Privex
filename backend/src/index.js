import {app, server,io} from "./lib/socket.js";
import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './lib/db.js';
import cookieParser from 'cookie-parser';
import { protectRoute } from './middleware/auth.protectRoute.js';
import cors from "cors";


dotenv.config();

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



const port = process.env.PORT || 5001;


server.listen(5001, () => {
  console.log('Server is running on port number', port);
  connectDB();
});

app.use("/api/auth" ,authRoutes);
app.use("/api/messages", protectRoute, messageRoutes);

