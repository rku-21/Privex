import React, { useState, useEffect } from 'react';
import { useCallStore } from '../../store/useCallStore';
import { X, ChevronDown, ChevronUp, Wifi, WifiOff, Volume2, VolumeX, Video, VideoOff } from 'lucide-react';

const CallDebugPanel = () => {
  const { 
    debugMode, 
    toggleDebugMode,
    peerConnection, 
    localStream, 
    remoteStream,
    isMuted,
    callType,
    isCallAccepted 
  } = useCallStore();
  
  const [expanded, setExpanded] = useState(true);
  const [stats, setStats] = useState({
    localAudioStatus: 'Unknown',
    localVideoStatus: 'Unknown',
    remoteAudioStatus: 'Unknown',
    remoteVideoStatus: 'Unknown',
    connectionState: 'Unknown',
    iceConnectionState: 'Unknown',
    iceCandidateCount: 0,
    remoteIceCandidateCount: 0,
    lastError: null,
    audioLevel: 0,
    networkStats: null
  });
  
  useEffect(() => {
    
    const intervalId = setInterval(updateStats, 1000);
    return () => clearInterval(intervalId);
  }, [peerConnection, localStream, remoteStream]);
  
  const updateStats = async () => {
    try {
      const newStats = { ...stats };
      
    
      if (localStream) {
        const localAudioTracks = localStream.getAudioTracks();
        const localVideoTracks = localStream.getVideoTracks();
        
        newStats.localAudioStatus = localAudioTracks.length > 0 ? 
          `${localAudioTracks[0].enabled ? 'Enabled' : 'Disabled'} (${localAudioTracks[0].readyState})` : 
          'No audio track';
          
        newStats.localVideoStatus = localVideoTracks.length > 0 ? 
          `${localVideoTracks[0].enabled ? 'Enabled' : 'Disabled'} (${localVideoTracks[0].readyState})` : 
          'No video track';
      } else {
        newStats.localAudioStatus = 'No local stream';
        newStats.localVideoStatus = 'No local stream';
      }
      
     
      if (remoteStream) {
        const remoteAudioTracks = remoteStream.getAudioTracks();
        const remoteVideoTracks = remoteStream.getVideoTracks();
        
        newStats.remoteAudioStatus = remoteAudioTracks.length > 0 ? 
          `Active (${remoteAudioTracks[0].readyState})` : 
          'No audio track';
          
        newStats.remoteVideoStatus = remoteVideoTracks.length > 0 ? 
          `Active (${remoteVideoTracks[0].readyState})` : 
          'No video track';
      } else {
        newStats.remoteAudioStatus = 'No remote stream';
        newStats.remoteVideoStatus = 'No remote stream';
      }
      
      
      if (peerConnection) {
        newStats.connectionState = peerConnection.connectionState || 'Unknown';
        newStats.iceConnectionState = peerConnection.iceConnectionState || 'Unknown';
        
       
        try {
          const rtcStats = await peerConnection.getStats();
          let audioLevel = null;
          let bytesReceived = 0;
          let bytesSent = 0;
          
          rtcStats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'audio') {
              audioLevel = report.audioLevel;
              bytesReceived += report.bytesReceived || 0;
            } else if (report.type === 'outbound-rtp') {
              bytesSent += report.bytesSent || 0;
            }
          });
          
          newStats.audioLevel = audioLevel;
          newStats.networkStats = {
            bytesReceived,
            bytesSent
          };
        } catch (error) {
          console.log('Could not get WebRTC stats:', error);
        }
      } else {
        newStats.connectionState = 'No connection';
        newStats.iceConnectionState = 'No connection';
      }
      
      setStats(newStats);
    } catch (error) {
      console.error('Error updating debug stats:', error);
      setStats({
        ...stats,
        lastError: error.message
      });
    }
  };
  
  if (!debugMode) return null;
  
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-80 bg-gray-800 bg-opacity-90 text-white rounded-lg shadow-lg z-[10000] p-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">Call Debug Panel</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="text-white hover:text-gray-300 transition-colors"
          >
            {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
          <button 
            onClick={toggleDebugMode}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="text-xs space-y-3">
          <div className="flex flex-col bg-gray-700 bg-opacity-50 rounded p-2">
            <h4 className="font-medium mb-1">Call Status</h4>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <span>Call Type:</span>
              <span>{callType || 'Unknown'}</span>
              <span>Call Accepted:</span>
              <span>{isCallAccepted ? 'Yes' : 'No'}</span>
              <span>Connection State:</span>
              <span className={`${
                stats.connectionState === 'connected' ? 'text-green-400' : 
                stats.connectionState === 'failed' || stats.connectionState === 'disconnected' ? 'text-red-400' : 
                'text-yellow-400'
              }`}>
                {stats.connectionState}
              </span>
              <span>ICE Connection:</span>
              <span className={`${
                stats.iceConnectionState === 'connected' || stats.iceConnectionState === 'completed' ? 'text-green-400' : 
                stats.iceConnectionState === 'failed' || stats.iceConnectionState === 'disconnected' ? 'text-red-400' : 
                'text-yellow-400'
              }`}>
                {stats.iceConnectionState}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col bg-gray-700 bg-opacity-50 rounded p-2">
            <h4 className="font-medium mb-1">Local Media</h4>
            <div className="flex items-center mb-1">
              <span className="mr-2">Audio:</span>
              <span className="flex-1 flex items-center">
                {stats.localAudioStatus.includes('Enabled') ? 
                  <Volume2 className="text-green-400 mr-1" size={14} /> : 
                  <VolumeX className="text-red-400 mr-1" size={14} />
                }
                {stats.localAudioStatus}
              </span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">Video:</span>
              <span className="flex-1 flex items-center">
                {stats.localVideoStatus.includes('Enabled') ? 
                  <Video className="text-green-400 mr-1" size={14} /> : 
                  <VideoOff className="text-red-400 mr-1" size={14} />
                }
                {stats.localVideoStatus}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col bg-gray-700 bg-opacity-50 rounded p-2">
            <h4 className="font-medium mb-1">Remote Media</h4>
            <div className="flex items-center mb-1">
              <span className="mr-2">Audio:</span>
              <span className="flex-1 flex items-center">
                {stats.remoteAudioStatus.includes('Active') ? 
                  <Volume2 className="text-green-400 mr-1" size={14} /> : 
                  <VolumeX className="text-red-400 mr-1" size={14} />
                }
                {stats.remoteAudioStatus}
              </span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">Video:</span>
              <span className="flex-1 flex items-center">
                {stats.remoteVideoStatus.includes('Active') ? 
                  <Video className="text-green-400 mr-1" size={14} /> : 
                  <VideoOff className="text-red-400 mr-1" size={14} />
                }
                {stats.remoteVideoStatus}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col bg-gray-700 bg-opacity-50 rounded p-2">
            <h4 className="font-medium mb-1">Network Status</h4>
            <div className="flex items-center">
              <span className="mr-2">Connection:</span>
              <span className="flex-1 flex items-center">
                {stats.iceConnectionState === 'connected' || stats.iceConnectionState === 'completed' ? 
                  <Wifi className="text-green-400 mr-1" size={14} /> : 
                  <WifiOff className="text-red-400 mr-1" size={14} />
                }
                {stats.networkStats ? 
                  `Sent: ${Math.round(stats.networkStats.bytesSent / 1024)} KB, Received: ${Math.round(stats.networkStats.bytesReceived / 1024)} KB` : 
                  'No data'
                }
              </span>
            </div>
          </div>
          
          {stats.lastError && (
            <div className="bg-red-900 bg-opacity-50 p-2 rounded">
              <p>Error: {stats.lastError}</p>
            </div>
          )}
          
          <div className="text-center text-gray-400 text-xs pt-1">
            <p>If you're having issues, try refreshing or check your device permissions</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallDebugPanel;