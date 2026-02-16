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

  
  useEffect(() => {
    let timer;

    if (isCallAccepted) {
      
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      
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

    if (callStore.isCallAccepted && callStore.currentCallId) {
      console.log("ending an active call and emitting call-ended with callId:", callStore.currentCallId);
      socket.emit("call-ended", { callId: callStore.currentCallId });
    } else {
      console.log("Call was not in accepted state or no callId");
    }

    
    endCall();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black text-white">
      
      {callType === "video" ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Remote Video Fullscreen */}
          <video
            ref={(videoElement) => {
              if (videoElement && remoteStream) {
                console.log(
                  "Setting remote stream to video element:",
                  remoteStream.id,
                  "Tracks:",
                  remoteStream.getTracks().map(t => t.kind)
                );
                videoElement.srcObject = remoteStream;
                videoElement.play().catch(err => console.error("Remote video play error:", err));
              }
            }}
            autoPlay
            playsInline
            muted={false}
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
        
        <div className="flex flex-col items-center justify-center h-full">
       
          <audio
            ref={(audioElement) => {
              if (audioElement && remoteStream) {
                console.log("Setting up audio stream...");
                const audioTracks = remoteStream.getAudioTracks();
                console.log("Audio tracks available:", audioTracks.length);
                
                if (audioElement.srcObject !== remoteStream) {
                  console.log("Setting remote stream to audio element");
                  audioElement.srcObject = remoteStream;
                  audioElement.volume = 1.0;
                  audioElement.play().catch(err => console.error("Error playing audio:", err));
                }
              }
            }}
            autoPlay
            playsInline
          />

         
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

