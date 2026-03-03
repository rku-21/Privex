import React, { useEffect, useState } from 'react';
import { Phone, Video, PhoneOff } from 'lucide-react';
import { useCallStore } from '../../store/useCallStore';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';




const IncomingCallNotification = () => {
 
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

  
  useEffect(() => {
    
    
   
    const unsubscribe = useCallStore.subscribe(
      (state) => [state.isReceivingCall, state.incomingCall],
      ([newIsReceiving, newIncoming], [prevIsReceiving, prevIncoming]) => {
      if (prevIsReceiving !== newIsReceiving || !!prevIncoming !== !!newIncoming) {
          setRing(false); 
        }
      }
    );
    
   
    const handleCallEnded = () => {
       useCallStore.setState({
        isReceivingCall: false,
        incomingCall: null
      });
    };
    
   
    window.addEventListener('call-ended', handleCallEnded);
    
   
    const interval = setInterval(() => {
      const state = useCallStore.getState();
      if (state.isReceivingCall && Date.now() - window._lastIncomingCallTime > 60000) {
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
    return null;
  }
  
  

  const { from, callType } = incomingCall;
  const callerName = from?.fullname || 'Unknown';

  const handleAccept = async () => {
     await acceptCall();
    navigate('/', { state: { directCall: true, callerId: from?._id } });
  };

  const handleReject = () => {
    rejectCall();
    setCallWithWhom({});
    toast.success('Call rejected');
   
  };

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: '95%',
        maxWidth: '384px',
        background: 'linear-gradient(to right, rgb(37, 99, 235), rgb(147, 51, 234))',
        padding: '16px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        animation: 'slideDown 0.3s ease-out'
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">

       
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

