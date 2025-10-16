import React, { useEffect, useState } from 'react';
import { Phone, Video, PhoneOff } from 'lucide-react';
import { useCallStore } from '../../store/useCallStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const IncomingCallNotification = () => {
  const { isReceivingCall, incomingCall, answerCall, rejectCall } = useCallStore();
  const { socket } = useAuthStore();
  const [caller, setCaller] = useState(null);
  const [ringAnimation, setRingAnimation] = useState(false);
  const navigate = useNavigate();
  
  // Set up animation for visual feedback and fetch caller info
  useEffect(() => {
    if (isReceivingCall && incomingCall) {
      // Set up animation for visual feedback
      const id = setInterval(() => setRingAnimation(r => !r), 800);
      
      // Fetch caller info if available
      if (incomingCall.from) {
        fetch(`https://privex-1.onrender.com/api/users/${incomingCall.from}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setCaller(data.user);
            }
          })
          .catch(err => console.error("Error fetching caller info:", err));
      }
      
      return () => {
        clearInterval(id);
      };
    }
    
    return () => {};
  }, [isReceivingCall, incomingCall]);
  
  const handleAccept = () => {
    // Stop ringtone if it's playing
    if (window._ringtoneAudio) {
      window._ringtoneAudio.pause();
      window._ringtoneAudio.currentTime = 0;
      window._ringtoneAudio = null;
    }
    
    // First answer the call to establish connection and update state
    answerCall();
    
    // Navigate to home page and directly activate the call interface
    navigate('/', { 
      state: { 
        directCall: true,
        callerId: incomingCall?.from 
      }
    });
  };
  
  const handleReject = () => {
    // Stop ringtone if it's playing
    if (window._ringtoneAudio) {
      window._ringtoneAudio.pause();
      window._ringtoneAudio.currentTime = 0;
      window._ringtoneAudio = null;
    }
    
    rejectCall();
    toast.success("Call rejected");
  };

  if (!isReceivingCall || !incomingCall) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-lg animate-slideDown">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform ${ringAnimation ? 'scale-110' : 'scale-100'}`}>
            {caller ? (
              <span className="text-white text-lg font-bold">{caller.fullname?.charAt(0).toUpperCase() || 'U'}</span>
            ) : (
              <span className="text-white text-lg font-bold">?</span>
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {caller ? caller.fullname : 'Incoming call'}
            </h3>
            <div className="flex items-center text-white/80 text-sm">
              {incomingCall.type === 'video' ? (
                <><Video size={14} className="mr-1" /> Video Call</>
              ) : (
                <><Phone size={14} className="mr-1" /> Audio Call</>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleReject} 
            className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
          >
            <PhoneOff size={18} className="text-white" />
          </button>
          <button 
            onClick={handleAccept} 
            className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors animate-pulse"
          >
            <Phone size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallNotification;