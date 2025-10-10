import React, { useEffect, useState } from 'react';
import './IndianFlagToast.css';

const IndianFlagToast = ({ t, message, type }) => {
  const [showText, setShowText] = useState(false);
  const [visibleChars, setVisibleChars] = useState(0);
  
  useEffect(() => {
    // First show the flag animation
    setTimeout(() => {
      setShowText(true);
    }, 300);
    
    // Then start revealing text character by character
    if (showText && message) {
      const interval = setInterval(() => {
        setVisibleChars(prev => {
          if (prev < message.length) {
            return prev + 1;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 30); // Speed of text reveal
      
      return () => clearInterval(interval);
    }
  }, [showText, message]);
  
  const visibleText = message ? message.substring(0, visibleChars) : '';
  
  // Icon based on toast type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'loading':
        return '⟳';
      default:
        return 'ℹ';
    }
  };
  
  return (
    <div className={`indian-flag-toast ${showText ? 'unfurled' : ''}`}>
      <div className="flag-container">
        <div className="flag-stripe saffron"></div>
        <div className="flag-stripe white">
          <div className="chakra">
            <div className="chakra-wheel"></div>
          </div>
        </div>
        <div className="flag-stripe green"></div>
      </div>
      <div className="toast-content">
        <div className="toast-icon">{getIcon()}</div>
        <div className="toast-message">{visibleText}</div>
      </div>
    </div>
  );
};

export default IndianFlagToast;