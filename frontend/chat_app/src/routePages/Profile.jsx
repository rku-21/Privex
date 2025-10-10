import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import BottomNavbar from "../components/bottomNav/BottomNavbar";
import { useThemeStore } from "../store/useThemeStore";
 

export const Profile = () => {
  const navigate = useNavigate();
  const { authUser, isUpdateingProfileUP, updateProfile } = useAuthStore();
  const { theme } = useThemeStore();
  const [img, setImg] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setImg(base64Image);
      await updateProfile({ profilePicture: base64Image });
    };
  };

  const handleAvatarClick = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-8 transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black"
          : "bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400"
      }`}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl shadow-2xl p-8 overflow-hidden 
          backdrop-blur-2xl bg-white/90 dark:bg-gray-900/90`}
      >
        {/* Gradient Header */}
        <div
          className={`absolute top-0 left-0 right-0 h-24 rounded-t-3xl ${
            theme === "dark"
              ? "bg-gradient-to-r from-indigo-700 to-purple-800"
              : "bg-gradient-to-r from-indigo-400 to-purple-500"
          }`}
        ></div>

        {/* Avatar */}
        <div className="flex flex-col items-center relative z-10 mt-8">
          <div className="relative">
            <img
              src={img || authUser?.profilePicture || "/avatar.png"}
              alt="Profile"
              className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={handleAvatarClick}
            />
            <label className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full cursor-pointer hover:bg-indigo-700 shadow-md">
              <Camera className="w-5 h-5 text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUpdateingProfileUP}
              />
            </label>
          </div>
          <h2
            className={`mt-4 text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {isUpdateingProfileUP ? "Uploading..." : authUser?.fullname}
          </h2>
          <p
            className={`text-sm font-medium ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {authUser?.email}
          </p>
        </div>

        {/* Details */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-white/40 bg-white/60 dark:bg-gray-800/60 dark:border-gray-700 hover:translate-y-[-2px] transition-transform">
            <span className="text-sm font-semibold">Join Date</span>
            <span className="text-sm font-medium">
              {authUser?.createdAt?.split("T")[0]}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-white/40 bg-white/60 dark:bg-gray-800/60 dark:border-gray-700 hover:translate-y-[-2px] transition-transform">
            <span className="text-sm font-semibold">Status</span>
            <span className="text-sm font-medium flex items-center gap-2 text-green-600 dark:text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
              Active
            </span>
          </div>
        </div>

        {/* Construction Message */}
        <div className="mt-6 p-4 rounded-xl relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_3s_infinite]" />
          <h3 className="flex items-center justify-center font-bold text-base gap-2 relative z-10">
            <span className="animate-spin">🔧</span>
            We're Still Building This Page
          </h3>
          <p className="mt-2 text-sm relative z-10">
            More amazing features and functionality are coming soon. Thank you
            for your patience and cooperation!
          </p>
        </div>
      </div>

      {/* Bottom Navbar */}
      <div className="fixed bottom-0 w-full">
        <BottomNavbar />
      </div>

      {/* Image Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-zoom-out"
          onClick={closeModal}
        >
          <img
            src={img || authUser?.profilePicture || "/avatar.png"}
            alt="Profile Large"
            className="rounded-xl max-h-[80%] max-w-[80%] object-cover"
          />
        </div>
      )}
    </div>
  );
};
