
export const handleAudioState = {
  toggleAudioTrack: (stream) => {
    if (!stream) {
      console.error("No stream");
      return;
    }
    
    const audioTracks = stream.getAudioTracks();
   
    
    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
      
    });
  },

  
  enableAudioTracks: (stream) => {
    if (!stream) {
      console.error("No stream");
      return;
    }
    
    const audioTracks = stream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = true;
     
    });
  },

  
  debugAudioTracks: (stream) => {
    if (!stream) {
      console.error("No stream");
      return;
    }
    
    const audioTracks = stream.getAudioTracks();
    console.log(`Found ${audioTracks.length} audio tracks`);
    
    audioTracks.forEach(track => {
      console.log("Audio Track:", {
        id: track.id,
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      });
    });
  }
};