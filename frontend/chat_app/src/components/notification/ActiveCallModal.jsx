import React, { useState, useEffect } from "react";
import { useCallStore } from "../../store/useCallStore";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import ChatContainer from "../chatContainer/ChatContainer.jsx";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Volume2,
  Maximize2,
  Camera,
} from "lucide-react";

const ActiveCallModal = () => {
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const {
    callType,
    isMuted,
    localStream,
    remoteStream,
    endCall,
    isCallAccepted,
  } = useCallStore();
  const { selectedUser, friends } = useChatStore();
  const { incomingCall, onCallWithWhom } = useCallStore();
  const { handleCloseChat } = ChatContainer;

  // ✅ Timer starts only when the call is accepted, stops and resets when call ends
  useEffect(() => {
    let timer;

    if (isCallAccepted) {
      // Reset and start timer fresh every time a new call connects
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      // Stop and reset timer when call ends or not accepted
      clearInterval(timer);
      setCallDuration(0);
    }

    return () => clearInterval(timer);
  }, [isCallAccepted]);

  if (!isCallAccepted) return null;

  const calleeData = onCallWithWhom;
  console.log("Callee data:", calleeData);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleCallEnd = () => {
    console.log("Handle end/cancel call triggered from ActiveCallModal");
    const socket = useAuthStore.getState().socket;
    const callStore = useCallStore.getState();

    if (!socket) {
      console.log("No socket available, cannot emit call-ended");
    }

    if (callStore.isCallAccepted && selectedUser && selectedUser._id) {
      console.log(
        "ending an active call and emitting call-ended to:",
        selectedUser._id
      );
      socket.emit("call-ended", { to: selectedUser._id });
    } else {
      console.log("Call was not in accepted state or no selected user");
    }

    // End call will clean up resources and set selectedUser to null
    endCall();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black text-white">
      {/* VIDEO CALL */}
      {callType === "video" ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Remote Video Fullscreen */}
          <video
            ref={(videoElement) => {
              if (
                videoElement &&
                remoteStream &&
                videoElement.srcObject !== remoteStream
              ) {
                console.log(
                  "Setting remote stream to video element:",
                  remoteStream.id
                );
                videoElement.srcObject = remoteStream;
              }
            }}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Mini Local Video */}
          <div className="absolute top-6 right-6 w-36 h-52 sm:w-40 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border border-white/20 z-20">
            <video
              ref={(videoElement) => {
                if (
                  videoElement &&
                  localStream &&
                  videoElement.srcObject !== localStream
                ) {
                  console.log(
                    "Setting local stream to video element:",
                    localStream.id
                  );
                  videoElement.srcObject = localStream;
                }
              }}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-white/50" />
              </div>
            )}
          </div>

          {/* Control Buttons Overlay */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-6 z-30">
            {/* Mute */}
            <button
              onClick={() => useCallStore.getState().toggleMute()}
              className={`p-5 rounded-full transition-all transform hover:scale-110 ${
                isMuted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>

            {/* End Call */}
            <button
              onClick={handleCallEnd}
              className="p-6 bg-red-500 rounded-full hover:bg-red-600 transition-all transform hover:scale-110 shadow-lg"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>

            {/* Video Toggle */}
            <button
              onClick={() => {
                const newValue = !isVideoOff;
                setIsVideoOff(newValue);
                useCallStore.getState().toggleVideo(newValue);
              }}
              className={`p-5 rounded-full transition-all transform hover:scale-110 ${
                isVideoOff
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              {isVideoOff ? (
                <VideoOff className="w-6 h-6 text-white" />
              ) : (
                <Video className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      ) : (
        // AUDIO CALL
        <div className="flex flex-col items-center justify-center h-full">
          {/* Hidden Audio Element for Remote Stream */}
          <audio
            ref={(audioElement) => {
              if (audioElement && remoteStream) {
                console.log("Setting up audio stream...");
                // Ensure we have audio tracks
                const audioTracks = remoteStream.getAudioTracks();
                console.log("Audio tracks available:", audioTracks.length);
                audioTracks.forEach(track => {
                  console.log(`Audio track: enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`);
                });
                
                if (audioElement.srcObject !== remoteStream) {
                  console.log("Setting remote stream to audio element");
                  audioElement.srcObject = remoteStream;
                  audioElement.volume = 1.0;  // Ensure volume is at maximum
                  
                  // Try playing with user interaction handling
                  const playAudio = async () => {
                    try {
                      await audioElement.play();
                      console.log("Audio playback started successfully");
                    } catch (err) {
                      console.error("Error playing audio:", err);
                      // If autoplay fails, we might need user interaction
                      if (err.name === "NotAllowedError") {
                        console.log("Autoplay failed, might need user interaction");
                      }
                    }
                  };
                  
                  playAudio();
                  
                  // Monitor audio state
                  audioElement.onplay = () => console.log("Audio started playing");
                  audioElement.onpause = () => console.log("Audio paused");
                  audioElement.onended = () => console.log("Audio ended");
                  audioElement.onerror = (e) => console.error("Audio error:", e);
                }
              }
            }}
            autoPlay
            playsInline
          />

          {/* Remote Avatar Center */}
          <div className="w-48 h-48 rounded-full overflow-hidden ring-8 ring-white/10 shadow-2xl mb-4">
            <img
             src={calleeData.profilePicture || "/avatar.png"}

              alt={calleeData.fullname}
              className="w-full h-full object-cover"
            />
          </div>

          <h3 className="text-3xl font-bold mb-1">{calleeData.fullname}</h3>
          <p className="text-white/70 text-lg mb-2">
            {formatDuration(callDuration)}
          </p>

          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-6 mt-8">
            {/* Mute */}
            <button
              onClick={() => useCallStore.getState().toggleMute()}
              className={`p-5 rounded-full transition-all transform hover:scale-110 ${
                isMuted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>

            {/* End Call */}
            <button
              onClick={handleCallEnd}
              className="p-6 bg-red-500 rounded-full hover:bg-red-600 transition-all transform hover:scale-110 shadow-lg"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>

            {/* Placeholder for audio only */}
            <button className="p-5 rounded-full bg-white/20 hover:bg-white/30 transition-all transform hover:scale-110">
              <Volume2 className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveCallModal;

