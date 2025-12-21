import express from 'express';
const router = express.Router();
import {signup, login, logout, updateProfile, checkAuth, requestSignup, verifySignup, resendOTP} from '../controllers/auth.controllers.js';
import { protectRoute } from '../middleware/auth.protectRoute.js';

// OTP-based signup routes
router.post('/request-signup', requestSignup);
router.post('/verify-signup', verifySignup);
router.post('/resend-otp', resendOTP);

// Legacy signup (keep for backward compatibility)
router.post('/signup', signup);

router.post('/login', login);
router.post('/logout', logout);
router.put("/update-profile", protectRoute, updateProfile);
router.get("/check", protectRoute, checkAuth);


export default router;