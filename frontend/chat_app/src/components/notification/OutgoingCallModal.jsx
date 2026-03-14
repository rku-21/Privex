import React, { useState, useEffect } from "react";
import { useCallStore } from "../../store/useCallStore";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
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

const OutgoingCallModal = () => {
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);

  const { callType, isMuted, isInitiating, isCallAccepted } = useCallStore();
  const { selectedUser, friends } = useChatStore();

 useEffect(() => {
  const connectTimer = setTimeout(() => setIsConnecting(false), 0); 
  return () => clearTimeout(connectTimer);
}, []);


useEffect(() => {
  let timer;
  if (isCallAccepted) {
  
    setCallDuration(0);
    timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  } else {
   
    setCallDuration(0);
    clearInterval(timer);
  }

  return () => clearInterval(timer);
}, [isCallAccepted]);


  if (!isInitiating || !selectedUser) return null;

  const calleeData =
    friends.find((friend) => friend._id === selectedUser._id) || {
      fullname: "Unknown User",
      profilePicture: "avatar.png",
    };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  
  const handleEndCall = () => {
    const callStore = useCallStore.getState();
    const socket = useAuthStore.getState().socket;
    const currentCallId = callStore.currentCallId;  

    if (!currentCallId || !socket){
     
      return;
    };

    if (callStore.isCallAccepted) {
       socket.emit("call-ended", { callId: currentCallId }); 
    } else {
     socket.emit("cancel-call", { callId: currentCallId }); 
    }
    callStore.endCall();
  };
   return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-950 via-purple-950 to-violet-950 text-white">
      <div className="relative w-full h-screen overflow-hidden">
       
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03),_rgba(0,0,0,1))] animate-pulse"></div>

        {callType === "audio" ? (
         
          <div className="flex flex-col items-center justify-center h-full relative">
            <div className="absolute">
              <div className="w-96 h-96 rounded-full bg-white/5 animate-ping"></div>
            </div>
             <div className="relative z-10 mb-8">
              <div className="w-48 h-48 rounded-full overflow-hidden ring-8 ring-white/10 shadow-2xl">
                <img
                  src={calleeData.profilePicture || "avatar.png"}
                  alt={calleeData.fullname}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

           
            <div className="text-center z-10">
              <h2 className="text-4xl font-bold mb-2">{calleeData.fullname}</h2>
              <p className="text-xl text-white/70 mb-1">
                {isConnecting ? "Calling..." : "Ringing..."}
              </p>
              {!isConnecting && (
                <p className="text-lg text-white/50">
                  {formatDuration(callDuration)}
                </p>
              )}
            </div>
          </div>
        ) : (
        
          <div className="relative w-full h-full flex flex-col items-center justify-center">
           
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <div className="w-48 h-48 rounded-full overflow-hidden ring-8 ring-white/10 shadow-2xl mb-4">
                <img
                  src={calleeData.profilePicture}
                  alt={calleeData.fullname}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-3xl font-bold mb-1">{calleeData.fullname}</h3>
              <p className="text-white/70 text-lg mb-1">
                {isConnecting ? "Connecting Video..." : "Ringing..."}
              </p>
              {!isConnecting && (
                <p className="text-white/50 text-sm">{formatDuration(callDuration)}</p>
              )}
            </div>

           
            {callType === "video" && (
              <div className="absolute top-6 right-6 w-36 h-52 sm:w-40 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border border-white/20 z-20 group hover:scale-105 transition-transform">
                <video
                  id="localVideoPreview"
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  ref={(videoElement) => {
                    if (videoElement) {
                   
                      const { localStream } = useCallStore.getState();
                      if (localStream && videoElement.srcObject !== localStream) {
                        videoElement.srcObject = localStream;
                      }
                    }
                  }}
                />
                {isVideoOff && (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <VideoOff className="w-8 h-8 text-white/50" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 bg-black/50 rounded-lg backdrop-blur-sm">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

       
        <div className="absolute bottom-0 left-0 right-0 p-8 z-30">
          <div className="max-w-md mx-auto bg-black/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10">
            <div className="flex items-center justify-center space-x-6">
              
              <button
                onClick={() => useCallStore.getState().toggleMute()}
                className={`p-5 rounded-full transition-all transform hover:scale-110 ${
                  isMuted
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-white/20 hover:bg-white/30"
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
              </button>

             
              <button
                onClick={handleEndCall}
                className="p-6 bg-red-500 rounded-full hover:bg-red-600 transition-all transform hover:scale-110 shadow-lg"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>

             
              {callType === "video" ? (
                <button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`p-5 rounded-full transition-all transform hover:scale-110 ${
                    isVideoOff
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-white/20 hover:bg-white/30"
                  }`}
                >
                  {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
                </button>
              ) : (
                <button className="p-5 rounded-full bg-white/20 hover:bg-white/30 transition-all transform hover:scale-110">
                  <Volume2 className="w-6 h-6 text-white" />
                </button>
              )}
            </div>

          
            {callType === "video" && (
              <div className="flex items-center justify-center space-x-4 mt-4 pt-4 border-t border-white/10">
                <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all">
                  <Camera className="w-5 h-5 text-white" />
                </button>
                <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all">
                  <Maximize2 className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutgoingCallModal;
