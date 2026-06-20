import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useChatStore } from "../../store/useChatStore";
import {Sun,Moon,User,Lock,Users,Settings,Phone,LogOut, Book, BookHeart} from "lucide-react";
import toast from "react-hot-toast";

export const Navbar = () => {
  const { selectedUser } = useChatStore();
  const navigate = useNavigate();
  const { logout, profile } = useAuthStore();
  const { theme,toggleTheme} = useThemeStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !event.target.classList.contains("menu-toggle")
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleProfile = async () => {
    const User = await profile();
    if (User) navigate("/profile");
    else toast.error("Something went wrong");
  };

  const GotoFriends = () => navigate("/friends");
  const GotoContact = () => navigate("/contact");
  const Goconstruction = () => navigate("/construction");
  const Gosettings = () => navigate("/settings");

  const Goinvite = () => {
    const appLink = "https://privex-1.onrender.com";
    const shareData = {
      title: "Privex - Chat App",
      
      text: "🚀 Hey! Check out Privex, a private chat app I'm using. Join me here 👇",
      url: appLink,
    };

    if (navigator.share) navigator.share(shareData);
    else {
      navigator.clipboard.writeText(appLink);
      alert("🔗 Link copied! Share it with your friends.");
    }
  };

 return (
  <div
    className={`flex items-center justify-between h-[80px] px-5 py-3 relative
    border-t   bg-bg text-text border border-border z-[999]
    ${selectedUser ? "max-[770px]:hidden" : ""}`}
  >
    {/* Logo */}
    <div className="text-2xl font-bold flex items-center">
      <span
        className={`${
          theme === "dark"
            ? "bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
            : "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent"
        }`}
      >
        Privex
      </span>
    </div>

 

    <div className="flex items-center gap-2">
      <div
        className="menu-toggle text-2xl cursor-pointer px-2 hover:text-pink-400"
        onClick={toggleMenu}
      >
        ☰
      </div>
    </div>

    {isOpen && (
      <div
        ref={dropdownRef}
        className="bg-surface  absolute top-[55px] right-3 rounded-md shadow-md z-[999]"
      >
        <ul className="list-none p-0 m-0 w-48">
          <li
            className="px-4 py-2 text-xl flex gap-3 cursor-pointer text-text hover:bg-hover-surface"
            onClick={handleProfile}
          >
            <User/> Profile
          </li>
          <li
            className="px-4 py-2 text-xl flex gap-3 cursor-pointer text-text hover:bg-hover-surface"
            onClick={Goconstruction}
          >
            <Lock/> Privacy
          </li>
          <li
            className="px-4 py-2 text-xl cursor-pointer text-text hover:bg-hover-surface"
            onClick={GotoFriends}
          >
            <i className="fa-solid fa-user-group"></i>&nbsp;&nbsp;Friends
          </li>
          <li
            className="px-4 py-2 text-xl flex gap-3 cursor-pointer text-text hover:bg-hover-surface"
            onClick={Gosettings}
          >
            <Settings/> Settings
          </li>
          <li
            className="px-4 py-2 text-xl flex gap-3 cursor-pointer text-text hover:bg-hover-surface"
            onClick={Goinvite}
          >
            <BookHeart/> Invite Friends
          </li>
          <li
            className="px-4 py-2 text-xl flex gap-3 cursor-pointer text-text hover:bg-hover-surface"
            onClick={Goconstruction}
          >
            <Phone/> Contact Us
          </li>
          <li
            className="px-4 py-2 text-xl flex gap-3 cursor-pointer text-text hover:bg-hover-surface"
            onClick={handleLogout}
          >
            <LogOut/> Logout
          </li>
        </ul>
      </div>
    )}
  </div>
);
};