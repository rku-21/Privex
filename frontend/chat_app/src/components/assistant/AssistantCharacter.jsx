import React from 'react';

const AssistantCharacter = ({ isWaving = false, isBlinking = false }) => {
  return (
    <div className="relative w-24 h-24">
      
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-12 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-t-3xl rounded-b-lg shadow-lg">
        
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-5 bg-indigo-300 rounded-full opacity-70"></div>
        
        <div className="absolute top-3 left-1/2 -translate-x-1/2 space-y-1">
          <div className="w-1 h-1 bg-indigo-300 rounded-full mx-auto"></div>
          <div className="w-1 h-1 bg-indigo-300 rounded-full mx-auto"></div>
        </div>
      </div>

      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-18 h-16 bg-gradient-to-b from-amber-100 to-amber-200 rounded-full shadow-lg">
        
        
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-7 bg-gradient-to-b from-amber-900 to-amber-800 rounded-t-full"></div>
        <div className="absolute top-1 left-0.5 w-4 h-5 bg-amber-800 rounded-full"></div>
        <div className="absolute top-1 right-0.5 w-4 h-5 bg-amber-800 rounded-full"></div>
        
        
        <div className="absolute top-6 left-3 w-3.5 h-3.5">
          <div className={`w-full bg-gray-800 rounded-full transition-all duration-150 ${
            isBlinking ? 'h-0.5' : 'h-full'
          }`}>
            {!isBlinking && (
              <>
                <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
              </>
            )}
          </div>
        </div>
        
        
        <div className="absolute top-6 right-3 w-3.5 h-3.5">
          <div className={`w-full bg-gray-800 rounded-full transition-all duration-150 ${
            isBlinking ? 'h-0.5' : 'h-full'
          }`}>
            {!isBlinking && (
              <>
                <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
              </>
            )}
          </div>
        </div>
        
        
        <div className="absolute top-8 left-0.5 w-2.5 h-2 bg-pink-400 rounded-full opacity-70"></div>
        <div className="absolute top-8 right-0.5 w-2.5 h-2 bg-pink-400 rounded-full opacity-70"></div>
        
        
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-5 h-2.5 border-b-2 border-gray-700 rounded-b-full"></div>
        
        
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-1 h-1.5 bg-amber-300 rounded-full"></div>
      </div>

      
      <div className="absolute bottom-2 -left-1 w-3.5 h-7 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full origin-top shadow-md">
      </div>

      
      <div 
        className={`absolute bottom-2 -right-1 w-3.5 h-7 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full origin-bottom shadow-md ${
          isWaving ? 'animate-wave' : ''
        }`}
      >
       
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-amber-200 rounded-full shadow-sm">
          <div className="absolute top-1 left-0.5 w-0.5 h-1.5 bg-amber-300 rounded-full"></div>
          <div className="absolute top-0.5 left-1.5 w-0.5 h-2 bg-amber-300 rounded-full"></div>
          <div className="absolute top-1 right-0.5 w-0.5 h-1.5 bg-amber-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default AssistantCharacter;
