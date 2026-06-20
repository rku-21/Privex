import React from "react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { Navbar } from "../components/navbar/Navbar.jsx"
import BottomNavbar from "../components/bottomNav/BottomNavbar.jsx"
import { NoChatSelected } from "../components/NoChatSelected.jsx";
import ChatContainer from "../components/chatContainer/ChatContainer.jsx";
import { useChatStore } from "../store/useChatStore.js";
import { Sidebar } from "../components/sidebar/Sidebar.jsx"


import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";


export const Home = () => {
  const { selectedUser, setselectedUser, getAllunreadMessages } = useChatStore();
  const { theme } = useThemeStore();
  const location = useLocation();
  
  
  useEffect(() => {
    if (location.state?.directCall && location.state?.callerId) {
      const callerFromState = location.state?.caller;
      setselectedUser(callerFromState || location.state.callerId);
    }
  }, [location.state, setselectedUser]);

  return (
  <div className={`parent bg-bg ${theme === "dark" ? "dark-mode" : ""}`}>
    <Navbar />
    <div
      className={`flex w-full ${
        selectedUser ? "h-[100vh] md:h-[calc(100vh-130px)]" : "h-[calc(100vh-130px)]"
      }`}
    >
      <Sidebar />
      <div className="flex-1 min-w-0 h-full relative">
        {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
      </div>
    </div>
    <BottomNavbar />
  </div>
);
};



