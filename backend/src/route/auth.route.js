import express from 'express';
const router = express.Router();
import {signup, login,logout, updateProfile,checkAuth} from '../controllers/auth.controllers.js';
router.post('/signup',signup);
router.post('/login',login);
router.post('/logout',logout);
import { protectRoute } from '../middleware/auth.protectRoute.js';
router.put("/update-profile", protectRoute, updateProfile);
router.get("/check", protectRoute, checkAuth);


export default router;