import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Edit, Settings, MapPin, Mail, Calendar, ArrowLeft, Search } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import BottomNavbar from "../components/bottomNav/BottomNavbar";
import { useThemeStore } from "../store/useThemeStore";
import toast from "react-hot-toast";

export const Profile = () => {
  const navigate = useNavigate();
  const { authUser, isUpdateingProfileUP, updateProfile } = useAuthStore();
  const { theme } = useThemeStore();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  // Form states
  const [editedAbout, setEditedAbout] = useState(authUser?.about || "I am on Privex");
  const [editedName, setEditedName] = useState(authUser?.fullname || "");
  const [editedEmail, setEditedEmail] = useState(authUser?.email || "");

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      await updateProfile({ profilePicture: base64Image });
      toast.success("Profile picture updated!");
    };
  };

  const handleCoverPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      await updateProfile({ coverPhoto: base64Image });
      toast.success("Cover photo updated!");
    };
  };

  const handleSaveProfile = async () => {
    try {
      const updates = {};
      
      // Only include changed fields
      if (editedAbout !== (authUser?.about || "I am on Privex")) {
        updates.about = editedAbout;
      }
      if (editedName !== authUser?.fullname) {
        updates.fullname = editedName;
      }
      if (editedEmail !== (authUser?.email || "")) {
        updates.email = editedEmail;
      }
      
      if (Object.keys(updates).length === 0) {
        toast.info("No changes to save");
        return;
      }
      
      await updateProfile(updates);
      setShowEditModal(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage);
    }
  };
  const handleSettingsClick = () => {
    navigate("/settings");
  }

  return (
    <div className={`min-h-screen ${
      theme === "dark" 
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black" 
        : "bg-gray-50"
    }`}>

      {/* Main Content - No top padding since cover starts from top */}
      <div className="pb-20">
        {/* Cover Photo with Back Arrow */}
        <div className="relative">
          <img 
            src={authUser?.coverPhoto || "/default-cover.jpg"} 
            alt="Cover" 
            className="w-full h-48 md:h-64 object-cover"
          />
          
          {/* Back Arrow - floating over cover photo */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 p-2 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition"
            aria-label="Go back"
          >
            <ArrowLeft className="text-white" size={24} />
          </button>
          
          {/* Edit Cover Button */}
          <div className="absolute bottom-4 right-4">
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverPhotoUpload}
              disabled={isUpdateingProfileUP}
            />
            <label 
              htmlFor="cover-upload"
              className="bg-gray-800 rounded-lg px-4 py-2 shadow-lg hover:bg-gray-700 flex items-center gap-2 cursor-pointer transition"
            >
              <Camera size={18} className="text-gray-300" />
              <span className="text-sm font-medium text-gray-300">
                {isUpdateingProfileUP ? "Uploading..." : "Edit Cover"}
              </span>
            </label>
          </div>
          
          {/* View Full Cover Button */}
          <button
            onClick={() => setShowCoverModal(true)}
            className="absolute bottom-4 left-4 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg flex items-center gap-2 transition"
          >
            <Search size={18} className="text-white" />
            <span className="text-sm font-medium text-white">
              View
            </span>
          </button>
        </div>

        {/* Profile Header */}
        <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} shadow-sm`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative -mt-16 pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                {/* Profile Picture with Edit */}
                <div className="relative group w-32 h-32">
                  <img 
                    src={authUser?.profilePicture || "/avatar.png"} 
                    alt={authUser?.fullname}
                    className="w-full h-full rounded-full border-4 border-white dark:border-gray-800 shadow-lg object-cover cursor-pointer"
                    onClick={() => setShowAvatarModal(true)}
                  />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileImageUpload}
                    disabled={isUpdateingProfileUP}
                  />
                  <label 
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 p-2.5 rounded-full shadow-lg transition cursor-pointer"
                  >
                    <Camera size={18} className="text-white" />
                  </label>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center sm:text-left sm:ml-4 mt-4 sm:mt-0">
                  <h1 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {authUser?.fullname}
                  </h1>
                  <p className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
                    @{authUser?.fullname?.toLowerCase().replace(/\\s+/g, '')}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">Online</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 sm:mt-0">
                  <button 
                    onClick={() => {
                      setEditedAbout(authUser?.about || "I am on Privex");
                      setEditedName(authUser?.fullname || "");
                      setEditedEmail(authUser?.email || "");
                      setShowEditModal(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    <Edit size={18} />
                    Edit Profile
                  </button>
                  <button onClick={handleSettingsClick} className={`p-2 ${theme === "dark" ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"} rounded-lg transition`}>
                    <Settings size={18} className={theme === "dark" ? "text-gray-300" : "text-gray-700"} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg shadow p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                About
              </h2>
              <button 
                onClick={() => {
                  setEditedAbout(authUser?.about || "I am on Privex");
                  setEditedName(authUser?.fullname || "");
                  setEditedEmail(authUser?.email || "");
                  setShowEditModal(true);
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit size={16} />
              </button>
            </div>
            <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"} mb-6`}>
              {authUser?.about || "I am on Privex"}
            </p>
            <div className="space-y-3 text-sm">
              <div className={`flex items-start gap-3 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                <Mail className="w-4 h-4 mt-0.5" />
                <span>{authUser?.email}</span>
              </div>
              <div className={`flex items-start gap-3 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                <Calendar className="w-4 h-4 mt-0.5" />
                <span>Joined {authUser?.createdAt?.split("T")[0]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navbar */}
      <div className="fixed bottom-0 w-full z-40">
        <BottomNavbar />
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg max-w-md w-full p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                Edit Profile
              </h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className={`${theme === "dark" ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mb-1`}>
                  Full Name
                </label>
                <input 
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  maxLength={50}
                  className={`w-full px-3 py-2 border ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white" 
                      : "bg-white border-gray-300 text-gray-900"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mb-1`}>
                  Email
                </label>
                <input 
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white" 
                      : "bg-white border-gray-300 text-gray-900"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mb-1`}>
                  About
                </label>
                <textarea 
                  value={editedAbout}
                  onChange={(e) => setEditedAbout(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className={`w-full px-3 py-2 border ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white" 
                      : "bg-white border-gray-300 text-gray-900"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Tell us about yourself..."
                />
                <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  {editedAbout.length}/500 characters
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowEditModal(false)}
                  className={`flex-1 ${
                    theme === "dark" 
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600" 
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  } py-2 rounded-lg transition`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  disabled={isUpdateingProfileUP}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isUpdateingProfileUP ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-zoom-out"
          onClick={() => setShowAvatarModal(false)}
        >
          <img
            src={authUser?.profilePicture || "/avatar.png"}
            alt="Profile Large"
            className="rounded-xl max-h-[80%] max-w-[80%] object-cover"
          />
        </div>
      )}

      {/* Cover Photo Modal */}
      {showCoverModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-zoom-out"
          onClick={() => setShowCoverModal(false)}
        >
          <img
            src={authUser?.coverPhoto || "/default-cover.jpg"}
            alt="Cover Large"
            className="rounded-xl max-h-[80%] max-w-[80%] object-cover"
          />
        </div>
      )}
    </div>
  );
};
