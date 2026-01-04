import React, { useState, useEffect } from 'react';
import AssistantCharacter from './AssistantCharacter';

const NoChatAssistant = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const messages = [
    {
      message: "Pick a friend from the sidebar and start an amazing conversation!",
    },
    {
      message: "Select someone from your friend list to begin messaging.",
    },
    {
      message: "Choose a friend and say hi. Every conversation starts somewhere!",
    },
    {
      message: "Tap on any friend to start chatting. They're waiting to hear from you!",
    },
    {
      message: "Your friends are just a click away. Select one and start messaging!",
    },
    {
      message: "Click on a friend's name to open the chat and share your thoughts.",
    },
    {
      message: "Every blank canvas needs a first stroke. Pick a friend and start chatting!",
    },
    {
      message: "Select a friend from the list and let the conversation unfold.",
    },
    {
      message: "Choose someone special from your friends and brighten their day with a message!",
    },
    {
      message: "Your friends are online! Click on anyone to start an electrifying chat.",
    },
    {
      message: "Select a friend and let the entertainment begin. Great chats await!",
    },
    {
      message: "Choose a friend and surprise them with a message. Make their day special!",
    }
  ];

  useEffect(() => {
    // Pick a random message
    const randomIndex = Math.floor(Math.random() * messages.length);
    setCurrentMessage(messages[randomIndex]);

    // Slide in after a short delay
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      setIsWaving(true);
    }, 300);

    // Stop waving after 3 seconds
    const waveTimer = setTimeout(() => {
      setIsWaving(false);
    }, 3300);

    // Blink periodically
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(waveTimer);
      clearInterval(blinkInterval);
    };
  }, []);

  if (!currentMessage || isDismissed) return null;

  return (
    <div className="absolute bottom-4 sm:bottom-6 right-2 sm:right-6 z-50">
      <div
        className={`flex items-center gap-2 sm:gap-3 transition-all duration-700 ease-out ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        {/* Message Card */}
        <div className="relative bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl p-2 pr-6 sm:p-3 sm:pr-8 w-[280px] sm:max-w-xs border border-gray-700">
          {/* Close Button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-1 right-1 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-full transition-colors text-xs sm:text-base"
          >
            ×
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-gray-200 font-medium leading-tight">
                {currentMessage.message}
              </p>
            </div>
          </div>
        </div>

        {/* Character - Smaller */}
        <div className="transform scale-50 sm:scale-75">
          <AssistantCharacter isWaving={isWaving} isBlinking={isBlinking} />
        </div>
      </div>
    </div>
  );
};

export default NoChatAssistant;
