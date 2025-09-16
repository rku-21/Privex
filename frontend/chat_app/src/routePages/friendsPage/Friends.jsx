


import React, { useEffect } from 'react';
import BottomNavbar from '../../components/bottomNav/BottomNavbar';
import { Navbar } from '../../components/navbar/Navbar';
import { useChatStore } from '../../store/useChatStore';
import toast from 'react-hot-toast';
import './friends.css';
import { useThemeStore } from '../../store/useThemeStore';

export const Friends = () => {
  const { getFriends, friends, removingFriendRequest } = useChatStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    getFriends();
  }, []);

  const handleRemoving = async (Id) => {
    try {
      await removingFriendRequest(Id);
      await getFriends();
      toast.success("removed as friend");
    } catch (error) {
      toast.error("something went wrong");
    }
  };

  return (
    <div className={`friends-page-bg${theme === "dark" ? " dark-mode" : ""}`}>
      <div className="friends-navbar-fixed">
        <Navbar />
      </div>
      <div className="friends-scroll-area">
        <div className="cards-container">
          {friends.map((user) => (
            <div key={user._id} className="user-card">
              <img
                src={user.profilePicture || 'avatar.png'}
                alt={user.fullname}
                className="user-image"
              />
              <p className="user-name">{user.fullname}</p>
              <div className="card-buttons">
                <button className="view-btn">View Profile</button>
                <button className="accept-btn" onClick={() => handleRemoving(user._id)}>
                  remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="friends-bottomnav-fixed">
        <BottomNavbar />
      </div>
    </div>
  );
};
