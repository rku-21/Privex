
import { X } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import "./ChatHeader.css";

export const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  // Always show Privex Bot as online
  const isOnline = selectedUser.fullname === "Privex Bot" || onlineUsers.includes(selectedUser._id);

  return (
    <div className="chat-header">
      <div className="chat-header-inner">
        <div className="chat-header-left">
          <div className="chat-avatar">
            <div className="chat-avatar-img-wrapper">
              <img
                src={selectedUser.profilePicture || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>
          <div className="chat-user-info">
            <h2 className="chat-user-name">{selectedUser.fullname}</h2>
            <p className="chat-user-status">{isOnline ? "Online" : "Offline"}</p>
          </div>
        </div>
        <button className="fa-regular fa-circle-xmark chat-close-btn"
          onClick={() => setSelectedUser(null)}>
        </button>
      </div>
    </div>
  );
};

