import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,   
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
export const login = async(req, res) => {
    const {email, password}=req.body;
    try {
        if(!email || ! password){
            return res.status(400).json({message:"Please fill all the fields"});
        }
        const user= await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"invalid credentials"});
        }
        const ispasswordMatch = await bcrypt.compare(password, user.password);
        if(!ispasswordMatch){
            return res.status(400).json({message:"invalid credentials"});
        }
        //agar user exist karta hai toh give him token 
        const token=generateToken(user.id, res);
       

        return res.status(200).json({
            message: "Login successfully",
            _id: user._id,
            email: user.email,
            fullname: user.fullname,
            profilePicture: user.profilePicture,
            friends:user.friends,
             friendRequests:user.friendRequests,
           });
     }
     catch(error) {
        return res.status(500).json({ message: "Internal server error", error });
    }

  
}


export const signup = async(req, res) => {

    const { fullname, email,  password, profilepic } = req.body;
    try {
        if(!fullname || !email ||!password){
            return res.status(400).json({message:"please fill all the fields"});
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
        const user= await User.findOne({email});
        if(user){
            return res.status(400).json({message: "User already exists with this email"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password, salt);


     
        const newUser=new User({
            email:email,
            fullname:fullname,
            password:hashedPassword,
            profilePicture:profilepic || "",
            friends:[],
            friendRequests:{
               sents:[],
               receiveds:[],

            },
            
        });

       if(newUser){
           
            const token =generateToken(newUser._id, res);
            try {
                   const privexUser = await User.findOne({ email: "privex@chat.com" });
               if (!newUser.friends.includes(privexUser._id)) {
                newUser.friends.push(privexUser._id);
                }
                if (!privexUser.friends.includes(newUser._id)) {
                    privexUser.friends.push(newUser._id);
                        await privexUser.save();
                }
                   await newUser.save();



            return res.status(201).json({
                message: "User created successfully",
                   _id: newUser._id,
                    email: newUser.email,
                    fullname: newUser.fullname,
                    profilePicture: newUser.profilePicture,
                    friends:newUser.friends,
                    friendRequests:newUser.friendRequests,
        
            });
            

            }catch(error){

            }
         
             

        }
        else {
            return res.status(500).json({message:"Internal server error , please try again Later"});
        }

    }    
    catch(error){
        return res.status(500).json(error);
    }
 
}
export const logout = (req, res) => {
    try {
        res.cookie("jwt", "",{maxAge:0});
        res.status(200).json({message: "Logged out  successfully ! visit again "});
    }
    catch(error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
    
}
export const updateProfile=async (req,res )=> {
    try {
        const {profilePicture}=req.body;
        const userId=req.user._id; 
        if (!profilePicture) {
            return res.status(400).json({message:"please provide a profile picture"});
        }
         const uploadResponse=await cloudinary.uploader.upload(profilePicture);
        //  cloudinary ek secure_url deta hai jisse hum profile picture ke liye use kar sakte hain
        const updatedUser=await User.findByIdAndUpdate(
            userId, 
            { profilePicture: uploadResponse.secure_url},
            {new:true}
         );
         res.status(200).json(updatedUser);
    }
    catch(error) {

        return res.status(500).json({ message: "Internal server error", error });
    }
}


export const checkAuth=(req, res) => {
    try {
        
        res.status(200).json(req.user);
    }
    catch(error) {

        return res.status(500).json({ message: "Internal server error", error });
    }
}

