import React, { useEffect, useState } from 'react';
import { Phone, Video, PhoneOff } from 'lucide-react';
import { useCallStore } from '../../store/useCallStore';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';




const IncomingCallNotification = () => {
  // Use the full store to ensure we get all updates
  const callStore = useCallStore();

  const { isReceivingCall, incomingCall, acceptCall, rejectCall,setCallWithWhom } = callStore;
  const [ring, setRing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("IncomingCallNotification state changed:", { isReceivingCall, incomingCall });
    
    if (isReceivingCall && incomingCall) {
      console.log("Starting ring timer");
      const timer = setInterval(() => setRing(r => !r), 700);
      return () => {
        console.log("Clearing ring timer");
        clearInterval(timer);
      };
    }
  }, [isReceivingCall, incomingCall]);

  // Extra useEffect to monitor state changes from the store
  useEffect(() => {
    console.log("⚠️⚠️⚠️ Setting up direct state listener in IncomingCallNotification");
    
    // Subscribe to the call store to detect state changes
    const unsubscribe = useCallStore.subscribe(
      (state) => [state.isReceivingCall, state.incomingCall],
      ([newIsReceiving, newIncoming], [prevIsReceiving, prevIncoming]) => {
        console.log("⚠️⚠️⚠️ CALL STORE STATE CHANGE DETECTED IN NOTIFICATION:", 
          { prev: { isReceiving: prevIsReceiving, hasIncoming: !!prevIncoming }, 
            new: { isReceiving: newIsReceiving, hasIncoming: !!newIncoming } });
            
        // Force re-render the component on any state changes
        if (prevIsReceiving !== newIsReceiving || !!prevIncoming !== !!newIncoming) {
          console.log("⚠️⚠️⚠️ FORCING COMPONENT UPDATE");
          setRing(false); // Change state to force re-render
        }
      }
    );
    
    // Setup a global listener for call-ended events
    const handleCallEnded = () => {
      console.log("⚠️⚠️⚠️ GLOBAL CALL-ENDED EVENT CAPTURED");
      useCallStore.setState({
        isReceivingCall: false,
        incomingCall: null
      });
    };
    
    // Add global event listener as a fallback
    window.addEventListener('call-ended', handleCallEnded);
    
    // Setup interval to check for stale call state
    const interval = setInterval(() => {
      const state = useCallStore.getState();
      if (state.isReceivingCall && Date.now() - window._lastIncomingCallTime > 60000) {
        console.log("⚠️⚠️⚠️ DETECTED STALE CALL STATE, RESETTING");
        useCallStore.setState({
          isReceivingCall: false,
          incomingCall: null
        });
      }
    }, 5000);
    
    return () => {
      unsubscribe();
      window.removeEventListener('call-ended', handleCallEnded);
      clearInterval(interval);
    };
  }, []);

  if (!isReceivingCall || !incomingCall) {
    console.log("Not rendering IncomingCallNotification: conditions not met");
    return null;
  }
  
  console.log("Rendering IncomingCallNotification");

  const { from, callType } = incomingCall;
  const callerName = from?.fullname || 'Unknown';
 
  console.log("Set onCallWithWhom in store:", callStore.onCallWithWhom);

  const handleAccept = async () => {
   

    await acceptCall();
    navigate('/', { state: { directCall: true, callerId: from?._id } });
  };

  const handleReject = () => {
    rejectCall();
    setCallWithWhom({});
    toast.success('Call rejected');
    // 
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] 
  bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-lg animate-slideDown 
  w-[90%] sm:w-full md:w-[380px] lg:w-[360px] rounded-2xl">

      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">

          {/* Profile Picture with Link */}
          <Link
            to={`/profile/${from?._id}`}
            className={`w-12 h-12 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform ${
              ring ? 'scale-110' : 'scale-100'
            }`}
          >
            {from?.profilePicture ? (
              <img
                src={from.profilePicture}
                alt={callerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-lg font-bold">
                {callerName.charAt(0).toUpperCase()}
              </span>
            )}
          </Link>

          {/* Caller Info */}
          <div>
            <h3 className="text-white font-semibold">{callerName}</h3>
            <div className="flex items-center text-white/80 text-sm">
              {callType === 'video' ? (
                <>
                  <Video size={14} className="mr-1" /> Video Call
                </>
              ) : (
                <>
                  <Phone size={14} className="mr-1" /> Audio Call
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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

