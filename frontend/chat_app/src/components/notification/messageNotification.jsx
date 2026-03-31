import toast from "react-hot-toast";
import { MessageCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../../store/useChatStore";

function MessageToastContent({ msg, toastId }) {
  const navigate = useNavigate();

  const handleOpenChat = () => {
    const selectedUser = {
      _id: msg.senderId,
      fullname: msg.senderName,
      profilePicture: msg.senderProfilePicture,
    };

    useChatStore.getState().setselectedUser(selectedUser);
    navigate("/");
    toast.dismiss(toastId);
  };

  return (
    <div className="w-[280px] bg-gray-900 text-white rounded-lg shadow-lg border border-gray-700 px-3 py-2">

      {/* Top row */}
      <div className="flex items-center gap-2">
        <img
          src={msg.senderProfilePicture || "avatar.png"}
          alt={msg.senderName}
          className="w-8 h-8 rounded-full object-cover"
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {msg.senderName}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {msg.text}
          </p>
        </div>

        <button
          onClick={() => toast.dismiss(toastId)}
          className="p-1 hover:bg-gray-700 rounded-full"
        >
          <X size={14} />
        </button>
      </div>

      {/* Buttons (compact row) */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleOpenChat}
          className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-xs font-medium py-1.5 rounded-md"
        >
          <MessageCircle size={14} />
          Open
        </button>

        <button
          onClick={() => toast.dismiss(toastId)}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-xs font-medium py-1.5 rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function playMessageToastTone() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(920, audioContext.currentTime);

  gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.18);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.2);

  oscillator.onended = () => {
    audioContext.close().catch(() => {});
  };
}

export function showMessageToast(msg) {
  playMessageToastTone();
  toast.custom(
    (t) => <MessageToastContent msg={msg} toastId={t.id} />,
    {
      duration: 3000,
      position: "top-center",
    }
  );
}