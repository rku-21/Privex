import React, { useRef, useEffect, useState } from "react";
import { useCallStore } from "../../store/useCallStore";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  Minimize2,
  Maximize2
} from "lucide-react";

export default function CallModal({ receiver }) {
  const { authUser, socket } = useAuthStore();
  const {
    localStream,
    remoteStream,
    isReceivingCall,
    inCall,
    callType,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleVideo,
    isMuted,
    isVideoEnabled,
    isCallConnected, // Include isCallConnected directly in the main destructuring
  } = useCallStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [ringAnimation, setRingAnimation] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // Reference to the store to access toggleSpeaker directly
  // We keep this separate since it's an async function
  const callStore = useCallStore;
  
  // State to track speaker button clicks for UI feedback
  const [speakerActive, setSpeakerActive] = useState(false);
  // State to track if speaker is muted
  const [speakerMuted, setSpeakerMuted] = useState(false);

  useEffect(() => {
    let timer;
    // Only start the timer when call is connected, not just initiated
    if (inCall && isCallConnected) {
      timer = setInterval(() => setCallDuration(c => c + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [inCall, isCallConnected]);
  
  // Effect to sync speaker muted state with media element
  useEffect(() => {
    if (inCall && remoteStream) {
      const mediaElement = callType === 'video' ? 
        remoteVideoRef.current || document.getElementById('remote-video') :
        remoteVideoRef.current || document.getElementById('remote-audio');
      
      if (mediaElement) {
        // Update our state to match the element's actual muted state
        setSpeakerMuted(mediaElement.muted);
        
        // Set up a listener to keep our state in sync
        const updateMutedState = () => {
          setSpeakerMuted(mediaElement.muted);
        };
        
        mediaElement.addEventListener('volumechange', updateMutedState);
        
        return () => {
          mediaElement.removeEventListener('volumechange', updateMutedState);
        };
      }
    }
  }, [inCall, remoteStream, callType, remoteVideoRef]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  useEffect(() => {
    if (isReceivingCall && !inCall) {
      const id = setInterval(() => setRingAnimation(r => !r), 900);
      return () => clearInterval(id);
    }
    setRingAnimation(false);
  }, [isReceivingCall, inCall]);

  useEffect(() => {
    console.log("Local stream changed:", localStream ? 
      `available with ${localStream.getTracks().length} tracks` : 
      "null");
    
    if (!localStream) {
      console.log("No local stream to attach");
      return;
    }
    
    // Find the video element by ref or direct DOM access
    const videoElement = localVideoRef.current || document.getElementById('local-video');
    if (!videoElement) {
      console.error("Could not find local video element");
      return;
    }
    
    console.log("Attaching local stream to video element");
    
    // Check if we have video tracks
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length > 0) {
      console.log(`Found ${videoTracks.length} local video tracks`);
      // Make sure all video tracks are enabled (based on isVideoEnabled state)
      videoTracks.forEach(track => {
        console.log(`Local video track ${track.id}: enabled=${track.enabled}, readyState=${track.readyState}`);
        track.enabled = isVideoEnabled;
      });
    } else {
      console.log("No local video tracks found");
    }
    
    // Set the local video source using a more robust approach
    try {
      // Check if we're changing the stream
      const currentStream = videoElement.srcObject;
      if (currentStream !== localStream) {
        console.log("Setting new local stream to video element");
        videoElement.srcObject = localStream;
        
        // Always ensure proper display styles
        if (isVideoEnabled && videoTracks.length > 0) {
          videoElement.style.display = 'block';
        }
        
        // Monitor when tracks become active
        videoTracks.forEach(track => {
          if (track.readyState !== 'live') {
            track.onunmute = () => {
              console.log(`Local video track ${track.id} unmuted`);
              // Ensure the video element is updated when the track becomes active
              if (videoElement.srcObject !== localStream) {
                videoElement.srcObject = localStream;
              }
              // Force refresh the video display
              if (isVideoEnabled) {
                videoElement.style.display = 'none';
                setTimeout(() => { videoElement.style.display = 'block'; }, 10);
              }
            };
          }
        });
      } else {
        console.log("Local stream already attached to video element");
      }
    } catch (err) {
      console.error("Error setting local video srcObject:", err);
      
      // Try direct DOM manipulation if React ref failed
      try {
        const domVideoElement = document.getElementById('local-video');
        if (domVideoElement && domVideoElement !== videoElement) {
          console.log("Trying direct DOM manipulation for local video");
          domVideoElement.srcObject = localStream;
          if (isVideoEnabled && videoTracks.length > 0) {
            domVideoElement.style.display = 'block';
          }
        }
      } catch (domErr) {
        console.error("Error with direct DOM manipulation:", domErr);
      }
      
      // Fallback for older browsers
      try {
        videoElement.src = URL.createObjectURL(localStream);
      } catch (urlErr) {
        console.error("Error with createObjectURL for local stream:", urlErr);
      }
    }
    
    // Force play with error handling and retry
    const playVideo = async () => {
      if (!videoElement.paused) {
        console.log("Local video is already playing");
        return;
      }
      
      try {
        // Always mute local video to avoid feedback and autoplay issues
        videoElement.muted = true;
        await videoElement.play();
        console.log("Local video playing successfully");
      } catch (err) {
        console.error("Error playing local video:", err.message);
        
        // Retry with timeout (sometimes helps with autoplay restrictions)
        setTimeout(() => {
          console.log("Retrying local video play");
          videoElement.play().catch(e => {
            console.error("Retry failed for local video:", e.message);
            
            // If all else fails, create a play button
            if (inCall && videoElement.parentNode) {
              const playButton = document.createElement('button');
              playButton.textContent = "Enable camera";
              playButton.className = "absolute top-1 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded z-50";
              playButton.onclick = () => {
                videoElement.play();
                playButton.remove();
              };
              
              videoElement.parentNode.appendChild(playButton);
            }
          });
        }, 1000);
      }
    };
    
    playVideo();
    
    // Setup a periodic check to ensure the video stays active
    const intervalCheck = setInterval(() => {
      if (localStream && isVideoEnabled && videoTracks.length > 0) {
        const videoElement = localVideoRef.current || document.getElementById('local-video');
        if (videoElement && (videoElement.paused || !videoElement.srcObject)) {
          console.log("Periodic check: Local video needs reattachment");
          videoElement.srcObject = localStream;
          videoElement.play().catch(err => console.log("Auto-restart play failed:", err.message));
        }
      }
    }, 3000);
    
    return () => clearInterval(intervalCheck);
  }, [localStream, isVideoEnabled, inCall]);

  useEffect(() => {
    // This function handles both initial setup and updates
    const attachRemoteStream = () => {
      console.log("Remote stream status:", remoteStream ? 
        `available with ${remoteStream.getTracks().length} tracks` : 
        "not available");
      
      if (!remoteStream) {
        console.log("No remote stream to attach");
        return;
      }

      // Find appropriate element based on call type
      let mediaElement;
      
      if (callType === 'video') {
        mediaElement = remoteVideoRef.current || document.getElementById('remote-video');
        if (!mediaElement) {
          console.error("Could not find remote video element");
          return;
        }
      } else {
        // For audio calls, use the hidden audio element
        mediaElement = remoteVideoRef.current || document.getElementById('remote-audio');
        if (!mediaElement) {
          console.error("Could not find remote audio element");
          return;
        }
      }
      
      // Check for tracks before trying to display
      const videoTracks = remoteStream.getVideoTracks();
      const audioTracks = remoteStream.getAudioTracks();
      
      console.log(`Remote stream has ${videoTracks.length} video and ${audioTracks.length} audio tracks`);
      
      // Enable all audio tracks to ensure audio works properly
      audioTracks.forEach(track => {
        if (!track.enabled) {
          console.log(`Enabling audio track ${track.id}`);
          track.enabled = true;
        }
      });
      
      // If this is an audio call, always attach the stream even without tracks
      // as tracks might be added later
      console.log(`Attaching remote stream to ${callType} element`);
      
      // Set the remote stream source - using a more direct approach
      try {
        // Check if there's already a stream and if it's different
        const currentStream = mediaElement.srcObject;
        if (currentStream !== remoteStream) {
          console.log(`Setting new remote stream to ${callType} element`);
          mediaElement.srcObject = remoteStream;
          
          // For video calls, ensure the video is visible
          if (callType === 'video' && mediaElement.style) {
            mediaElement.style.display = 'block';
          }
          
          // Make sure all tracks are enabled
          // For video calls, enable video tracks
          if (callType === 'video') {
            videoTracks.forEach(track => {
              console.log(`Remote video track ${track.id}: enabled=${track.enabled}, readyState=${track.readyState}`);
              if (!track.enabled) {
                track.enabled = true;
                console.log(`Enabled remote video track ${track.id}`);
              }
            });
          }
          
          // Always enable audio tracks for both call types
          audioTracks.forEach(track => {
            console.log(`Remote audio track ${track.id}: enabled=${track.enabled}, readyState=${track.readyState}`);
            if (!track.enabled) {
              track.enabled = true;
              console.log(`Enabled remote audio track ${track.id}`);
            }
          });
          
          // Also monitor when tracks become active
          videoTracks.forEach(track => {
            if (track.readyState !== 'live') {
              track.onunmute = () => {
                console.log(`Remote video track ${track.id} unmuted, refreshing video element`);
                // Sometimes we need to reattach the stream when tracks become active
                if (videoElement.srcObject !== remoteStream) {
                  videoElement.srcObject = remoteStream;
                }
                // Force a refresh of the video display
                videoElement.style.display = 'none';
                setTimeout(() => { videoElement.style.display = 'block'; }, 10);
              };
            }
          });
        } else {
          console.log("Remote stream already attached to video element");
        }
      } catch (err) {
        console.error("Error setting remote video srcObject:", err);
        
        // Try the direct DOM approach if React ref failed
        try {
          // Try to find the element directly in DOM
          const elementId = callType === 'video' ? 'remote-video' : 'remote-audio';
          const domElement = document.getElementById(elementId);
          
          if (domElement && domElement !== mediaElement) {
            console.log(`Trying direct DOM manipulation for remote ${callType} element`);
            domElement.srcObject = remoteStream;
            if (callType === 'video' && domElement.style) {
              domElement.style.display = 'block';
            }
          }
        } catch (domErr) {
          console.error("Error with direct DOM manipulation:", domErr);
        }
        
        // Fallback for older browsers
        try {
          mediaElement.src = URL.createObjectURL(remoteStream);
        } catch (urlErr) {
          console.error("Error with createObjectURL for remote stream:", urlErr);
        }
      }
      
      // Force play with error handling and retry
      const playVideo = async () => {
        if (!mediaElement.paused) {
          console.log(`Remote ${callType} is already playing`);
          return;
        }
        
        console.log(`Attempting to play remote ${callType}`);
        try {
          // Ensure remote audio is not muted by default
          mediaElement.muted = false;
          setSpeakerMuted(false);
          
          // Set audio output to system default (this helps with audio)
          if (mediaElement.setSinkId && typeof mediaElement.setSinkId === 'function') {
            try {
              await mediaElement.setSinkId('default');
              console.log('Set audio output to system default');
            } catch (sinkErr) {
              console.error('Error setting audio output:', sinkErr);
            }
          }
          
          // Try to play the media
          await mediaElement.play();
          console.log(`Remote ${callType} playing successfully`);
        } catch (err) {
          console.error(`Error playing remote ${callType}:`, err.message);
          
          // Create a user-initiated play button for browser autoplay restrictions
          console.log("Creating play button for user interaction");
          
          // Only add play button for video calls
          if (callType === 'video' && mediaElement.parentNode) {
            const playButton = document.createElement('button');
            playButton.textContent = "Click to enable video";
            playButton.className = "absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded z-50";
            playButton.onclick = () => {
              mediaElement.play().catch(e => console.error("Play error:", e));
              playButton.remove();
            };
            
            // Add button near the video element
            // Remove any existing buttons first
            const existingButtons = mediaElement.parentNode.querySelectorAll('button');
            existingButtons.forEach(btn => btn.remove());
            
            mediaElement.parentNode.appendChild(playButton);
          }
          
          // For audio calls, we need to encourage user interaction to overcome autoplay restrictions
          if (callType === 'audio') {
            toast((t) => (
              <div>
                <div className="mb-2">Click to enable audio</div>
                <button 
                  onClick={() => {
                    mediaElement.play();
                    toast.dismiss(t.id);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Enable Audio
                </button>
              </div>
            ), { duration: 10000 });
          }
          
          // Setup a backup timeout to try again
          setTimeout(() => {
            if (mediaElement.paused) {
              console.log(`Retry playing remote ${callType} after delay`);
              const tempMuted = mediaElement.muted;
              mediaElement.muted = true; // Temporarily mute to help with autoplay
              mediaElement.play()
                .then(() => {
                  console.log(`Remote ${callType} playing after retry (muted)`);
                  // Restore original muted state after a short delay
                  setTimeout(() => {
                    if (!tempMuted) {
                      mediaElement.muted = false;
                      console.log(`Remote ${callType} unmuted`);
                    }
                  }, 1000);
                })
                .catch(e => console.error("Retry play failed:", e));
            }
          }, 2000);
        }
      };
      
      playVideo();
    };
    
    // Call immediately
    attachRemoteStream();
    
    // Set up a recurring check to make sure stream is properly attached
    const intervalCheck = setInterval(() => {
      if (remoteStream && remoteStream.getTracks().length > 0) {
        // Use the appropriate element based on call type
        const elementId = callType === 'video' ? 'remote-video' : 'remote-audio';
        const mediaElement = remoteVideoRef.current || document.getElementById(elementId);
        
        if (mediaElement && (!mediaElement.srcObject || mediaElement.paused)) {
          console.log(`Periodic check: Remote ${callType} stream needs reattachment`);
          attachRemoteStream();
        }
      }
    }, 2000);
    
    // Setup track monitoring
    if (remoteStream) {
      const handleTrackEvent = (event) => {
        console.log(`Remote stream track ${event.type}:`, 
          event.track ? `${event.track.kind} (${event.track.id})` : 'unknown track');
        attachRemoteStream();
      };
      
      remoteStream.addEventListener('addtrack', handleTrackEvent);
      remoteStream.addEventListener('removetrack', handleTrackEvent);
      
      return () => {
        clearInterval(intervalCheck);
        remoteStream.removeEventListener('addtrack', handleTrackEvent);
        remoteStream.removeEventListener('removetrack', handleTrackEvent);
      };
    }
    
    return () => clearInterval(intervalCheck);
  }, [remoteStream]);

  const handleStart = (type) => {
    console.log(`Starting ${type} call to ${receiver?._id}`);
    // Force reset any existing media elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    startCall(receiver?._id, type);
  };
  
  const handleAccept = () => {
    console.log("Accepting call");
    if (window._ringtoneAudio) {
      window._ringtoneAudio.pause();
      window._ringtoneAudio.currentTime = 0;
      window._ringtoneAudio = null;
    }
    
    // Force reset any existing media elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    answerCall();
  };
  
  const handleEnd = () => {
    console.log(`Ending call with receiver ${receiver?._id}`);
    if (socket && receiver?._id) {
      // Send explicit end call with recipient ID
      socket.emit("end-call", { to: receiver._id });
      console.log("End call event emitted to", receiver._id);
      // Since we manually emitted the end-call event, don't have endCall() send another one
      endCall(false);
    } else {
      console.warn("Cannot end call properly - missing socket or receiver", { 
        socketConnected: !!socket?.connected,
        receiverId: receiver?._id 
      });
      // No recipient ID, just clean up locally
      endCall(true);
    }
  };

  const statusText = () => {
    if (isReceivingCall && !inCall) return "Incoming call";
    if (inCall && isCallConnected) return formatDuration(callDuration);
    if (inCall && !isCallConnected) return "Calling...";
    return "Connecting...";
  };
  
  // Handle speaker toggle for both video and audio calls
  const handleSpeakerToggle = () => {
    console.log("Speaker toggle button clicked");
    
    // Provide immediate visual feedback
    setSpeakerActive(prev => !prev);
    // setTimeout(() => setSpeakerActive(false), 500);
    
    // Toggle speaker muted state
    setSpeakerMuted(prev => !prev);
    
    // Find the appropriate media element based on call type
    const mediaElement = callType === 'video' ? 
      remoteVideoRef.current || document.getElementById('remote-video') :
      remoteVideoRef.current || document.getElementById('remote-audio');
    
    if (mediaElement) {
      console.log("Media element found:", mediaElement.id);
      try {
        // Toggle the media element's muted state directly
        mediaElement.muted = !mediaElement.muted;
        
        // Show appropriate toast message
        if (mediaElement.muted) {
          toast.success("Speaker turned off");
        } else {
          toast.success("Speaker turned on");
        }
        
        // Log more information about the media element
        console.log("Media element properties:", {
          currentTime: mediaElement.currentTime,
          duration: mediaElement.duration,
          paused: mediaElement.paused,
          muted: mediaElement.muted,
          volume: mediaElement.volume,
          readyState: mediaElement.readyState
        });
        
      } catch (err) {
        console.error("Error toggling speaker:", err);
        toast.error("Speaker toggle failed");
      }
    } else {
      console.error("No media element found for speaker toggle");
      
      // Still toggle the state for visual feedback even if no media element
      
      // Fallback for when no media element is found
      // This might happen early in the call setup
      if (callType === 'audio') {
        toast.info("Audio settings will be available once call connects");
      } else {
        toast.error("Cannot change speaker - no audio element found");
      }
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] w-72 bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {receiver?.fullname?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{receiver?.fullname || 'In Call'}</p>
              <p className="text-gray-400 text-xs">{statusText()}</p>
            </div>
          </div>
          <button onClick={() => setIsMinimized(false)} className="text-gray-400 hover:text-white transition-colors">
            <Maximize2 size={18} />
          </button>
        </div>
        <button onClick={handleEnd} className="w-full py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm font-medium transition-colors">End Call</button>
      </div>
    );
  }

  if (isReceivingCall && !inCall) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-md text-center flex flex-col h-full max-h-[600px] justify-between py-8">
          {/* Avatar and caller info */}
          <div className="flex-1 flex flex-col items-center justify-center mb-4">
            <div className={`w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-2xl transition-transform duration-300 ${ringAnimation ? 'scale-110' : 'scale-100'}`}>
              {receiver?.fullname?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">{receiver?.fullname || 'Unknown Caller'}</h2>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-base sm:text-lg">
              {callType === 'video' ? <Video size={18} /> : <Phone size={18} />}
              <span>Incoming {callType || 'audio'} call...</span>
            </div>
          </div>
          
          {/* Call controls - positioned at bottom for better visibility */}
          <div className="pb-6 sm:pb-8 pt-4">
            <div className="flex justify-center items-center gap-8 sm:gap-16">
              <button onClick={rejectCall} className="flex flex-col items-center gap-2 group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-xl transform hover:scale-110 transition-all duration-200">
                  <PhoneOff className="text-white" size={28} />
                </div>
                <span className="text-white text-sm font-medium">Decline</span>
              </button>
              <button onClick={handleAccept} className="flex flex-col items-center gap-2 group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-xl transform hover:scale-110 transition-all duration-200 animate-pulse">
                  <Phone className="text-white" size={28} />
                </div>
                <span className="text-white text-sm font-medium">Accept</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (callType === 'video') {
    return (
      <div className="fixed inset-0 bg-black z-[9999] overflow-hidden">
        {/* Full screen video container */}
        <div className="relative w-full h-full">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            muted={false}
            controls={false}
            className={`w-full h-full object-cover ${remoteStream && remoteStream.getTracks().length > 0 ? 'block' : 'hidden'}`}
            style={{ objectFit: 'cover' }}
            id="remote-video"
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl md:text-6xl font-bold mb-4 mx-auto shadow-2xl">
                  {receiver?.fullname?.charAt(0).toUpperCase() || 'U'}
                </div>
                <p className="text-white text-lg">{inCall ? 'Waiting for video...' : 'Connecting...'}</p>
              </div>
            </div>
          )}
          
          {/* Top gradient overlay with caller info */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent pt-4 pb-8 px-4">
            <div className="flex flex-col items-center relative">
              {/* Center aligned caller info */}
              <div className="w-full text-center">
                <h3 className="text-white text-xl md:text-2xl font-semibold mb-1">{receiver?.fullname || 'Privex User'}</h3>
                <p className="text-gray-300 text-sm">{statusText()}</p>
              </div>
              
              {/* Absolutely positioned minimize button */}
              <button 
                onClick={() => setIsMinimized(true)} 
                className="absolute right-0 top-0 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors"
              >
                <Minimize2 size={20} />
              </button>
            </div>
          </div>
          
          {/* Self video overlay */}
          <div className="absolute top-20 right-4 w-20 h-28 md:w-32 md:h-44 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className={`w-full h-full object-cover ${localStream && isVideoEnabled ? 'block' : 'hidden'}`} 
              style={{ transform: 'scaleX(-1)', objectFit: 'cover' }} // Mirror the local video
              id="local-video"
            />
            {(!localStream || !isVideoEnabled) && (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                {authUser?.fullname?.charAt(0).toUpperCase() || 'Me'}
              </div>
            )}
          </div>
          
          {/* Floating controls at the bottom with gradient background */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent py-8 px-4">
            <div className="max-w-xl mx-auto flex justify-center items-center gap-3 md:gap-6">
              <button onClick={toggleMic} className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${!isMuted ? 'bg-gray-800/90 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}>{!isMuted ? <Mic className="text-white" size={22} /> : <MicOff className="text-white" size={22} />}</button>
              <button onClick={toggleVideo} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-800/90 hover:bg-gray-700 flex items-center justify-center transition-all shadow-lg">{isVideoEnabled ? <Video className="text-white" size={22} /> : <VideoOff className="text-white" size={22} />}</button>
              <button onClick={handleEnd} className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all"><PhoneOff className="text-white" size={28} /></button>
              <button 
                onClick={handleSpeakerToggle} 
                className={`w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all ${
                  speakerMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-800/90 hover:bg-gray-700'
                }`}>
                <Volume2 className="text-white" size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Audio call (default)
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900 z-[9999] flex flex-col overflow-hidden">
      {/* Hidden audio element for remote stream to ensure audio output */}
      <audio 
        ref={remoteVideoRef} 
        autoPlay 
        playsInline 
        muted={false}
        className="hidden"
        id="remote-audio"
      />
      
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <button onClick={() => setIsMinimized(true)} className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors">
          <Minimize2 size={20} />
        </button>
        <div className={`w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-6xl md:text-7xl font-bold mb-8 shadow-2xl ${inCall && !isCallConnected ? 'animate-ring-pulse' : inCall && isCallConnected ? '' : 'animate-pulse'}`}>
          {receiver?.fullname?.charAt(0).toUpperCase() || 'U'}
        </div>
        {/* Ringing animation when call is not connected */}
        {inCall && !isCallConnected && (
          <div className="absolute">
            <div className="w-44 h-44 md:w-52 md:h-52 rounded-full border-4 border-blue-400/30 animate-ping"></div>
          </div>
        )}
        <h3 className="text-white text-3xl md:text-4xl font-semibold mb-2 text-center">{receiver?.fullname || 'Privex User'}</h3>
        <p className="text-gray-400 text-lg md:text-xl mb-8">{statusText()}</p>
        {inCall && isCallConnected && <div className="flex items-center gap-2 text-green-400 mb-4"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div><span className="text-sm">Connected</span></div>}
        {inCall && isCallConnected && (
          <div className="flex items-end space-x-2 h-12">
            {[1,2,3,4,5].map(i => <div key={i} className="bg-blue-500 w-2 rounded-full animate-pulse" style={{height: `${20 + Math.random()*30}px`, animationDuration: `${0.6 + Math.random()*0.4}s`, animationDelay: `${Math.random()*0.3}s`}} />)}
          </div>
        )}
      </div>
      
      {/* Floating controls at the bottom with gradient background */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent py-8 px-4">
        <div className="max-w-xl mx-auto flex justify-center items-center gap-3 md:gap-6">
          {!inCall && !isReceivingCall && (
            <>
              <button onClick={() => handleStart('audio')} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all"><Phone className="text-white" size={28} /></button>
              <button onClick={() => handleStart('video')} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all"><Video className="text-white" size={28} /></button>
            </>
          )}
          {inCall && (
            <>
              <button onClick={toggleMic} className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${!isMuted ? 'bg-gray-800/90 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}>{!isMuted ? <Mic className="text-white" size={22} /> : <MicOff className="text-white" size={22} />}</button>
              <button onClick={toggleVideo} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-800/90 hover:bg-gray-700 flex items-center justify-center transition-all shadow-lg">{isVideoEnabled ? <Video className="text-white" size={22} /> : <VideoOff className="text-white" size={22} />}</button>
              <button onClick={handleEnd} className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all"><PhoneOff className="text-white" size={28} /></button>
              <button 
                onClick={handleSpeakerToggle}
                className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  speakerActive ? 'animate-pulse' : ''
                } ${
                  speakerMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-800/90 hover:bg-gray-700'
                }`}
                id="speaker-toggle-btn"
              >
                <Volume2 className="text-white" size={22} />
              </button>
            </>
          )}
          {!inCall && (localStream || remoteStream) && (
            <button onClick={handleEnd} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all"><PhoneOff className="text-white" size={28} /></button>
          )}
        </div>
      </div>
    </div>
  );
}