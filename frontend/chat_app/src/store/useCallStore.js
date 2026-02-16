import { create } from "zustand";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { use, useEffect } from "react";
import { useChatStore } from "./useChatStore";

export const useCallStore = create((set, get) => ({
  peerConnection: null,
  localStream: null,
  remoteStream: new MediaStream(),
  incall: false,
  callType: null,
  isReceivingCall: false,
  incomingCall: null,
  isMuted: false,
  isInitiating: false,
  isCallAccepted: false,
  onCallWithWhom: {},
  callTimeout: null,
  currentCallId: null,

  initRingtone: () => {
    if (typeof window !== 'undefined' && !get().ringtoneAudio) {
      const audio = new Audio('/sounds/callingTime.mp3');
      audio.loop = true;
      set({ ringtoneAudio: audio });
    }
  },


  playRingtone: () => {
    const { ringtoneAudio, initRingtone } = get();
    if (!ringtoneAudio) {
      initRingtone();
    }
    const audio = get().ringtoneAudio;
    if (audio) {
      audio.play().catch(err => {
        toast.error("Could not play ringtone");
      });
    }
  },


  stopRingtone: () => {
    const { ringtoneAudio } = get();
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
    }
  },

  ringtoneAudio: null,


  setlocalStream: (stream) => set({ localStream: stream }),
  setremoteStream: (stream) => set({ remoteStream: stream }),
  setPeerConnection: (pc) => set({ peerConnection: pc }),
  setInCall: (value) => set({ incall: value }),
  setCallType: (type) => set({ callType: type }),
  setCurrentCallId: (id) => set({ currentCallId: id }),
  setPendingIce: (ice) => set({ pendingIce: ice }),


  endCall: () => {

    const { localStream, peerConnection, callTimeout, currentCallId } = get();
    const socket = useAuthStore.getState().socket;


    get().stopRingtone();



    if (callTimeout) {
      clearTimeout(callTimeout);
    }

    if (localStream) localStream.getTracks().forEach(track => track.stop());
    if (peerConnection) peerConnection.close();


    const remoteStream = get().remoteStream;
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        remoteStream.removeTrack(track);
        track.stop();
      });
    }


    if (socket && currentCallId) {
      socket.emit("call-ended", { callId: currentCallId });

    }


    set({
      peerConnection: null,
      localStream: null,

      incall: false,
      callType: null,
      isReceivingCall: false,
      incomingCall: null,
      isInitiating: false,
      isCallAccepted: false,
      onCallWithWhom: null,
      callTimeout: null,
      currentCallId: null,
      pendingIce: []
    });

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }


  },

  handleCallEnded: (reason = '') => {
    const { localStream, peerConnection, remoteStream } = get();
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    if (peerConnection) {
      peerConnection.close();
    }


    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        remoteStream.removeTrack(track);
        track.stop();
      });
    }


    set({
      peerConnection: null,
      localStream: null,

      incall: false,
      callType: null,
      isReceivingCall: false,
      incomingCall: null,
      isInitiating: false,
      isCallAccepted: false,
      onCallWithWhom: null,
      currentCallId: null,
      pendingIce: []
    });




    if (reason === 'timeout') {
      toast.error("Call timed out");
    }


  },

  callerSideStateWhenAccepted: () => {
    const { ringtoneAudio, callTimeout } = get();


    get().stopRingtone();
    if (callTimeout) {
      clearTimeout(callTimeout);
    }

    set({
      isCallAccepted: true,
      isInitiating: false,
      incall: true,
      callTimeout: null
    });
    toast.success("Call has been accepted");
  },
  handleIncomingCall: (data) => {
    if (!data || !data.from || !data.offer || !data.callId) {
      return;
    }
    const callType = data.callType || data.type || "audio";
    set({
      isReceivingCall: true,
      incomingCall: {
        callId: data.callId,
        from: data.from,
        offer: data.offer,
        callType: callType
      },
      currentCallId: data.callId
    });
    set({
      onCallWithWhom: {
        fullname: data.from?.fullname,
        profilePicture: data.from?.profilePicture
      }
    });
  },


  initiateCall: async (receiverId, callType) => {
    const socket = useAuthStore.getState().socket;


    get().initRingtone();
    setTimeout(() => {
      get().playRingtone();
    }, 100);



    set({ callType: callType, incall: true, isInitiating: true });

    try {

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ]
      });


      set({ peerConnection: pc });


      const constraints = callType === "video" ? { video: true, audio: true } : { audio: true };
      const localStream = await navigator.mediaDevices.getUserMedia(constraints);
      set({ localStream });
      console.log("Local stream obtained:", localStream);
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });


      const remoteStream = get().remoteStream;

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach(track => {

            const alreadyAdded = remoteStream
              .getTracks()
              .some(t => t.id === track.id);

            if (!alreadyAdded) {

              remoteStream.addTrack(track);
            } else {
              console.log(`Track ${track.id} already in stream`);
            }
          });
        }

      };



      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
          toast.error("Media connection failed");


          if (get().isCallAccepted) {
            setTimeout(() => {
              if (get().isCallAccepted) {
                get().handleCallEnded();
              }
            }, 1000);
          }
        } else if (pc.iceConnectionState === 'connected') {
          console.log("Media connected");
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {

          if (get().isCallAccepted) {
            setTimeout(() => {
              if (get().isCallAccepted) {
                get().handleCallEnded();
              }
            }, 1000);
          }
        }
      };


      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const { currentCallId, pendingIce } = get();
          if (!currentCallId) {
            if (pendingIce.length < 20) {
              pendingIce.push(event.candidate);
              set({ pendingIce: [...pendingIce] });
            }
            return;
          }
          socket.emit("ice-candidate", {
            callId: currentCallId,
            candidate: event.candidate,
          });

        }
      };



      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("call-user", {
        to: receiverId,
        offer: offer,
        callType: callType,
        from: useAuthStore.getState().authUser._id,
      });
      const targetUser = useChatStore.getState().friends.find((friend) => friend._id === receiverId);
      set({
        onCallWithWhom: {
          fullname: targetUser?.fullname,
          profilePicture: targetUser?.profilePicture
        }
      });

    } catch (error) {
      toast.error("Error initiating call");
      set({ inCall: false });
    }
  },


  acceptCall: async () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCall } = get();

    if (!incomingCall) {
      return Promise.reject("No incoming call to accept");
    }

    const { callId, from, offer, callType } = incomingCall;
    const callerId = typeof from === 'object' && from !== null ? from._id : from;

    try {

      let pc = get().peerConnection;
      if (!pc) {
        pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ]
        });
        set({ peerConnection: pc });
      }


      let localStream = get().localStream;
      if (!localStream) {
        const constraints = callType === "video" ? { video: true, audio: true } : { audio: true };
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        set({ localStream });


        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
        });
      }


      const remoteStream = get().remoteStream;



      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach(track => {

            const alreadyAdded = remoteStream
              .getTracks()
              .some(t => t.id === track.id);

            if (!alreadyAdded) {
              remoteStream.addTrack(track);
              if (track.kind === 'audio') {
                console.log("Audio Track State:", {
                  id: track.id,
                  label: track.label,
                  enabled: track.enabled,
                  muted: track.muted,
                  readyState: track.readyState
                });
              }
            } else {
              console.log(`Track ${track.id} already in stream, skipping`);
            }
          });
        }
        event.track.onended = () => {
          console.log(`Remote track ${event.track.kind} ended`);
        };


        event.track.onmute = () => {
          console.log(`Remote track ${event.track.kind} muted`);
        };


        event.track.onunmute = () => {
          console.log(`Remote track ${event.track.kind} unmuted`);
        };
      };


      pc.oniceconnectionstatechange = () => {
        console.log(`ICE connection state changed: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
          toast.error("Media connection failed or disconnected");


          if (get().isCallAccepted) {
            console.log("Call ended due to ICE connection state" + pc.iceConnectionState);
            setTimeout(() => {
              if (get().isCallAccepted) {
                get().handleCallEnded();
              }
            }, 1000);
          }
        } else if (pc.iceConnectionState === 'connected') {
          console.log("Media connected");
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`Connection state changed: ${pc.connectionState}`);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {

          if (get().isCallAccepted) {
            setTimeout(() => {
              if (get().isCallAccepted) {
                get().handleCallEnded();
              }
            }, 1000);
          }
        }
      };


      pc.onicecandidate = (event) => {
        if (event.candidate) {
          if (!callId) {
            return;
          }
          socket.emit("ice-candidate", {
            callId: callId,
            candidate: event.candidate,
          });

        }
      };
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer-call", {
        callId: callId,
        answer: answer,
      });


      set({
        callType: callType,
        incall: true,
        isReceivingCall: false,
        incomingCall: null,
        isCallAccepted: true,
        isInitiating: false
      });
      toast.success("Call connected");
      return Promise.resolve();

    } catch (error) {

      toast.error("Failed to accept call: " + error.message);
      set({ incall: false });
      return Promise.reject(error);
    }
  },

  rejectCall: () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCall } = get();

    if (!incomingCall) {
      return;
    }
    const { callId } = incomingCall;



    socket.emit("reject-call", { callId: callId });


    set({
      isReceivingCall: false,
      incomingCall: null,
      onCallWithWhom: null,
      callTimeout: null,
      callType: null,
      isInitiating: false,
      isCallAccepted: false,
      currentCallId: null,
      pendingIce: []
    });


  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (!localStream) {
      return;
    }

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      return;
    }

    const newMuteState = !isMuted;
    audioTracks.forEach(track => {
      const oldState = track.enabled;
      track.enabled = !newMuteState;
      console.log(`Audio track ${track.id} changed:`, {
        label: track.label,
        oldState: oldState,
        newState: track.enabled
      });
    });

    set({ isMuted: newMuteState });
    toast.success(newMuteState ? "Microphone muted" : "Microphone unmuted");
  },


  toggleVideo: (isVideoOff) => {
    const { localStream } = get();
    if (!localStream) {
      return;
    }

    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) {
      return;
    }

    videoTracks.forEach(track => {
      track.enabled = !isVideoOff;

    });

    toast.success(isVideoOff ? "Camera turned off" : "Camera turned on");
  },
}));
















