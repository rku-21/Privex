import React, { useState, useEffect } from 'react';
import AssistantCharacter from './AssistantCharacter';

const VirtualAssistant = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    // Slide in after 1 second
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      setIsWaving(true);
    }, 1000);

    // Stop waving after 3 seconds
    const waveTimer = setTimeout(() => {
      setIsWaving(false);
    }, 4000);

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

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 400);
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-end gap-4 transition-all duration-500 ease-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
      }`}
    >
      {/* Speech Bubble */}
      <div className="relative bg-gradient-to-br from-white via-white to-indigo-50 rounded-2xl shadow-2xl p-5 max-w-sm border-2 border-indigo-100">
        {/* Bubble Arrow */}
        <div className="absolute -right-2 bottom-8 w-5 h-5 bg-white border-r-2 border-b-2 border-indigo-100 rotate-[-45deg]"></div>
        
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute -top-3 -right-3 w-7 h-7 bg-gradient-to-br from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 rounded-full flex items-center justify-center text-white hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 text-sm font-bold"
        >
          ×
        </button>

        {/* Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl">👋</span>
            <p className="text-gray-800 font-bold text-lg">
              Hi! Want to test the app?
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 rounded-xl p-4 text-sm border border-indigo-200 shadow-inner">
            <p className="text-gray-700 mb-3 font-semibold flex items-center gap-2">
              <span className="text-lg">🔑</span>
              Demo Accounts - Try it out!
            </p>
            
            {/* Option 1 */}
            <div className="bg-white/80 backdrop-blur rounded-lg p-3 mb-3 border border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-1.5 font-mono text-xs">
                <p className="text-gray-700">
                  <span className="text-indigo-600 font-bold">Email:</span> demo.user@privex.app
                </p>
                <p className="text-gray-700">
                  <span className="text-indigo-600 font-bold">Password:</span> Privex@Demo1
                </p>
              </div>
            </div>
            
            {/* OR Divider */}
            <div className="flex items-center my-2">
              <div className="flex-grow border-t border-indigo-300"></div>
              <span className="flex-shrink-0 px-3 text-xs font-bold text-indigo-600">OR</span>
              <div className="flex-grow border-t border-indigo-300"></div>
            </div>
            
            {/* Option 2 */}
            <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-1.5 font-mono text-xs">
                <p className="text-gray-700">
                  <span className="text-indigo-600 font-bold">Email:</span> demo.friend@privex.app
                </p>
                <p className="text-gray-700">
                  <span className="text-indigo-600 font-bold">Password:</span> Privex@Demo2
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm flex items-center gap-2">
            <span>Feel free to explore!</span>
            <span className="text-xl">🚀</span>
          </p>
        </div>
      </div>

      {/* Character */}
      <div className="animate-float drop-shadow-xl">
        <AssistantCharacter isWaving={isWaving} isBlinking={isBlinking} />
      </div>
    </div>
  );
};

export default VirtualAssistant;
