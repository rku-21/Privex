import React, { useRef, useEffect, useState } from "react";
import { Send, Phone, Video, Paperclip, X, Check, LoaderCircle } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useQueryPagination } from "../../store/useQueryPagination";
import { useAuthStore } from "../../store/useAuthStore";
import { formatMessageTime } from "../../lib/utlis";
import { useThemeStore } from "../../store/useThemeStore";
import toast from "react-hot-toast";
import MessageSkeleton from "../../Skeleton/MessagesSkelton";
import { useCallStore } from "../../store/useCallStore";
import { axiosInstance } from "../../lib/axios";
import Menu from "../Menu.jsx";

const ChatContainer = () => {
  const { authUser, onlineUsers, socket, UserStatus } = useAuthStore();
  const { initiateCall } = useCallStore();
  const { theme } = useThemeStore();
  const { selectedUser, sendMessages, setselectedUser } = useChatStore();
  const { messages, getMessages, isMessagesLoding } = useQueryPagination();

  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [menuMessage, setMenuMessage] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const userId = typeof selectedUser === "string" ? selectedUser : selectedUser?._id;

  const isOnline =
    (typeof selectedUser !== "string" && selectedUser?.fullname === "Privex Bot") ||
    onlineUsers?.includes(userId);

  const selectedUserStatus =
    selectedUser?.fullname === "Privex Bot"
      ? "Online"
      : UserStatus?.[userId] === "typing" && isOnline
        ? "Typing..."
        : isOnline
          ? "Online"
          : "Offline";

  // scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // fetch messages when chat changes
  useEffect(() => {
    if (!userId) return;
    getMessages(userId);
  }, [userId, getMessages]);

  // mark as read when chat opens
  useEffect(() => {
    if (!userId) return;

    const markMessagesAsRead = async () => {
      try {
        await axiosInstance.post(`/messages/${userId}/read`);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markMessagesAsRead();
  }, [userId]);

  // cleanup typing on unmount / chat change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (socket && isTyping && authUser && userId) {
        socket.emit("stopTyping", { typerUserId: authUser._id, receiverUserId: userId });
      }
    };
  }, [socket, isTyping, authUser, userId]);

  // close context menu on outside click
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = () => {
      setShowMenu(false);
      setMenuMessage(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showMenu]);

  const handleAudioCall = () => {
    if (!selectedUser) return toast.error("Please select a user first.");
    if (!isOnline) return toast.error("User is offline.");

    toast.success("Starting audio call");
    initiateCall(userId, "audio");
  };

  const handleVideoCall = () => {
    if (!selectedUser) return toast.error("Please select a user first.");
    if (!isOnline) return toast.error("User is offline.");

    toast.success("Starting video call");
    initiateCall(userId, "video");
  };

  const handleCloseChat = () => {
    setselectedUser(null);
  };
  
  const sizeExceed=(file)=>{
    return file?.size > 10 * 1024 * 1024;
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if(sizeExceed(file)){
      toast.error("file size cannot be more than 10mb");
      return;
    }

    const isImage = file.type?.startsWith("image/");
    const isVideo = file.type?.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Please select an image or video file");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    let fileType = null;
    if (imagePreview) {
      fileType = imagePreview.startsWith("data:video/") ? "video" : "image";
    }
    setImagePreview(null);
    try {
      const payload = { text: text.trim() };
      if (imagePreview && fileType) payload[fileType] = imagePreview;
      await sendMessages(payload);
      if (socket && isTyping && authUser && userId) {
        socket.emit("stopTyping", { typerUserId: authUser._id, receiverUserId: userId });
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      setIsTyping(false);
      setText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      console.error("Failed to send message");
      toast.error("Failed to send message!");
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);

    if (!socket || !authUser || !userId) return;

    if (!isTyping) {
      socket.emit("typing", { typerUserId: authUser._id, receiverUserId: userId });
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { typerUserId: authUser._id, receiverUserId: userId });
      setIsTyping(false);
    }, 3000);
  };

  const openContextMenu = (e, message) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuMessage(message);
    setShowMenu(true);
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    if (menuMessage) {
      setShowDeleteDialog(true);
    }
  };

  const confirmDelete = async () => {
    if (!menuMessage) return;
    try {
      await axiosInstance.delete(`/messages/${menuMessage._id}`);
      useQueryPagination.setState((state) => ({
        messages: state.messages.filter((m) => m._id !== menuMessage._id),
      }));
      toast.success("Message deleted");
    } catch (err) {
      console.error("Failed to delete message", err);
      toast.error("Failed to delete message");
    } finally {
      setShowDeleteDialog(false);
      setMenuMessage(null);
    }
  };

  const handleCopyMessage = () => {
    if (!menuMessage?.text) return;
    navigator.clipboard.writeText(menuMessage.text).then(() => {
      toast.success("Message copied");
    });
    setShowMenu(false);
  };

  const handleEditMessage = () => {
    // placeholder for future edit logic
    setShowMenu(false);
  };

  if (isMessagesLoding) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <MessageSkeleton />
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div
        className={`flex-1 flex items-center justify-center ${
          theme === "dark" ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <p
          className={`text-lg font-semibold ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Select a chat to start messaging
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 min-w-0 h-full flex flex-col transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      {showMenu && (
        <Menu
          x={menuPos.x}
          y={menuPos.y}
          onEdit={handleEditMessage}
          onCopy={handleCopyMessage}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Header */}
      <div
        className={`sticky top-0 z-40 backdrop-blur-xl border-b border-gray-200/50 p-4 shadow-sm ${
          theme === "dark" ? "bg-gray-800" : "bg-gray-100"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={selectedUser?.profilePicture || "/avatar.png"}
                alt={selectedUser?.fullname}
                className="w-12 h-12 rounded-full object-cover shadow-md"
              />
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div>
              <h2
                className={`text-lg font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                {selectedUser?.fullname}
              </h2>
              <p
                className={`text-sm font-medium ${
                  selectedUserStatus === "Typing..."
                    ? "text-green-500"
                    : selectedUserStatus === "Online"
                      ? "text-green-500"
                      : "text-gray-500"
                }`}
              >
                {selectedUserStatus}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* AUDIO CALL */}
            <button
              className={`p-3 rounded-full transition-all duration-200 ${
                !isOnline
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-110"
              }`}
              onClick={handleAudioCall}
              disabled={!isOnline}
              title="Audio Call"
            >
              <Phone
                className={`w-5 h-5 ${
                  theme === "dark" ? "text-white" : "text-gray-700"
                }`}
              />
            </button>

            {/* VIDEO CALL */}
            <button
              className={`p-3 rounded-full transition-all duration-200 ${
                !isOnline
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-110"
              }`}
              onClick={handleVideoCall}
              disabled={!isOnline}
              title="Video Call"
            >
              <Video
                className={`w-5 h-5 ${
                  theme === "dark" ? "text-white" : "text-gray-700"
                }`}
              />
            </button>

            {/* CLOSE CHAT */}
            <button
              className="p-3 hover:bg-gray-600 rounded-full transition-all duration-200 hover:scale-90"
              onClick={handleCloseChat}
              title="Close chat"
            >
              <i
                className={`fa-regular fa-circle-xmark text-2xl ${
                  theme === "dark" ? "fill-white" : ""
                }`}
              ></i>
            </button>
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      <div
        className={`flex-1 min-h-0 ${
          imagePreview ? "overflow-hidden p-0" : "overflow-y-auto p-6"
        } ${theme === "dark" ? "bg-stone-900" : "bg-gray-50"}`}
      >
        {imagePreview ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {imagePreview.startsWith("data:video/") ? (
              <video controls className="w-full h-full bg-black" src={imagePreview} />
            ) : (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            )}

            <button
              onClick={removeImage}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
              aria-label="Remove attachment"
            >
              <X className="size-5" />
            </button>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message._id}
                onContextMenu={(e) => openContextMenu(e, message)}
                className={`flex break-words ${
                  message.senderId === authUser._id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`w-auto px-4 py-3 rounded-2xl relative group max-w-xs lg:max-w-md ${
                    message.senderId === authUser._id
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                      : "bg-white/80 text-gray-800 border border-gray-200/50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  }`}
                >
                  {message.image && (
                    <div className="relative">
                      <img
                        src={message.image}
                        alt="Attachment"
                        className={`rounded-lg mb-2 max-h-64 object-cover transition-all duration-300 ${
                          message.status === "sending" ? "blur-sm opacity-30" : ""
                        }`}
                      />

                      {message.status === "sending" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}

                      {message.status === "failed" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/40 rounded-lg">
                          <span className="text-white text-xl font-bold">❌</span>
                        </div>
                      )}
                    </div>
                  )}

                  {message.video && (
                    <div className="relative">
                      <video
                        controls
                        src={message.video}
                        className={`rounded-lg mb-2 max-h-64 w-full bg-black transition-all duration-300 ${
                          message.status === "sending" ? "blur-sm opacity-30" : ""
                        }`}
                      />

                      {message.status === "sending" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}

                      {message.status === "failed" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/40 rounded-lg">
                          <span className="text-white text-xl font-bold">❌</span>
                        </div>
                      )}
                    </div>
                  )}

                  {message.text && <p className="text-sm">{message.text}</p>}

                  <div
                    className={`flex items-center justify-end mt-2 space-x-1 ${
                      message.senderId === authUser._id ? "text-white/70" : "text-gray-500"
                    }`}
                  >
                    {message.senderId === authUser._id && message.status === "sending" && (
                      <LoaderCircle className="w-3 h-3 animate-spin opacity-80" />
                    )}
                    {message.senderId === authUser._id && message.status === "sent" && (
                      <Check className="w-3.5 h-3.5 opacity-90" />
                    )}
                    {message.senderId === authUser._id && message.status === "seen" && (
                      <div className="flex -space-x-2">
                        <Check className="w-3.5 h-3.5 text-gray-900 opacity-90" />
                        <Check className="w-3.5 h-3.5 text-gray-900 opacity-90" />
                      </div>
                    )}
                    <span className="text-xs">{formatMessageTime(message.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && menuMessage && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-[9998]"
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className={`p-4 rounded-lg shadow-lg min-w-[280px] ${
              theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-sm">Delete this message for you?</p>
            <div className="flex justify-end space-x-2">
              <button
                className="px-3 py-1 text-sm rounded border border-gray-300"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 text-sm rounded bg-red-500 text-white"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* input block */}
      <div
        className={`sticky bottom-0 backdrop-blur-xl border-t border-gray-200/50 p-4 ${
          theme === "dark" ? "bg-gray-800" : "bg-gray-100"
        }`}
      >
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mb-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 hover:scale-110"
          >
            <Paperclip className="w-6 h-6 text-gray-500" />
          </button>
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (text.trim() || imagePreview) handleSendMessage(e);
                }
              }}
              placeholder="Type a message..."
              className={`w-full pr-12 px-4 py-3 border rounded-2xl resize-none focus:outline-none text-sm max-h-32 ${
                theme === "dark"
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-gray-50 text-gray-900 border-gray-200/50"
              }`}
              rows="1"
            />

            <button
              type="submit"
              disabled={!text.trim() && !imagePreview}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-200 shadow-lg ${
                text.trim() || imagePreview
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatContainer;
