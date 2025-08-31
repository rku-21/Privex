import { useRef , useEffect } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ChatHeader } from '../chatHeader/ChatHeader.jsx'
import { MessageInput } from '../MessageInput/MessageInput.jsx';
import MessageSkeleton from '../../Skeleton/MessagesSkelton';
import './chatContainer.css';
import { formatMessageTime } from '../../lib/utlis';

export const ChatContainer = () => {
  const { authUser } = useAuthStore();
  const { messages, getMessages, isMessagesLoding, selectedUser, SubscribeToMessages,unsubscribeToMessages} = useChatStore();

  const messagesEndRef = useRef(null); 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom(); 
  }, [messages]);

  

  useEffect(() => {
    getMessages(selectedUser._id);
    SubscribeToMessages();
    return ()=> unsubscribeToMessages();
    
  }, [selectedUser._id, getMessages,SubscribeToMessages, unsubscribeToMessages]);

  if (isMessagesLoding) return <MessageSkeleton />;

  return (
    <div className='Chat-container'>
       <ChatHeader />
    
     
      <div className="Chat-messages">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat-message ${message.senderId === authUser._id ? 'sent' : 'received'}`}
            ref={messagesEndRef}
          >
            <img
              src={
                message.senderId === authUser._id
                  ? authUser.profilePicture || 'avatar.png'
                  : selectedUser.profilePicture || 'avatar.png'
              }
              className="avatar-chat-container"
              alt="User"
            />
            <div className="message-content">
             
              {message.image && <img src={message.image} alt="Attachment" className="message-image" />}
              {message.text && <p className="message-text">{message.text}</p>}
             
              <span className="message-time">{formatMessageTime(message.createdAt)}</span> 
             </div>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>
    <MessageInput />
    </div>
  );
};

