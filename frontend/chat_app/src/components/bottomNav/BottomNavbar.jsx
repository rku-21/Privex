import React from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useChatStore } from "../../store/useChatStore";

const BottomNavbar = () => {
  const navigate = useNavigate();
  const { selectedUser } = useChatStore();
  const { profile } = useAuthStore();
  const { theme } = useThemeStore();

  const GoProfile = async () => {
    const User = await profile();
    if (User) {
      navigate("/profile");
    } else {
      toast.error("Something went wrong");
    }
  };

  return (
    <nav
      className={`
        fixed bottom-0 left-0 w-full h-[60px]
        flex items-center justify-between px-6
        ${selectedUser ? "hidden md:flex" : "flex"}
        
        border-t border-white/10
        z-[999]
        ${
          theme === "dark"
            ? "bg-gray-900"
            : "bg-gray-50"
        }
      `}
    >
      <ul className="flex justify-between items-center w-full text-white">
        <li
          onClick={() => navigate("/")}
          className="text-2xl cursor-pointer transition-colors duration-200 hover:text-pink-400"
        >
          <i className="fas fa-home"></i>
        </li>
        <li
          onClick={() => navigate("/search")}
          className="text-2xl cursor-pointer transition-colors duration-200 hover:text-pink-400"
        >
          <i className="fas fa-search"></i>
        </li>
        <li
          onClick={() => navigate("/construction")}
          className="text-2xl cursor-pointer transition-colors duration-200 hover:text-pink-400"
        >
          <i className="fas fa-address-book"></i>
        </li>
        <li
          onClick={() => navigate("/request-received")}
          className="text-2xl cursor-pointer transition-colors duration-200 hover:text-pink-400"
        >
          <i className="fas fa-heart"></i>
        </li>
        <li
          onClick={GoProfile}
          className="text-2xl cursor-pointer transition-colors duration-200 hover:text-pink-400"
        >
          <i className="fas fa-user-circle"></i>
        </li>
      </ul>
    </nav>
  );
};

export default BottomNavbar;
