import { generateToken, generateOTP } from "../lib/utils.js";
import User from "../models/user.model.js";
import PendingSignup from "../models/pendingSignup.model.js";
import Friendship from "../models/friendShip.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { sendOTPEmail } from "../lib/emailService.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = generateToken(user.id, res);

        return res.status(200).json({
            message: "Login successfully",
            _id: user._id,
            email: user.email,
            fullname: user.fullname,
            profilePicture: user.profilePicture,
            coverPhoto: user.coverPhoto,
            about: user.about,
            friendsCount: user.friendsCount,
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
export const requestSignup = async (req, res) => {
    const { fullname, email, password, profilepic } = req.body;

    try {
        if (!email || !fullname || !password) {
            return res.status(400).json({ message: "Please provide email, fullname or password" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }


        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const otp = generateOTP();
        try {
            await sendOTPEmail(email, otp, fullname);
            console.log('OTP email sent successfully to:', email);
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError.message);
            return res.status(500).json({
                message: "Failed to send verification email",
                error: process.env.NODE_ENV === "development" ? emailError.message : undefined
            });
        }

        await PendingSignup.deleteOne({ email });
        await PendingSignup.create({
            email,
            fullname,
            password: hashedPassword,
            otp,
            profilePicture: profilepic || ""
        });

        return res.status(200).json({
            message: "OTP sent to your email. Please verify to complete signup.",
            email: email
        });

    } catch (error) {
        console.error("Error in requestSignup:", error);
        console.error("Error details:", {
            message: error.message,
            name: error.name,
            code: error.code
        });
        return res.status(500).json({
            message: "Failed to process request",
            error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
        });
    }
};

export const verifySignup = async (req, res) => {
    const { email, otp } = req.body;

    try {
        if (!email || !otp) {
            return res.status(400).json({ message: "Please provide email and OTP" });
        }
        const pendingSignup = await PendingSignup.findOne({ email });

        if (!pendingSignup) {
            return res.status(400).json({ message: "OTP expired or invalid  Please request a new one" });
        }

        // console.log(' Stored OTP:', pendingSignup.otp);
        // console.log(' Received OTP:', otp.trim());
        // console.log(' OTPs match:', pendingSignup.otp === otp.trim());
        // console.log('Stored OTP type:', typeof pendingSignup.otp);
        // console.log(' Received OTP type:', typeof otp);


        const storedOTP = String(pendingSignup.otp).trim();
        const receivedOTP = String(otp).trim();

        if (storedOTP !== receivedOTP) {
            return res.status(400).json({ message: "Invalid OTP  Please try again !" });
        }


        const newUser = new User({
            email: pendingSignup.email,
            fullname: pendingSignup.fullname,
            password: pendingSignup.password,
            profilePicture: pendingSignup.profilePicture
        });
        await newUser.save();
        const privexUser = await User.findOne({ email: "privex@chat.com" });
        if (privexUser) {
            await Friendship.create({
                userId: newUser._id,
                friendId: privexUser._id,
                status: "accepted"
            });
            await Friendship.create({
                userId: privexUser._id,
                friendId: newUser._id,
                status: "accepted"
            });

            await User.findByIdAndUpdate(newUser._id, { $inc: { friendsCount: 1 } });
            await User.findByIdAndUpdate(privexUser._id, { $inc: { friendsCount: 1 } });
        }


        await PendingSignup.deleteOne({ email });


        generateToken(newUser._id, res);

        return res.status(201).json({
            message: "Account created successfully",
            _id: newUser._id,
            email: newUser.email,
            fullname: newUser.fullname,
            profilePicture: newUser.profilePicture,
            coverPhoto: newUser.coverPhoto,
            about: newUser.about,
            friendsCount: newUser.friendsCount,
        });

    } catch (error) {
        return res.status(500).json({ message: "Failed to verify OTP", error: error.message });
    }
};


export const resendOTP = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ message: "Please provide email" });
        }
        const pendingSignup = await PendingSignup.findOne({ email });

        if (!pendingSignup) {
            return res.status(400).json({ message: "No pending request is found with this email" });
        }


        const otp = generateOTP();
        pendingSignup.otp = otp;
        pendingSignup.createdAt = Date.now();
        await pendingSignup.save();
        await sendOTPEmail(email, otp, pendingSignup.fullname);
        return res.status(200).json({
            message: "new otp is sended"
        });

    } catch (error) {
        return res.status(500).json({ message: "Failed", error: error.message });
    }
};
export const signup = async (req, res) => {

    const { fullname, email, password, profilepic } = req.body;
    try {
        if (!email || !fullname || !password) {
            return res.status(400).json({ message: "no credentials provided" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "password must be > 6 char" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "user already exist with this email" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            fullname: fullname,
            email: email,
            password: hashedPassword,
            profilePicture: profilepic || "",
        });

        if (newUser) {

            const token = generateToken(newUser._id, res);
            try {
                await newUser.save();
                const privexUser = await User.findOne({ email: "privex@chat.com" });
                if (privexUser) {

                    await Friendship.create({
                        userId: newUser._id,
                        friendId: privexUser._id,
                        status: "accepted"
                    });
                    await Friendship.create({
                        userId: privexUser._id,
                        friendId: newUser._id,
                        status: "accepted"
                    });
                    await User.findByIdAndUpdate(newUser._id, { $inc: { friendsCount: 1 } });
                    await User.findByIdAndUpdate(privexUser._id, { $inc: { friendsCount: 1 } });
                }

                return res.status(201).json({
                    message: "User created successfully",
                    _id: newUser._id,
                    email: newUser.email,
                    fullname: newUser.fullname,
                    profilePicture: newUser.profilePicture,
                    coverPhoto: newUser.coverPhoto,
                    about: newUser.about,
                    friendsCount: newUser.friendsCount,
                });

            } catch (error) {
                return res.status(500).json({ message: "error in signup", error: error.message });
            }
        }
        else {
            return res.status(500).json({ message: "Internal server error" });
        }

    }
    catch (error) {
        return res.status(500).json(error);
    }

}
export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged  out  successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }

}

