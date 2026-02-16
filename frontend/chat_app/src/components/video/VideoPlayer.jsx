import React, { useEffect } from 'react';
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


    if (videoElement.srcObject !== stream) {

      if (enableDebug) {
         console.log(`VideoPlayer stream has tracks`, stream.getTracks().map(t =>
          `${t.kind}:${t.id} (${t.enabled ? 'enabled' : 'disabled'})`
        ));
      }


      videoElement.srcObject = stream;


      videoElement.muted = muted;


      const playVideo = async () => {
        try {
          await videoElement.play();
          if (enableDebug) {
            console.log('video playing successfully');
          }
        } catch (err) {
          console.warn('Failed to play video:', err.message);
        }
      };

      if (autoPlay) {
        playVideo();
      }
    } else if (enableDebug) {
      console.log('stream already attached skipping re-attach');
    }


    stream.getVideoTracks().forEach(track => {
      if (!track.enabled) {
        track.enabled = true;
        if (enableDebug) {
          console.log(`forced video track ${track.id} enabled`);
        }
      }
    });

    return () => {

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