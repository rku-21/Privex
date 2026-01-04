import React from "react";

export const NoChatSelected = () => {
  return (
    <div className="hidden md:flex flex-1 h-full items-center justify-center text-white text-center p-6 relative">
      <div className="max-w-md">
        <div className="text-6xl mb-4">💬</div>
        <h1 className="text-3xl font-bold mb-2">Welcome to Privex!</h1>
        <p className="text-lg opacity-90">
          Nobody likes an empty inbox. Pick someone to start chatting
        </p>
      </div>
    </div>
  );
};


