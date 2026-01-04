import React, { useState, useEffect } from 'react';
import AssistantCharacter from './AssistantCharacter';

const NoFriendsAssistant = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const messages = [
    {
      message: "Every great friendship starts with a simple 'hello'. Don't be shy!",
    },
    {
      message: "Your journey begins here! Search for people and start building your community.",
    },
    {
      message: "Hit the search button and find amazing people to chat with. You got this!",
    },
    {
      message: "Don't worry! Your friend list will be buzzing soon. Start by adding someone!",
    },
    {
      message: "Every expert was once a beginner. Search for users and send friend requests!",
    },
    {
      message: "Start searching and connect with people who share your interests.",
    },
    {
      message: "Tap the search icon and discover awesome people waiting to connect with you!",
    },
    {
      message: "Your friend list is empty, but your potential is limitless! Start exploring.",
    },
    {
      message: "Everyone loves making new friends. Use the search feature to find your crew!",
    },
    {
      message: "Your friend list won't fill itself! Go ahead and send some friend requests.",
    },
    {
      message: "Start small, dream big! Add your first friend and watch your network grow.",
    },
    {
      message: "Your first friend could become your best friend. Start searching now!",
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
    }, 500);

    // Stop waving after 3 seconds
    const waveTimer = setTimeout(() => {
      setIsWaving(false);
    }, 3500);

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
    <div className="fixed bottom-20 right-2 sm:right-4 z-40">
      <div
        className={`flex items-center gap-2 sm:gap-3 transition-all duration-700 ease-out ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        {/* Message Card */}
        <div className="relative bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl p-2 pr-6 sm:p-3 sm:pr-8 w-[280px] sm:max-w-sm border border-gray-700">
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

export default NoFriendsAssistant;
