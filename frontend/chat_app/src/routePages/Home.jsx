import React from "react";
import { useEffect } from "react";

import {Navbar} from  "../components/navbar/Navbar.jsx"
import BottomNavbar from "../components/bottomNav/BottomNavbar.jsx"
import { NoChatSelected } from "../components/NoChatSelected.jsx"; 
import ChatContainer from "../components/chatContainer/ChatContainer.jsx";
import { useChatStore } from "../store/useChatStore.js";
import { Sidebar } from "../components/sidebar/Sidebar.jsx" 


import { useThemeStore } from "../store/useThemeStore";

export const Home = () => {
  const { selectedUser } = useChatStore();
  const { theme } = useThemeStore();
  return (
    <div className={`parent${theme === "dark" ? " dark-mode" : ""} `}>
      <Navbar />
      <div
        className={`flex w-full ${
          theme === "dark" ? "dark-mode" : ""
        } ${selectedUser ? "h-[100vh] md:h-[calc(100vh-130px)]" : "h-[calc(100vh-130px)]"}`}
      >
        <Sidebar />
        <div className="flex-1 min-w-0 h-full">
          {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
        </div>
     </div>


      <BottomNavbar />
    </div>
  );
};



