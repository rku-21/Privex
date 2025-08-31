import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Camera, Mail, User } from 'lucide-react';
import BottomNavbar from "../components/bottomNav/BottomNavbar.jsx"
import './styles/Profile.css'; // 
import { useState } from 'react';

export const Profile = () => {
  const { authUser, isUpdateingProfileUP, updateProfile } = useAuthStore();
  const [img, setimg]=useState(null);


  const handleImageUpload = async (e) => {
    const file=e.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file); 
    reader.onload = async () => {
     
    const base64Image=reader.result;
    setimg(base64Image);

     await updateProfile({profilePicture:base64Image})
    }
    
};
 return (
    <>
   
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-card">
            <div className="profile-header">
              <h1>Profile</h1>
              <p>Your profile information</p>
            </div>

            <div className="avatar-section">
              <div className="avatar-wrapper">
                <img
                  src={ img||authUser.profilePicture || '/avatar.png'}
                  alt="Profile"
                  className="avatar-img"
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
      <div className='nav-parent'>
      <BottomNavbar/>
      </div>
    </>
  );
};
