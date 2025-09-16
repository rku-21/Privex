import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./navbar.css"
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import toast from 'react-hot-toast';
import { useChatStore } from '../../store/useChatStore';


export const Navbar = () => {
  const { selectedUser } = useChatStore();
  const Navigate = useNavigate();
  const { logout, authUser, profile } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleMenu = () => {
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
     if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !event.target.classList.contains('menu-toggle')
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);
 const handleLogout=async()=>{
      await logout();
      Navigate("/login");

    }
    const handleProfile=async()=>{
      const User=await profile();
      if(User){
        Navigate("/profile");
      }
      else toast.error("something went wrong");
    }
    const GotoFriends=()=>{
      Navigate("/friends");

    }
    const Goconstruction=()=>{
      Navigate("/construction");
    }
    const Gosettings=()=>{
      Navigate("/settings");
    }
    const Goinvite = () => {
  const appLink = "https://your-app-link.com"; 
  const shareData = {
    title: "Privex - Chat App",
    text: "🚀 Hey! Check out Privex, a private chat app I'm using. Join me here 👇",
    url: appLink,
  };

  if (navigator.share) {
    navigator.share(shareData)
  
  } else {
 
    navigator.clipboard.writeText(appLink);
    alert("🔗 Link copied! Share it with your friends.");
  }
};

    
 return (
    <div className={`Navbar ${selectedUser ? `topNav-no-small-screen` : ''}`}> 
      <div className="logo-area">
        🔒 <span className="privex-text">&nbsp;&nbsp;&nbsp;Privex</span>
      </div>


      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className={"darkmode-switch" + (theme === "dark" ? " dark" : "")}
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          style={{ margin: 0, border: 'none', background:'', boxShadow: 'none' }}
        >
          <span className="slider"></span>
        </button>
        <div className="menu-toggle" onClick={toggleMenu}>
          ☰
        </div>
      </div>

      {isOpen && (
        <div className="dropdown show" ref={dropdownRef} id="dropdown">
          <ul>
            <li onClick={handleProfile}>👤 Profile</li>
            <li onClick={Goconstruction}>🔒 Privacy</li>
            <li onClick={Gosettings}>⚙️ Settings</li>
            <li onClick={GotoFriends}> <i className="fa-solid fa-user-group"></i>&nbsp;&nbsp;&nbsp;friends</li>
            <li onClick={Goinvite}>📨 Invite Friends</li>
            <li>📞 Contact Us</li>
            <li onClick={handleLogout}>🚪 Logout</li>
          </ul>
        </div>
      )}
    </div>
  );
};

