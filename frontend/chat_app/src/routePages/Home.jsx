import React from "react";
import { useEffect } from "react";
import "./styles/Home.css"; 
import {Navbar} from  "../components/navbar/Navbar.jsx"
import BottomNavbar from "../components/bottomNav/BottomNavbar.jsx"
import { NoChatSelected } from "../components/NoChatSelected.jsx"; 
import {ChatContainer} from "../components/chatContainer/ChatContainer.jsx";
import { useChatStore } from "../store/useChatStore.js";
import { Sidebar } from "../components/sidebar/Sidebar.jsx" 

 export const Home = () => {
  const {selectedUser}=useChatStore();
return (
    <div className="parent">
    <Navbar/>
    <div className={`home-container`} >
    <Sidebar/>
    {!selectedUser ?<NoChatSelected/>:<ChatContainer/>}
      </div>
   <BottomNavbar/>
    
    </div>
  );
};



