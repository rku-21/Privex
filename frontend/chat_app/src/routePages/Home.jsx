import React from "react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import {Navbar} from  "../components/navbar/Navbar.jsx"
import BottomNavbar from "../components/bottomNav/BottomNavbar.jsx"
import { NoChatSelected } from "../components/NoChatSelected.jsx"; 
import ChatContainer from "../components/chatContainer/ChatContainer.jsx";
import { useChatStore } from "../store/useChatStore.js";
import { Sidebar } from "../components/sidebar/Sidebar.jsx" 


import { useThemeStore } from "../store/useThemeStore";

export const Home = () => {
  const { selectedUser, setselectedUser, friends, getFriends } = useChatStore();
  const { theme } = useThemeStore();
  const location = useLocation();
  // const { inCall } = useCallStore();
  
  // Fetch friends list
  useEffect(() => {
    getFriends();
  }, []);
  
  // Handle direct call navigation from notification
  useEffect(() => {
    if (location.state?.directCall && location.state?.callerId) {
      // Set the selected user to the caller to open their chat
      setselectedUser(location.state.callerId);
    }
  }, [location.state, setselectedUser]);
  
  // Verify selected user exists in friends list
  useEffect(() => {
    if (selectedUser && friends.length > 0) {
      // Check if selectedUser exists in friends list
      const userExists = typeof selectedUser === 'string' 
        ? friends.some(friend => friend._id === selectedUser)
        : friends.some(friend => friend._id === selectedUser._id);
      
      if (!userExists) {
        console.log("Selected user not found in friends list, clearing selection");
        setselectedUser(null);
      }
    }
  }, [selectedUser, friends, setselectedUser]);
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


      { <BottomNavbar />}
    </div>
  );
};



