import React, { useEffect } from 'react';

// This component wraps video elements and ensures they play properly
const VideoPlayer = ({ 
  videoRef, 
  stream, 
  muted = false, 
  autoPlay = true, 
  className = '', 
  onClick = null,
  enableDebug = false
}) => {
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !stream) return;

    // Log for debugging
    if (enableDebug) {
      console.log(`VideoPlayer: attaching stream ${stream.id}`);
      console.log(`VideoPlayer: stream has tracks:`, stream.getTracks().map(t => 
        `${t.kind}:${t.id} (${t.enabled ? 'enabled' : 'disabled'})`
      ));
    }

    // Set stream to element
    videoElement.srcObject = stream;
    
    // Force enable all video tracks
    stream.getVideoTracks().forEach(track => {
      if (!track.enabled) {
        track.enabled = true;
        if (enableDebug) {
          console.log(`VideoPlayer: forced video track ${track.id} enabled`);
        }
      }
    });

    // Set muted property
    videoElement.muted = muted;

    // Play the video
    const playVideo = async () => {
      try {
        await videoElement.play();
        if (enableDebug) {
          console.log('VideoPlayer: video playing successfully');
        }
      } catch (err) {
        console.warn('VideoPlayer: Failed to play video:', err.message);
      }
    };

    if (autoPlay) {
      playVideo();
    }

    return () => {
      // Cleanup when unmounted
      if (videoElement.srcObject) {
        videoElement.srcObject = null;
      }
    };
  }, [videoRef, stream, muted, autoPlay, enableDebug]);

  const hasVideoTracks = stream?.getVideoTracks().length > 0;

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className={`w-full h-full object-cover bg-black ${className}`}
        playsInline
        autoPlay={autoPlay}
        muted={muted}
        onClick={onClick}
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-xs">
          No Stream
        </div>
      )}
      {stream && !hasVideoTracks && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-xs">
          Audio Only
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;