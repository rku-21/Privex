import React from "react";
import { useEffect } from "react";
import "./styles/home.css"; 
import {Navbar} from  "../components/navbar/Navbar.jsx"
import BottomNavbar from "../components/bottomNav/BottomNavbar.jsx"
import { NoChatSelected } from "../components/NoChatSelected.jsx"; 
import {ChatContainer} from "../components/chatContainer/ChatContainer.jsx";
import { useChatStore } from "../store/useChatStore.js";
import { Sidebar } from "../components/sidebar/Sidebar.jsx" 


import { useThemeStore } from "../store/useThemeStore";

export const Home = () => {
  const { selectedUser } = useChatStore();
  const { theme } = useThemeStore();
  return (
    <div className={`parent${theme === "dark" ? " dark-mode" : ""}`}>
      <Navbar />
      <div className={`home-container${theme === "dark" ? " dark-mode" : ""}`}>
        <Sidebar />
        {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
      </div>
      <BottomNavbar />
    </div>
  );
};



