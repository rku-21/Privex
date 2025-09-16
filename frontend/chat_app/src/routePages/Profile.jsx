import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Camera, Mail, User } from 'lucide-react';
import BottomNavbar from "../components/bottomNav/BottomNavbar.jsx"
import { useNavigate } from 'react-router-dom';
import './styles/profile.css'; // 
import { useState } from 'react';
import './styles/profileImageModal.css';
 export const Profile = () => {
  const navigate = useNavigate();
  const { authUser, isUpdateingProfileUP, updateProfile } = useAuthStore();
  const [img, setimg] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setimg(base64Image);
      await updateProfile({ profilePicture: base64Image });
    };
  };

  const handleAvatarClick = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };
  return (
    <>
      {/* Topbar for mobile/laptop <850px */}
      <div className="profile-topbar">
        <span className="profile-back-arrow" onClick={() => navigate(-1)} title="Back" tabIndex={0}>
          <i className="fa-solid fa-arrow-left"></i>
        </span>
        <span className="profile-topbar-title">Profile</span>
      </div>
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-card">
            <div className="avatar-section">
              <div className="avatar-wrapper">
                <img
                  src={img || authUser.profilePicture || '/avatar.png'}
                  alt="Profile"
                  className="avatar-img"
                  style={{ cursor: 'zoom-in' }}
                  onClick={handleAvatarClick}
                />
                <label
                  htmlFor="avatar-upload"
                  className={`avatar-upload ${isUpdateingProfileUP ? 'disabled' : ''}`}
                >
                  <Camera className="camera-icon" />
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUpdateingProfileUP}
                  />
                </label>
              </div>
              <p className="upload-text">
                {isUpdateingProfileUP ? 'Uploading...' :authUser.fullname}
              </p>
            </div>
            <div className="info-section">
              <div className="info-item">
                <div className="label">
                  <User size={16} />
                  Full Name
                </div>
                <p className="info-value">{authUser?.fullname}</p>
              </div>
              <div className="info-item">
                <div className="label">
                  <Mail size={16} />
                  Email Address
                </div>
                <p className="info-value">{authUser?.email}</p>
              </div>
            </div>
            <div className="account-info">
              <h2>Account Information</h2>
              <div className="account-details">
                <div className="account-item">
                  <span>Member Since</span>
                  <span>{authUser.createdAt?.split('T')[0]}</span>
                </div>
                <div className="account-item">
                  <span>Account Status</span>
                  <span className="status">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Hide BottomNavbar for width <850px */}
      <div className='nav-parent profile-bottom-nav'>
        <BottomNavbar />
      </div>
      {showModal && (
        <div className="profile-image-modal-bg" onClick={closeModal}>
          <img
            src={img || authUser.profilePicture || '/avatar.png'}
            alt="Profile Large"
            className="profile-image-modal-img"
          />
        </div>
      )}
    </>
  );
};
