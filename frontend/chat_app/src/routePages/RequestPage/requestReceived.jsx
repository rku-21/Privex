import React, { useEffect, useState } from 'react';
import BottomNavbar from '../../components/bottomNav/BottomNavbar';
import { Navbar } from '../../components/navbar/Navbar';
import { useChatStore } from '../../store/useChatStore';
import './RequestReceived.css';
import toast from 'react-hot-toast';


export const RequestReceived = () => {
  const { getPendingRequests, friendRequests, AcceptsTheRequests, getFriends, getsendedRequests, removingFriendRequest } = useChatStore();
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    getPendingRequests();
  }, []);

  const handleSeeMore = () => {
    setVisibleCount((prev) => prev + 6);
  };
  const handleAccept = async (Id) => {
    try {
      await AcceptsTheRequests(Id);
      await getPendingRequests();
      await getsendedRequests();
      await getFriends();
      toast.success("Friends request accepted");
    } catch (error) {
      toast.error("something went wrong");
    }
  };
  const handleRemove = async (Id) => {
    try {
      await removingFriendRequest(Id);
      await getPendingRequests();
      await getsendedRequests();
      await getFriends();
      toast.success("removed from friend");
    } catch (error) {
      toast.error(error.message);
    }
  };


  return (
    <>
      <Navbar />
      <div className="request-box">
        <div className="cards-container">
          {friendRequests?.received?.length === 0 ? (
            <div className="no-notifications-ui">
              <div className="no-bell-icon">🔔</div>
              <div className="no-notifications-text">No notifications</div>
            </div>
          ) : (
            friendRequests?.received?.slice(0, visibleCount).map((user) => (
              <div key={user._id} className="user-card">
                <img
                  src={user.profilePicture || 'avatar.png'}
                  alt={user.fullname}
                  className="user-image"
                />
                <p className="user-name">{user.fullname}</p>
                <div className="card-buttons">
                  <button className="view-btn" onClick={() => handleRemove(user._id)}>Remove</button>
                  <button className="accept-btn" onClick={() => handleAccept(user._id)}>
                    Accept
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {friendRequests?.received?.length > visibleCount && (
          <div className="see-more-container">
            <button className="see-more-btn" onClick={handleSeeMore}>
              See more
            </button>
          </div>
        )}
      </div>
      <BottomNavbar />
    </>
  );
};

