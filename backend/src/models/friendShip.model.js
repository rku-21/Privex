import mongoose from "mongoose";

const friendshipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  friendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "accepted"],
    default: "pending",
    index: true
  }
}, { timestamps: true });

// Compound indexes for efficient queries
friendshipSchema.index({ userId: 1, status: 1, createdAt: -1 }); // For cursor-based pagination
friendshipSchema.index({ friendId: 1, status: 1 }); // For finding incoming requests
friendshipSchema.index({ userId: 1, friendId: 1 }, { unique: true }); // Prevent duplicates

const Friendship = mongoose.model("Friendship", friendshipSchema);

export default Friendship;

