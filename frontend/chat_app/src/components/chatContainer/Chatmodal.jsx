import React, { useRef, useEffect, useState } from "react";
import { useCallStore } from "../../store/useCallStore";
import { useAuthStore } from "../../store/useAuthStore";

import { X, Phone, Video, VideoOff, Mic, MicOff, Camera, Maximize2, Minimize2 } from "lucide-react";

export default function CallModal({ receiver }) {
  const { authUser, socket } = useAuthStore();
  const {
    localStream,
    remoteStream,
    isReceivingCall,
    inCall,
    incomingCall,
    callType,
    isLocalVideoEnabled,
    isRemoteVideoEnabled,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleVideoCall,
  } = useCallStore();
  
  // Local state for UI controls
  const [micEnabled, setMicEnabled] = useState(true);
  const [localVideoLarge, setLocalVideoLarge] = useState(false);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // attach streams to video elements with enhanced error handling and debugging
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log("Attaching local stream to video element");
      console.log("Local stream has video tracks:", localStream.getVideoTracks().length);
      
      try {
        localVideoRef.current.srcObject = localStream;
        
        // Enable track if it's disabled for any reason
        localStream.getVideoTracks().forEach(track => {
          if (!track.enabled && isLocalVideoEnabled) {
            console.log("Enabling local video track that was disabled");
            track.enabled = true;
          }
        });
        
        // Force a play attempt when the stream changes
        const playPromise = localVideoRef.current.play();
        if (playPromise) {
          playPromise.catch(err => {
            console.warn("Error playing local video:", err);
            // Try again after a short delay
            setTimeout(() => {
              localVideoRef.current?.play().catch(e => console.warn("Retry failed:", e));
            }, 1000);
          });
        }
      } catch (err) {
        console.error("Error setting local video stream:", err);
      }
    }
  }, [localStream, isLocalVideoEnabled]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("Attaching remote stream to video element");
      console.log("Remote stream has video tracks:", remoteStream.getVideoTracks().length);
      
      try {
        remoteVideoRef.current.srcObject = remoteStream;
        
        // Log details about each track in the remote stream
        remoteStream.getTracks().forEach(track => {
          console.log(`Remote track: kind=${track.kind}, enabled=${track.enabled}, readyState=${track.readyState}, id=${track.id}`);
          
          // Enable track if it's disabled
          if (track.kind === 'video' && !track.enabled && isRemoteVideoEnabled) {
            console.log("Enabling remote video track that was disabled");
            track.enabled = true;
          }
        });
        
        // Force a play attempt when the stream changes
        const playPromise = remoteVideoRef.current.play();
        if (playPromise) {
          playPromise.catch(err => {
            console.warn("Error playing remote video:", err);
            // Try again with a short delay
            setTimeout(() => {
              remoteVideoRef.current?.play().catch(e => console.warn("Retry failed:", e));
            }, 1000);
          });
        }
      } catch (err) {
        console.error("Error setting remote video stream:", err);
      }
    }
    
    // Setup a recurring check to ensure remote video is still properly connected
    const checkInterval = setInterval(() => {
      if (remoteVideoRef.current && remoteStream) {
        const videoTracks = remoteStream.getVideoTracks();
        if (videoTracks.length > 0) {
          console.log("Remote video tracks status:", videoTracks.map(t => 
            `enabled: ${t.enabled}, muted: ${t.muted}, readyState: ${t.readyState}`).join(', '));
        }
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(checkInterval);
  }, [remoteStream, isRemoteVideoEnabled]);
  
  // Toggle microphone
  const toggleMic = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setMicEnabled(!micEnabled);
    }
  };
  
  // Function to manually force a refresh of the remote video stream
  const refreshRemoteVideo = () => {
    console.log("Manually refreshing remote video stream");
    
    if (!remoteVideoRef.current || !remoteStream) {
      console.log("Cannot refresh: missing video element or stream");
      return;
    }
    
    // Temporarily disconnect and reconnect the stream
    const currentStream = remoteVideoRef.current.srcObject;
    remoteVideoRef.current.srcObject = null;
    
    // Wait a moment before reconnecting
    setTimeout(() => {
      if (remoteVideoRef.current) {
        console.log("Reconnecting remote stream to video element");
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(err => console.warn("Error playing video on refresh:", err));
      }
    }, 100);
  };

  // start a call
  const handleStartCall = (type) => {
    startCall(receiver._id, type);
  };

  // accept incoming call with improved handling
  const handleAcceptCall = () => {
    console.log("Accepting call from CallModal button");
    try {
      // Stop ringtone if playing
      if (window._ringtoneAudio) {
        window._ringtoneAudio.pause();
        window._ringtoneAudio.currentTime = 0;
        window._ringtoneAudio = null;
      }
      
      // Answer the call
      answerCall();
    } catch (err) {
      console.error("Error accepting call:", err);
    }
  };
  
  // Handle ending call with guaranteed cleanup
  const handleEndCall = () => {
    console.log("Manually ending call from CallModal");
    
    // Make sure to notify the other party
    if (socket && receiver && receiver._id) {
      console.log("Sending call-ended event to:", receiver._id);
      socket.emit("call-ended", { to: receiver._id });
      
      // Send again after a small delay as a backup
      setTimeout(() => {
        socket.emit("call-ended", { to: receiver._id });
      }, 300);
    }
    
    // Then call the normal end call function
    endCall();
  };

  // Call status with WhatsApp-style animation
  const [callStatusDots, setCallStatusDots] = useState('.');
  const [callStatus, setCallStatus] = useState('');
  
  // Animate the status dots for calling and ringing states (WhatsApp style)
  useEffect(() => {
    let dotsInterval;
    
    if (!inCall) {
      dotsInterval = setInterval(() => {
        setCallStatusDots(prev => prev.length >= 3 ? '.' : prev + '.');
      }, 500);
    }
    
    return () => clearInterval(dotsInterval);
  }, [inCall, isReceivingCall]);
  
  // Track and update call status from socket events
  useEffect(() => {
    if (!socket) {
      console.log("Socket not available in CallModal");
      return;
    }
    
    const handleCallStatus = (data) => {
      console.log("Call status received:", data);
      if (data.status === "ringing") {
        setCallStatus("ringing");
      } else if (data.status === "answered") {
        setCallStatus("connected");
      } else if (data.status === "unavailable") {
        // Don't change UI, let "Calling..." continue
        console.log("User unavailable, keeping calling animation");
      }
    };
    
    console.log("Adding call-status event listener in CallModal");
    socket.on("call-status", handleCallStatus);
    
    return () => {
      if (socket) {
        console.log("Removing call-status event listener in CallModal");
        socket.off("call-status", handleCallStatus);
      }
    };
  }, [socket]);
  
  // Determine call status text with animated dots (WhatsApp style)
  const getCallStatusText = () => {
    if (isReceivingCall) return "Incoming call";
    if (inCall && remoteStream) return "Connected";
    if (inCall && !remoteStream) return "Connecting";
    if (callStatus === "ringing") return "Ringing";
    return "Calling";
  };

  const toggleFullscreen = () => {
    setIsFullscreenMode(prev => !prev);
  };

  // Swap which video is displayed as the large one
  const swapVideoSize = () => {
    setLocalVideoLarge(prev => !prev);
  };
  
  // Reference to the main container for responsive PiP positioning
  const mainContainerRef = useRef(null);
  
  // Calculate safe PiP position based on container size
  const [pipPosition, setPipPosition] = useState({
    bottom: '20px',
    right: '20px'
  });
  
  // Adjust PiP position when fullscreen mode changes or when window is resized
  useEffect(() => {
    const updatePipPosition = () => {
      if (isFullscreenMode) {
        // Get container dimensions if available
        const container = mainContainerRef.current;
        let safeBottom = 80; // Default fallback
        
        if (container) {
          // Calculate position based on container size
          const containerRect = container.getBoundingClientRect();
          const containerHeight = containerRect.height;
          
          // Make sure the PiP is positioned above controls
          // Position based on percentage of container height
          safeBottom = Math.max(80, containerHeight * 0.15);
          
          // Adjust further if we have action buttons at the bottom
          if (containerHeight > 400) {
            // Add more space to account for controls
            safeBottom = Math.min(120, safeBottom);
          }
        } else {
          // Fallback to viewport-based calculation
          const viewportHeight = window.innerHeight;
          safeBottom = Math.max(80, viewportHeight * 0.1);
        }
        
        setPipPosition({
          bottom: `${safeBottom}px`,
          right: '20px'
        });
      } else {
        // Use default positioning in normal mode
        setPipPosition({
          bottom: '2px',
          right: '2px'
        });
      }
    };
    
    // Update position initially
    updatePipPosition();
    
    // Update position on window resize
    window.addEventListener('resize', updatePipPosition);
    
    return () => {
      window.removeEventListener('resize', updatePipPosition);
    };
  }, [isFullscreenMode]);

  return (
    <div className={`fixed ${isFullscreenMode ? 
      'inset-0 bg-black/95 flex items-center justify-center z-[9999]' : 
      'bottom-20 right-4 z-[9999]'
    }`}>
      <div 
        ref={mainContainerRef}
        className={`bg-white dark:bg-gray-900 shadow-xl rounded-xl ${isFullscreenMode ? 
          'w-11/12 max-w-5xl h-[90vh] flex flex-col p-5' : 
          'w-80 p-4'
        } transition-all duration-300`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {getCallStatusText()}
            </h2>
            {/* Show animated dots for calling/connecting/ringing states */}
            {(!inCall || !remoteStream) && (
              <div className="ml-1 flex">
                <span className="animate-bounce delay-0 mx-0.5">.</span>
                <span className="animate-bounce delay-150 mx-0.5">.</span>
                <span className="animate-bounce delay-300 mx-0.5">.</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {callType === "video" ? "Video Call" : "Audio Call"} 
            {receiver && <span className="ml-1">with {receiver.fullname}</span>}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleFullscreen} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200"
            title={isFullscreenMode ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreenMode ? 
              <Minimize2 className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : 
              <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
          </button>
          <button 
            onClick={handleEndCall} 
            className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-200"
            title="End Call"
          >
            <Phone className="w-5 h-5 text-white transform rotate-135" />
          </button>
        </div>
      </div>

      {/* Video preview */}
      <div className={`flex flex-col ${isFullscreenMode ? 'flex-1 overflow-hidden' : 'space-y-2'}`}>
        {/* Video section - conditionally show based on call type */}
        <div className={`${callType !== "video" ? "hidden" : ""} relative ${isFullscreenMode ? 'flex-1 flex' : ''}`}>
          {/* Main (large) video container */}
          <div 
            className={`${isFullscreenMode ? 'flex-1 h-full' : 'h-48'} bg-gray-800 rounded-md overflow-hidden flex items-center justify-center cursor-pointer w-full`}
            onClick={swapVideoSize}
          >
            {/* Main video - conditionally show local or remote based on state */}
            {localVideoLarge ? (
              // Local video is main
              <>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full ${isFullscreenMode ? 'object-contain' : 'object-cover'} ${localStream && isLocalVideoEnabled ? 'block' : 'hidden'}`}
                />
                {(!localStream || !isLocalVideoEnabled) && (
                  <div className="flex flex-col items-center justify-center text-white">
                    <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mb-2">
                      {authUser?.fullname?.charAt(0).toUpperCase() || "Me"}
                    </div>
                    <p>Your Camera is Off</p>
                  </div>
                )}
              </>
            ) : (
              // Remote video is main
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full ${isFullscreenMode ? 'object-contain' : 'object-cover'} ${remoteStream && isRemoteVideoEnabled ? 'block' : 'hidden'}`}
                />
                {(!remoteStream || !isRemoteVideoEnabled) && (
                  <div className="flex flex-col items-center justify-center text-white">
                    <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mb-2">
                      {receiver?.fullname?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <p>{inCall ? "Their Camera is Off" : "Connecting..."}</p>
                  </div>
                )}
              </>
            )}

            {/* Tap to swap indicator */}
            <div className={`absolute ${isFullscreenMode ? 'top-4 left-4' : 'top-2 left-2'} bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-opacity duration-300 opacity-70 hover:opacity-100`}>
              {isFullscreenMode ? 'Click to swap views' : 'Tap to swap'}
            </div>
          </div>
          
          {/* Picture-in-picture (small) video container */}
          <div 
            className="absolute rounded-md overflow-hidden border-2 border-white bg-gray-700 cursor-pointer shadow-lg"
            style={{
              width: isFullscreenMode ? '180px' : '90px',
              height: isFullscreenMode ? '120px' : '90px',
              bottom: pipPosition.bottom,
              right: pipPosition.right,
              zIndex: 10
            }}
            onClick={swapVideoSize}
          >
            {/* PiP video - conditionally show local or remote based on state */}
            {localVideoLarge ? (
              // Remote video is PiP when local is main
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${remoteStream && isRemoteVideoEnabled ? 'block' : 'hidden'}`}
                />
                {(!remoteStream || !isRemoteVideoEnabled) && (
                  <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-lg">
                    {receiver?.fullname?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </>
            ) : (
              // Local video is PiP when remote is main
              <>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${localStream && isLocalVideoEnabled ? 'block' : 'hidden'}`}
                />
                {(!localStream || !isLocalVideoEnabled) && (
                  <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-lg">
                    {authUser?.fullname?.charAt(0).toUpperCase() || "Me"}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Audio call view */}
        {callType === "audio" && (
          <div className={`w-full ${isFullscreenMode ? 'flex-1 h-full min-h-[300px]' : 'h-48'} bg-gray-800 rounded-md flex items-center justify-center`}>
            <div className="flex flex-col items-center">
              <div className={`${isFullscreenMode ? 'w-32 h-32 text-4xl' : 'w-24 h-24 text-3xl'} bg-gray-600 rounded-full flex items-center justify-center mb-4 text-white`}>
                {receiver?.fullname?.charAt(0).toUpperCase() || "U"}
              </div>
              <p className="text-white text-lg">{receiver?.fullname || "User"}</p>
              <p className="text-gray-300 text-sm">{inCall ? "In Call" : "Calling..."}</p>
              
              {/* Audio waveform animation */}
              {inCall && (
                <div className="flex items-end space-x-1 h-8 mt-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i} 
                      className="bg-blue-500 w-1.5 rounded-t-sm animate-pulse" 
                      style={{
                        height: `${15 + Math.random() * 15}px`,
                        animationDuration: `${0.8 + Math.random() * 0.5}s`,
                        animationDelay: `${Math.random() * 0.5}s`,
                      }}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Call Actions */}
      <div className={`flex justify-center space-x-4 ${isFullscreenMode ? 'mt-6 py-2' : 'mt-4'}`}>
        {/* Incoming call controls - Accept/Reject */}
        {isReceivingCall && !inCall && (
          <>
            <button
              onClick={() => {
                console.log("Accept call button clicked in CallModal");
                handleAcceptCall();
              }}
              className="bg-green-500 p-3 rounded-full text-white hover:scale-110 transition-transform"
              title="Accept Call"
            >
              <Phone className="w-5 h-5 rotate-90" />
            </button>
            <button
              onClick={() => {
                console.log("Reject call button clicked in CallModal");
                rejectCall();
              }}
              className="bg-red-500 p-3 rounded-full text-white hover:scale-110 transition-transform"
              title="Reject Call"
            >
              <Phone className="w-5 h-5 -rotate-90" />
            </button>
          </>
        )}

        {/* Initial call buttons */}
        {!inCall && !isReceivingCall && receiver && (
          <>
            <button
              onClick={() => handleStartCall("audio")}
              className="bg-blue-500 p-3 rounded-full text-white hover:scale-110 transition-transform"
              title="Audio Call"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleStartCall("video")}
              className="bg-purple-500 p-3 rounded-full text-white hover:scale-110 transition-transform"
              title="Video Call"
            >
              <Video className="w-5 h-5" />
            </button>
          </>
        )}

        {/* In-call controls */}
        {inCall && (
          <>
            {/* Mic toggle */}
            <button
              onClick={toggleMic}
              className={`${micEnabled ? 'bg-blue-500' : 'bg-gray-500'} p-3 rounded-full text-white hover:scale-110 transition-transform`}
              title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            
            {/* Video toggle */}
            <button
              onClick={toggleVideoCall}
              className={`${callType === 'video' ? 'bg-purple-500' : 'bg-gray-500'} p-3 rounded-full text-white hover:scale-110 transition-transform`}
              title={callType === 'video' ? "Switch to Audio Call" : "Switch to Video Call"}
            >
              {callType === 'video' ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            
            {/* End call button */}
            <button
              onClick={handleEndCall}
              className="bg-red-500 p-3 rounded-full text-white hover:scale-110 transition-transform"
              title="End Call"
            >
              <Phone className="w-5 h-5 -rotate-90" />
            </button>
          </>
        )}
        
        {/* Show end call during outgoing call */}
        {(!inCall && !isReceivingCall && (localStream || remoteStream)) && (
          <button
            onClick={handleEndCall}
            className="bg-red-500 p-3 rounded-full text-white hover:scale-110 transition-transform"
            title="End Call"
          >
            <Phone className="w-5 h-5 -rotate-90" />
          </button>
        )}
      </div>
      
      {/* Video troubleshooting tools */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <details>
          <summary className="cursor-pointer font-medium">Video Troubleshooting</summary>
          <div className="pl-2 pt-1">
            <p>Status: {inCall ? "Connected" : isReceivingCall ? "Incoming" : "Outgoing"}</p>
            <p>Type: {callType || "none"}</p>
            <p>Local Video: {isLocalVideoEnabled ? "On" : "Off"} 
              {localStream ? ` (${localStream.getVideoTracks().length} tracks)` : " (no stream)"}
              {localStream && localStream.getVideoTracks().length > 0 ? 
                ` - ${localStream.getVideoTracks()[0].enabled ? "enabled" : "disabled"}` : ""}
            </p>
            <p>Remote Video: {isRemoteVideoEnabled ? "On" : "Off"}
              {remoteStream ? ` (${remoteStream.getVideoTracks().length} tracks)` : " (no stream)"}
              {remoteStream && remoteStream.getVideoTracks().length > 0 ? 
                ` - ${remoteStream.getVideoTracks()[0].enabled ? "enabled" : "disabled"}` : ""}
            </p>
            <p>View Mode: {localVideoLarge ? "Local Large" : "Remote Large"}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <button 
                onClick={() => {
                  if (localVideoRef.current && localStream) {
                    localVideoRef.current.srcObject = null;
                    setTimeout(() => {
                      localVideoRef.current.srcObject = localStream;
                      localVideoRef.current.play().catch(e => console.warn("Error playing local video:", e));
                    }, 100);
                  }
                }}
                className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
              >
                Refresh Local Video
              </button>
              <button 
                onClick={refreshRemoteVideo}
                className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition-colors"
              >
                Refresh Remote Video
              </button>
              {remoteStream && remoteStream.getVideoTracks().length > 0 && (
                <button 
                  onClick={() => {
                    // Force enable remote video tracks
                    remoteStream.getVideoTracks().forEach(track => {
                      if (!track.enabled) {
                        console.log("Forcing remote track enable");
                        track.enabled = true;
                        refreshRemoteVideo();
                      }
                    });
                  }}
                  className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600 transition-colors"
                >
                  Force Enable Remote Video
                </button>
              )}
              {inCall && (
                <button 
                  onClick={() => {
                    // Attempt to renegotiate the connection
                    console.log("Attempting to refresh call connection");
                    if (socket && window._currentCallRecipient) {
                      socket.emit("refresh-call", { to: window._currentCallRecipient });
                      toast.success("Requesting video refresh...");
                    }
                  }}
                  className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 transition-colors"
                >
                  Refresh Connection
                </button>
              )}
            </div>
          </div>
        </details>
      </div>
      </div>
    </div>
  );
}
