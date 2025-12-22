import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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
    required: true,
    minlength: 6 
  },
  profilePicture: { 
    type: String, 
    default: "" 
  },
  coverPhoto: { 
    type: String, 
    default: "" 
  },
  about: { 
    type: String, 
    default: "I am on Privex" 
  },
  friendsCount: { 
    type: Number, 
    default: 0 
  },
}, { 
  timestamps: true,
  strict: true, // 🔥 Prevent saving fields not in schema
  strictQuery: true // 🔥 Also apply to queries
});

// 🔥 Pre-save hook to remove deprecated fields
userSchema.pre('save', function(next) {
  // Remove old schema fields if they somehow got added
  if (this.friends !== undefined) {
    this.friends = undefined;
  }
  if (this.friendRequests !== undefined) {
    this.friendRequests = undefined;
  }
  next();
});

// 🔥 Pre-update hook to remove deprecated fields from updates
userSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.$set) {
    delete update.$set.friends;
    delete update.$set.friendRequests;
  }
  next();
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;

