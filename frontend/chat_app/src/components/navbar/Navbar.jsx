import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useChatStore } from "../../store/useChatStore";
import toast from "react-hot-toast";

export const Navbar = () => {
  const { selectedUser } = useChatStore();
  const navigate = useNavigate();
  const { logout, profile } = useAuthStore();
  const { theme} = useThemeStore();

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
      border border-white/5 text-white
       border-t border-white/10
      ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}
      ${selectedUser ? "max-[770px]:hidden" : ""}`}
    >
      {/* Logo */}
      <div className="text-2xl font-bold flex items-center">
        🔒 <span
  className={`${
    theme === "dark"
      ? "bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
      : "text-gray-900"
  }`}
>
  Privex
</span>

      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
      

        {/* Menu toggle */}
        <div
          className="menu-toggle text-2xl cursor-pointer px-2 hover:text-pink-400"
          onClick={toggleMenu}
        >
          ☰
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={` ${theme=="dark"?"bg-gray-900":""} absolute top-[55px] right-3  border border-gray-300/60 rounded-md shadow-md z-[999]`}
        >
          <ul className="list-none p-0 m-0">
            <li
              className="px-4 py-2 text-lg cursor-pointer hover:bg-gray-700"
              onClick={handleProfile}
            >
              👤 Profile
            </li>
            <li
              className="px-4 py-2 text-lg cursor-pointer hover:bg-[#050529a3]"
              onClick={Goconstruction}
            >
              🔒 Privacy
            </li>
            <li
              className="px-4 py-2 text-lg cursor-pointer hover:bg-[#050529a3]"
              onClick={Gosettings}
            >
              ⚙️ Settings
            </li>
            <li
              className="px-4 py-2 text-lg cursor-pointer hover:bg-[#050529a3]"
              onClick={GotoFriends}
            >
              <i className="fa-solid fa-user-group"></i>&nbsp;&nbsp;Friends
            </li>
            <li
              className="px-4 py-2 text-lg cursor-pointer hover:bg-[#050529a3]"
              onClick={Goinvite}
            >
              📨 Invite Friends
            </li>
            <li className="px-4 py-2 text-lg cursor-pointer hover:bg-[#050529a3]">
              📞 Contact Us
            </li>
            <li
              className="px-4 py-2 text-lg cursor-pointer hover:bg-[#050529a3]"
              onClick={handleLogout}
            >
              🚪 Logout
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};


