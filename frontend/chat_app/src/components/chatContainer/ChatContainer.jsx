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
    handleCallAnswered, 
    handleIceCandidate, 
    endCall,
    handleCallEnded,
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
  
  // Setup call-related socket listeners
  useEffect(() => {
    if (!socket) return;
    
    console.log("Setting up call-related socket listeners");
    
    // Setup persistent call handling functions with WhatsApp-style ringing UI
    const handleIncomingCall = (data) => {
      console.log("Incoming call received in ChatContainer", data);
      
      // Don't process duplicate incoming call events
      const callStore = useCallStore.getState();
      if (callStore.inCall || callStore.isReceivingCall) {
        console.log("Already in a call or receiving one, ignoring duplicate incoming call");
        return;
      }
      
      // Send immediate ringing status back to caller
      if (socket && data.from) {
        socket.emit("call-status", { 
          to: data.from,
          status: "ringing",
          timestamp: Date.now()
        });
        console.log("Sent ringing status to caller", data.from);
      }
      
      // Create functions that handle the call actions outside of the toast render function
      const handleAcceptCallFromToast = () => {
        console.log("handleAcceptCallFromToast called");
        
        // Dismiss all toasts first to prevent multiple acceptances
        toast.dismiss();
        
        // Make sure the call data is properly set in the store
        // This is critical - store the data before proceeding
        const callStore = useCallStore.getState();
        if (!callStore.incomingCall) {
          console.log("Setting incoming call data in store");
          callStore.receiveCall(data);
        }
        
        // Show the call modal immediately
        setShowCallModal(true);
        
        // Stop any ringtone that might be playing
        if (window._ringtoneAudio) {
          console.log("Stopping ringtone");
          window._ringtoneAudio.pause();
          window._ringtoneAudio.currentTime = 0;
          window._ringtoneAudio = null;
        }
        
        // Short delay to ensure UI is updated before answering
        setTimeout(() => {
          console.log("Answering call from toast accept button");
          // Call the answerCall method from the store directly
          callStore.answerCall();
        }, 500);
      };
      
      const handleRejectCallFromToast = () => {
        console.log("handleRejectCallFromToast called");
        
        // Dismiss all toasts to prevent multiple rejections
        toast.dismiss();
        
        // Get direct reference to store methods
        const callStore = useCallStore.getState();
        
        // Make sure the call data is properly set in the store
        // This is critical - store the data before rejecting
        if (!callStore.incomingCall) {
          console.log("Setting incoming call data in store before reject");
          callStore.receiveCall(data);
        }
        
        // Reject the call using the store method
        console.log("Rejecting call using store method");
        callStore.rejectCall();
        
        // Stop any ringtone that might be playing
        if (window._ringtoneAudio) {
          console.log("Stopping ringtone on reject");
          window._ringtoneAudio.pause();
          window._ringtoneAudio.currentTime = 0;
          window._ringtoneAudio = null;
        }
      };
      
      // Show prominent notification with simpler click handlers
      // Create a reference to the from ID for binding events
      const callerId = data.from;
      const callType = data.type || 'video';
      const callerName = selectedUser?.fullname || "Someone";
      
      // Create a unique ID for this specific call toast
      const toastId = "incoming-call-" + callerId + "-" + Date.now();
      
      // Use a non-animated component first to ensure buttons work
      toast.custom((t) => (
        <div 
          id={`call-toast-${callerId}`}
          className={`p-4 rounded-lg shadow-xl bg-gradient-to-r from-blue-600 to-blue-800 text-white flex items-center gap-3 max-w-md ${t.visible ? 'animate-pulse' : ''}`}
          style={{ zIndex: 9999 }}
        >
          <div className="p-2 bg-white/20 rounded-full">
            {callType === 'video' ? 
              <Video className="h-6 w-6 text-white" /> : 
              <Phone className="h-6 w-6 text-white" />
            }
          </div>
          <div className="flex-1">
            <p className="font-medium text-lg">Incoming {callType} call</p>
            <p className="text-sm opacity-90">from {callerName}</p>
          </div>
          <div className="flex gap-2">
            <button 
              id={`accept-call-btn-${callerId}`}
              type="button"
              onClick={() => {
                console.log("Accept button clicked");
                handleAcceptCallFromToast();
              }}
              className="p-2 bg-green-500 hover:bg-green-600 rounded-full transition-colors"
            >
              <Phone className="h-5 w-5" />
            </button>
            <button
              id={`reject-call-btn-${callerId}`}
              type="button"
              onClick={() => {
                console.log("Reject button clicked");
                handleRejectCallFromToast();
              }}
              className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ), { 
        duration: 30000,
        position: "top-center",
        id: toastId // Use unique ID to prevent duplicate toasts
      });
      
      // After a small delay, attach event listeners directly to the DOM elements
      // This is a fallback in case React's onClick doesn't work in the toast
      setTimeout(() => {
        try {
          const acceptBtn = document.getElementById(`accept-call-btn-${callerId}`);
          const rejectBtn = document.getElementById(`reject-call-btn-${callerId}`);
          
          if (acceptBtn) {
            console.log("Adding click listener to accept button");
            acceptBtn.addEventListener('click', handleAcceptCallFromToast);
          }
          
          if (rejectBtn) {
            console.log("Adding click listener to reject button");
            rejectBtn.addEventListener('click', handleRejectCallFromToast);
          }
        } catch (err) {
          console.error("Error attaching event listeners to call buttons:", err);
        }
      }, 100);
      
      // Play notification sound
      try {
        const audio = new Audio('/ringtone.mp3');
        audio.loop = true;
        audio.play();
        
        // Store audio reference to stop it later
        window._ringtoneAudio = audio;
        
        // Stop ringtone after 30 seconds if not answered
        setTimeout(() => {
          if (audio) {
            audio.pause();
            audio.currentTime = 0;
          }
        }, 30000);
      } catch (err) {
        console.error("Error playing notification sound:", err);
      }
      
      // First update call state in the store
      receiveCall(data);
      
      // Don't automatically show call modal - let user accept from notification
    };
    
    const handleCallAnsweredEvent = (data) => {
      console.log("Call answered event received", data);
      handleCallAnswered(data.answer);
    };
    
    const handleUpdateCall = async (data) => {
      console.log("Update call event received", data);
      const { peerConnection } = useCallStore.getState();
      
      if (peerConnection && data.offer) {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          socket.emit("call-updated", { 
            to: data.from, 
            answer,
            type: data.type 
          });
          
          useCallStore.setState({ callType: data.type });
        } catch (err) {
          console.error("Error handling updated call:", err);
        }
      }
    };
    
    const handleCallUpdated = (data) => {
      console.log("Call updated event received", data);
      const { peerConnection } = useCallStore.getState();
      
      if (peerConnection && data.answer) {
        try {
          peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          useCallStore.setState({ callType: data.type });
        } catch (err) {
          console.error("Error handling call update response:", err);
        }
      }
    };
    
    const handleIceCandidateEvent = (data) => {
      console.log("ICE candidate received", data.candidate?.candidate);
      handleIceCandidate(data.candidate);
    };
    
    const handleCallRejected = () => {
      console.log("Call rejected");
      toast.error("Call was rejected");
      endCall();
      setShowCallModal(false);
    };
    
    const handleCallEndedEvent = (data) => {
      console.log("Call ended event received", data);
      
      // Create a visual indication that the call is ending
      toast.custom((t) => (
        <div className="p-4 rounded-lg bg-gray-800 text-white flex items-center gap-3 animate-pulse">
          <div className="p-2 bg-red-500/30 rounded-full">
            <Phone className="h-5 w-5 text-white rotate-135" />
          </div>
          <p>Call ended</p>
        </div>
      ), { duration: 3000 });
      
      // Ensure call is properly ended regardless of reason
      handleCallEnded();
      
      // Clean up UI with slight delay to allow animation
      setTimeout(() => {
        setShowCallModal(false);
      }, 500);
      
      // Make extra sure we release all media resources
      const { localStream, remoteStream } = useCallStore.getState();
      
      // First disable all tracks (immediate effect)
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.enabled = false;
          track.stop();
        });
      }
      
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => {
          track.enabled = false;
          track.stop();
        });
      }
      
      // Clear all stored call data
      window._currentCallRecipient = null;
      window._lastIncomingCall = null;
      
      // Reset call state completely
      useCallStore.setState({
        peerConnection: null,
        localStream: null,
        remoteStream: null,
        inCall: false,
        incomingCall: null,
        isReceivingCall: false,
        callType: null,
        isLocalVideoEnabled: false,
        isRemoteVideoEnabled: false
      });
    };
    
    // Always register handlers to ensure they're connected to the current socket
    console.log("Registering call event handlers");
    
    // First remove any existing handlers to avoid duplicates
    socket.off("incoming-call");
    socket.off("call-answered");
    socket.off("update-call");
    socket.off("call-updated");
    socket.off("ice-candidate");
    socket.off("call-rejected");
    socket.off("call-ended");
    socket.off("call-failed");
    
    // Now register the handlers
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-answered", handleCallAnsweredEvent);
    socket.on("update-call", handleUpdateCall);
    socket.on("call-updated", handleCallUpdated);
    socket.on("ice-candidate", handleIceCandidateEvent);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-ended", handleCallEndedEvent);
    socket.on("call-status", (data) => {
      console.log("Call status update:", data);
      // Don't show error toasts for unavailable users,
      // the UI already shows "Calling..." which is enough
      if (data.status === "unavailable") {
        console.log("User unavailable, keeping call UI open");
        // We'll let the calling animation continue instead of showing an error
      } else if (data.status === "ringing") {
        console.log("Remote user is ringing");
        // Update UI to show recipient is ringing (handled by animation)
      } else if (data.status === "error") {
        // Only show toast for technical errors, not user availability
        toast.error(data.message || "Call failed");
        endCall();
      }
    });
    
    // Store in global scope so we know these handlers are registered
    window.callHandlersRegistered = true;
    
    return () => {
      // Don't remove handlers on unmount - we want them to persist
      // but we'll note that we need to check if they're still properly connected
      window.checkSocketHandlersOnNextMount = true;
    }
  }, [socket]);
  
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


