import React, { useRef, useEffect, useState } from "react";
import { Send, Phone, Video, MoreVertical, Paperclip, X } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { formatMessageTime } from "../../lib/utlis";
import { useThemeStore } from "../../store/useThemeStore";
import toast from "react-hot-toast";
import { useCallStore } from "../../store/useCallStore";
import MessageSkeleton from "../../Skeleton/MessagesSkelton";
import CallModal from "./Chatmodal.jsx";



const ChatContainer = () => {
  const { authUser, onlineUsers, socket } = useAuthStore();
  const {
    startCall,
    receiveCall,
    handleAnswer,
    handleIceCandidate,
    endCall,
    rejectCall,
    inCall,
    isReceivingCall
  } = useCallStore();
  const { theme } = useThemeStore();
  const {
    messages,
    getMessages,
    isMessagesLoding,
    selectedUser,
    sendMessages,
    SubscribeToMessages,
    unsubscribeToMessages,
    setSelectedUser,
  } = useChatStore();
  
  const [showCallModal, setShowCallModal] = useState(false);

  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch + subscribe to messages
  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessages(selectedUser._id);
    SubscribeToMessages();
    return () => unsubscribeToMessages();
  }, [selectedUser?._id]);
  
  // Setup call-related socket listeners (aligned with backend events)
  // Note: We've moved the incoming call handler to useAuthStore for global notifications
  useEffect(() => {
    if (!socket) return;

    // We only need to handle call accepted/ended/rejected events here
    // Incoming calls are now handled at the auth store level
    const onCallAccepted = (data) => {
      console.log('Call accepted:', data);
      handleAnswer(data.answer);
      setShowCallModal(true);
      
      // Set call as connected - this will trigger the timer to start
      useCallStore.getState().setCallConnected(true);
      
      // stop ringtone if this side was caller
      if (window._ringtoneAudio) { 
        window._ringtoneAudio.pause(); 
        window._ringtoneAudio.currentTime = 0; 
        window._ringtoneAudio = null; 
      }
    };

    const onIceCandidate = (data) => handleIceCandidate(data.candidate);
    const onCallRejected = () => { toast.error('Call rejected'); endCall(false); setShowCallModal(false); };
    const onCallEnded = () => { endCall(false); setShowCallModal(false); };

    // Note: incoming-call is now handled at auth store level
    socket.off('call-accepted').on('call-accepted', onCallAccepted);
    socket.off('ice-candidate').on('ice-candidate', onIceCandidate);
    socket.off('call-rejected').on('call-rejected', onCallRejected);
    socket.off('call-ended').on('call-ended', onCallEnded);

    return () => {
      socket.off('call-accepted', onCallAccepted);
      socket.off('ice-candidate', onIceCandidate);
      socket.off('call-rejected', onCallRejected);
      socket.off('call-ended', onCallEnded);
    };
  }, [socket, receiveCall, handleAnswer, handleIceCandidate, endCall, rejectCall]);
  
  // Show/hide call modal based on call state
  // This should be preserved even if the component unmounts
  useEffect(() => {
    // Check if we have an active call that should be shown
    if (inCall || isReceivingCall) {
      setShowCallModal(true);
      
      // Store call state in sessionStorage for persistence
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('activeCall', JSON.stringify({
          inCall,
          isReceivingCall,
          timestamp: Date.now()
        }));
      }
    } else if (!inCall && !isReceivingCall) {
      // Add a small delay before hiding to allow animations
      const timer = setTimeout(() => {
        setShowCallModal(false);
        
        // Clear stored call state
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('activeCall');
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [inCall, isReceivingCall]);
  
  // Check for persisted call state on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const persistedCallState = sessionStorage.getItem('activeCall');
        if (persistedCallState) {
          const callData = JSON.parse(persistedCallState);
          
          // Only restore if recent (within last 5 minutes)
          const isRecent = Date.now() - callData.timestamp < 5 * 60 * 1000;
          
          if (isRecent && (callData.inCall || callData.isReceivingCall)) {
            setShowCallModal(true);
          } else {
            // Clean up stale data
            sessionStorage.removeItem('activeCall');
          }
        }
      } catch (err) {
        console.error("Error restoring call state:", err);
      }
    }
    
    // Listen for incoming calls from any source (socket events in authStore or direct socket events)
    const handleIncomingCallEvent = (event) => {
      console.log("Custom incoming call event received:", event.detail);
      receiveCall(event.detail);
      setShowCallModal(true);
      toast.success("Incoming call");
    };
    
    window.addEventListener('incomingCall', handleIncomingCallEvent);
    
    return () => {
      window.removeEventListener('incomingCall', handleIncomingCallEvent);
    };
  }, []);

  const isOnline =
    selectedUser?.fullname === "Privex Bot" ||
    (Array.isArray(onlineUsers) && onlineUsers.includes(selectedUser?._id));
    
  // Log online status for debugging
  useEffect(() => {
    if (selectedUser?._id) {
      console.log(`Selected user ${selectedUser.fullname} (${selectedUser._id}) online status:`, isOnline);
      console.log("All online users:", onlineUsers);
    }
  }, [selectedUser, onlineUsers, isOnline]);

  // Handle image preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith("image/")) {
      toast.error("Please select an image file");
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

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    try {
      await sendMessages({
        text: text.trim(),
        image: imagePreview,
      });
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Failed to send message!");
    }
  };

  // Early return for loading state moved up after all hooks have been called
  // This comment replaces the code that was here

  // Debug logging for call UI
  useEffect(() => {
    console.log("Call UI state:", { showCallModal, inCall, isReceivingCall });
  }, [showCallModal, inCall, isReceivingCall]);
  
  // IMPORTANT: Only return after all hooks have been called
  // Moved loading check here instead of earlier in the component
  if (isMessagesLoding) {
    return <div className="flex-1 flex items-center justify-center"><MessageSkeleton/></div>;
  }
  
  return (
    <div className={`flex-1 min-w-0 h-full flex flex-col bg-white dark:bg-[#23272f] transition-colors duration-300
      ${selectedUser? "w-full h-full md:flex-1" : ""}
    `}>
      {/* HEADER */}
      <div className={`${theme=='dark'?"bg-gray-800":"bg-gray-100"}   z-100  backdrop-blur-xl border-b border-gray-200/50 p-4 shadow-sm`}>
        <div className="flex items-center justify-between">
          {/* User Info */}
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
              <h2 className={` ${theme=='dark'?"text-white":"text-gray-800"} text-lg font-semibold`}>
                {selectedUser?.fullname}
              </h2>
              <p
                className={`text-sm font-medium ${
                  isOnline ? "text-green-500" : "text-gray-500"
                }`}
              >
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
              {/* Call Buttons */}
              <button
                className={`p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all duration-200 ${inCall || isReceivingCall ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                onClick={() => {
                  if (!inCall && !isReceivingCall) {
                    startCall(selectedUser._id, 'audio');
                    setShowCallModal(true);
                  }
                }}
                disabled={inCall || isReceivingCall}
                title="Audio Call"
              >
                <Phone className={`w-5 h-5 ${theme=='dark'?"text-white":"text-gray-700"}`} />
              </button>
              
              <button
                className={`p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all duration-200 ${inCall || isReceivingCall ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                onClick={() => {
                  if (!inCall && !isReceivingCall) {
                    startCall(selectedUser._id, 'video');
                    setShowCallModal(true);
                  }
                }}
                disabled={inCall || isReceivingCall}
                title="Video Call"
              >
                <Video className={`w-5 h-5 ${theme=='dark'?"text-white":"text-gray-700"}`} />
              </button>
              
              {/* Close Chat */}
              <button
                className="p-3 hover:bg-gray-600 rounded-full transition-all duration-200 hover:scale-90"
                onClick={() => {
                  if (inCall || isReceivingCall) {
                    endCall();
                  }
                  setSelectedUser(null);
                }}
                title="Close chat"
              >
                <i className={`fa-regular fa-circle-xmark text-2xl ${theme=='dark'?"fill-white":""}`}></i>
              </button>
            </div>

        </div>
      </div>

      {/* MESSAGES */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${theme=='dark'?"bg-stone-900 ":"bg-gray-50"} `}>
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${
              message.senderId === authUser._id
                ? "justify-end"
                : "justify-start"
            } animate-in slide-in-from-bottom-4 duration-300`}
          >
            <div
              className={`w-auto px-4 py-3 rounded-2xl relative group max-w-xs lg:max-w-md ${
                message.senderId === authUser._id
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "bg-white/80 backdrop-blur-sm text-gray-800 border border-gray-200/50 shadow-md"
              }`}
            >
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="rounded-lg mb-2 max-h-64 object-cover"
                />
              )}
              {message.text && (
                <p className="text-sm leading-relaxed break-words whitespace-pre-line">{message.text}</p>
              )}

              <div
                className={`flex items-center justify-end mt-2 space-x-1 ${
                  message.senderId === authUser._id
                    ? "text-white/70"
                    : "text-gray-500"
                }`}
              >
                <span className="text-xs">
                  {formatMessageTime(message.createdAt)}
                </span>
              </div>

              {/* Message tail */}
              <div
                className={`absolute top-4 ${
                  message.senderId === authUser._id
                    ? "right-0 translate-x-2"
                    : "left-0 -translate-x-2"
                }`}
              >
                <div
                  className={`w-3 h-3 rotate-45 ${
                    message.senderId === authUser._id
                      ? "bg-gradient-to-br from-blue-500 to-purple-600"
                      : "bg-white border-l border-t border-gray-200/50"
                  }`}
                ></div>
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

     
{/* INPUT */}
<div className={`${theme == 'dark' ? "bg-gray-800" : "bg-gray-100"} backdrop-blur-xl border-t border-gray-200/50 p-4 relative`}>
  {/* Image preview floating above input */}
  {imagePreview && (
    <div className="absolute -top-21  inline-block">
      <div className="relative">
        <img
          src={imagePreview}
          alt="Preview"
          className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
        />
        <button
          onClick={removeImage}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
          type="button"
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  )}

  <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      className="mb-2 p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
    >
      <Paperclip className="w-6 h-6 text-gray-500" />
    </button>
    <input
      type="file"
      accept="image/*"
      className="hidden"
      ref={fileInputRef}
      onChange={handleImageChange}
    />

    <div className="flex-1 relative">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (text.trim() || imagePreview) {
              handleSendMessage(e);
            }
          }
        }}
        placeholder="Type a message..."
        className={`w-full pr-12 px-4 py-3 ${theme === 'dark' ? "bg-gray-700 text-white placeholder-gray-400" : "bg-gray-50 text-gray-900 placeholder-gray-500"} backdrop-blur-sm border ${theme === 'dark' ? "border-gray-600 focus:ring-blue-100 focus:border-transparent" : "border-gray-200/50 focus:ring-purple-400 focus:border-transparent"} rounded-2xl resize-none focus:outline-none focus:ring-1 transition-all duration-200 text-sm leading-relaxed max-h-32`}
        rows="1"
      />

      <button
        type="submit"
        disabled={!text.trim() && !imagePreview}
        className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-200 shadow-lg ${
          text.trim() || imagePreview
            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-purple-300 hover:scale-105 active:scale-95"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  </form>
  </div>
  {/* Only show call modal when needed */}
  {showCallModal && selectedUser && <CallModal receiver={selectedUser} />}


</div>
  );
 
};

export default ChatContainer;


