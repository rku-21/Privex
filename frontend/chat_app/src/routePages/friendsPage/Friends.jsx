


import React, { useEffect, useCallback, useRef } from 'react';
import BottomNavbar from '../../components/bottomNav/BottomNavbar';
// import useCallStore from '../../store/useCallStore';
import { Navbar } from '../../components/navbar/Navbar';
import { useChatStore } from '../../store/useChatStore';
import toast from 'react-hot-toast';
import './friends.css';
import { useThemeStore } from '../../store/useThemeStore';
import { useNavigate } from 'react-router-dom';

export const Friends = () => {
  const { getFriends, friends, removeFriend, friendsPagination, loadMoreFriends } = useChatStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const observerRef = useRef();
  
  // Infinite scroll - last friend element reference
  const lastFriendRef = useCallback((node) => {
    if (friendsPagination.isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && friendsPagination.hasMore) {
        loadMoreFriends();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [friendsPagination.isLoading, friendsPagination.hasMore, loadMoreFriends]);

  useEffect(() => {
    getFriends(true);
  }, []);

  const handleRemoving = async (Id) => {
    try {
      await removeFriend(Id);
      await getFriends(true);
    } catch (error) {
      // Error already handled in the store
    }
  };

  const handleViewProfile = (userId) => {
    // Redirect to construction page - feature under development
    navigate('/construction');
  };

  return (
    <div className={`friends-page-bg${theme === "dark" ? " dark-mode" : ""}`}>
      <div className="friends-navbar-fixed">
        <Navbar/>
      </div>
      
      <div className="friends-scroll-area">
        
        
        <div className="cards-container">
          {friends.map((user, index) => (
            <div 
              key={user._id} 
              className="friend-card"
              ref={index === friends.length - 1 ? lastFriendRef : null}
            >
              <div className="friend-card-inner">
                <div className="avatar-container">
                  <div className="avatar-glow"></div>
                  <img
                    src={user.profilePicture || 'avatar.png'}
                    alt={user.fullname}
                    className="friend-avatar"
                  />
                </div>
                <p className="friend-name">{user.fullname}</p>
                <div className="friend-actions">
                  <button 
                    className="action-btn view-profile-btn"
                    onClick={() => handleViewProfile(user._id)}
                  >
                    View Profile
                  </button>
                  <button 
                    className="action-btn remove-btn" 
                    onClick={() => handleRemoving(user._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {friendsPagination.isLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading more friends...</p>
          </div>
        )}
        
     {!friendsPagination.isLoading && friends.length === 0 && (
  <div className="no-friends-container">
    <div className="text-center p-8">
      <div className="text-6xl mb-4">👥</div>
      <h2 className="text-2xl font-bold mb-2">No Friends Yet</h2>
      <p className="text-gray-600">Start connecting with people!</p>
    </div>
  </div>
)}
      </div>
      
      {(
        <div className="friends-bottomnav-fixed">
          <BottomNavbar />
        </div>
      )}
    </div>
  );
};
