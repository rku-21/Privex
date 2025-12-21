import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    trim: true
  },
  image: {
    type: String,
  },
  video: {
    type: String,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Compound index for cursor-based pagination (sort by newest first)
messageSchema.index({ chatId: 1, createdAt: -1 });

// Index for unread messages count
messageSchema.index({ chatId: 1, read: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
