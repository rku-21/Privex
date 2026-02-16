import mongoose from "mongoose";

const pendingSignupSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  fullname: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // automatically delete after 10 min
  }
});

const PendingSignup = mongoose.model("PendingSignup", pendingSignupSchema);

export default PendingSignup;
