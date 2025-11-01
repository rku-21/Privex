// Audio handling functions for WebRTC calls
export const handleAudioState = {
  // Toggle audio track enabled state
  toggleAudioTrack: (stream) => {
    if (!stream) {
      console.error("No stream provided to toggle audio");
      return;
    }
    
    const audioTracks = stream.getAudioTracks();
    console.log("Found audio tracks:", audioTracks.length);
    
    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
      console.log(`Audio track ${track.id} enabled:`, track.enabled);
    });
  },

  // Ensure audio tracks are enabled
  enableAudioTracks: (stream) => {
    if (!stream) {
      console.error("No stream provided to enable audio");
      return;
    }
    
    const audioTracks = stream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = true;
      console.log(`Audio track ${track.id} enabled`);
    });
  },

  // Debug audio track state
  debugAudioTracks: (stream) => {
    if (!stream) {
      console.error("No stream provided for debug");
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