const updateRateLimits = new Map();
const MAX_UPDATES_PER_HOUR = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const MAX_CONCURRENT_UPDATES = 50;
let activeUpdates = 0;


setInterval(() => {
    const now = Date.now();
    const expiredKeys = [];

    for (const [userId, data] of updateRateLimits.entries()) {
        if (now > data.resetTime) {
            expiredKeys.push(userId);
        }
    }

    expiredKeys.forEach(key => updateRateLimits.delete(key));

    if (expiredKeys.length > 0) {
        console.log(`Cleaned up ${expiredKeys.length} exprie rate limit entries`);
    }
}, 10 * 60 * 1000);

export const updateProfile = async (req, res) => {
    try {
        const { profilePicture, coverPhoto, about, fullname, email, phone } = req.body;
        const userId = req.user._id;
        if (activeUpdates >= MAX_CONCURRENT_UPDATES) {
            return res.status(503).json({
                message: "Server is busy , Please try again in a moment",
                retryAfter: 5000
            });
        }

        activeUpdates++;

        try {

            if (fullname || email || phone || about !== undefined) {
                const now = Date.now();
                const userLimit = updateRateLimits.get(userId.toString());

                if (userLimit) {
                    if (now < userLimit.resetTime) {
                        if (userLimit.count >= MAX_UPDATES_PER_HOUR) {
                            const waitMinutes = Math.ceil((userLimit.resetTime - now) / 60000);
                            return res.status(429).json({
                                message: `Too many updates, Please wait ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''} before trying again`,
                                retryAfter: userLimit.resetTime
                            });
                        }
                        userLimit.count++;
                    } else {

                        updateRateLimits.set(userId.toString(), {
                            count: 1,
                            resetTime: now + RATE_LIMIT_WINDOW
                        });
                    }
                } else {

                    updateRateLimits.set(userId.toString(), {
                        count: 1,
                        resetTime: now + RATE_LIMIT_WINDOW
                    });
                }
            }

            let updateData = {};


            if (profilePicture) {
                const uploadResponse = await cloudinary.uploader.upload(profilePicture);
                updateData.profilePicture = uploadResponse.secure_url;
            }


            if (coverPhoto) {
                const uploadResponse = await cloudinary.uploader.upload(coverPhoto);
                updateData.coverPhoto = uploadResponse.secure_url;
            }


            if (fullname !== undefined) {
                const trimmedName = fullname.trim();
                if (!trimmedName) {
                    return res.status(400).json({ message: "Name cannot be empty" });
                }
                if (trimmedName.length < 2) {
                    return res.status(400).json({ message: "Name cannot be less to 2 char" });
                }
                if (trimmedName.length > 50) {
                    return res.status(400).json({ message: "Name must be less than 50 characters" });
                }
                updateData.fullname = trimmedName;
            }


            if (email !== undefined) {
                const trimmedEmail = email.trim();
                if (!trimmedEmail) {
                    return res.status(400).json({ message: "Email cannot be empty" });
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(trimmedEmail)) {
                    return res.status(400).json({ message: "Invalid email format" });
                }
                const existingUser = await User.findOne({ email: trimmedEmail, _id: { $ne: userId } });
                if (existingUser) {
                    return res.status(400).json({ message: "Email already exist" });
                }
                updateData.email = trimmedEmail;
            }
            if (phone !== undefined) {
                const trimmedPhone = phone.trim();
                if (!trimmedPhone) {
                    return res.status(400).json({ message: "Phone cannot be empty" });
                }
                const phoneRegex = /^[0-9]{10,15}$/;
                if (!phoneRegex.test(trimmedPhone.replace(/[\s\-\(\)]/g, ''))) {
                    return res.status(400).json({ message: "Invalid phone number format" });
                }
                const existingUser = await User.findOne({ phone: trimmedPhone, _id: { $ne: userId } });
                if (existingUser) {
                    return res.status(400).json({ message: "Phone number already exist" });
                }
                updateData.phone = trimmedPhone;
            }
            if (about !== undefined) {
                if (about.length > 500) {
                    return res.status(400).json({ message: "Too many char in about section " });
                }
                updateData.about = about;
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ message: "No data provided to update" });
            }
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                updateData,
                { new: true }
            ).select("-password");

            res.status(200).json(updatedUser);
        } finally {

            activeUpdates--;
        }
    }
    catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}


export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
}

