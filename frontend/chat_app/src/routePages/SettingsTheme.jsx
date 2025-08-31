import { THEMES } from "../constants/index.js";
import { useThemeStore } from "../store/useThemeStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { Send } from "lucide-react";
import "./styles/Settings.css"; 

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

 export const SettingsTheme = () => {
  const {authUser}=useAuthStore();
  const { theme, setTheme } = useThemeStore();


  return (
    <div className="settings-container">
      <div className="settings-content">
        <div className="theme-header">
          <h2 className="theme-title">Theme</h2>
          <p className="theme-description">Choose a theme for your chat interface</p>
        </div>

        <div className="theme-grid">
          {THEMES.map((t) => (
            <button
              key={t}
              className={`theme-button ${theme === t ? "active" : ""}`}
              onClick={() => setTheme(t)}
            >
              <div className="theme-preview" data-theme={t}>
                <div className="theme-colors">
                  <div className="color-box primary"></div>
                  <div className="color-box secondary"></div>
                  <div className="color-box accent"></div>
                  <div className="color-box neutral"></div>
                </div>
              </div>
              <span className="theme-name">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
            </button>
          ))}
        </div>
        <div className="chat-preview-wrapper">
          <div className="chat-preview-container">
            <div className="chat-ui">
              
              <div className="chat-header">
                <div className="chat-user">
                  <div className="user-avatar">J</div>
                  <div>
                    <h3 className="user-name">{authUser.fullname}</h3>
                    <p className="user-status">Online</p>
                  </div>
                </div>
              </div>

              
              <div className="chat-messages">
                {PREVIEW_MESSAGES.map((message) => (
                  <div key={message.id} className={`chat-message ${message.isSent ? "sent" : "received"}`}>
                    <div className={`chat-bubble ${message.isSent ? "bubble-sent" : "bubble-received"}`}>
                      <p className="message-text">{message.content}</p>
                      <p className="message-time">12:00 PM</p>
                    </div>
                  </div>
                ))}
              </div>

              
              <div className="chat-input">
                <input
                  type="text"
                  className="chat-textbox"
                  placeholder="Type a message..."
                  value="This is a preview"
                  readOnly
                />
                <button className="send-button">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



