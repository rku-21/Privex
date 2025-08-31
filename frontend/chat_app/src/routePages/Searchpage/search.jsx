import React from 'react'
import "./search.css"
import { useState } from 'react';
import { useEffect } from 'react';
import { useChatStore } from '../../store/useChatStore';
import path from 'path'
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { Loding } from '../../Skeleton/loding';
import BottomNavbar from '../../components/bottomNav/BottomNavbar';




export const Search = () => {
  const {authUser } = useAuthStore();

 const {getAllUsers,Users,isUsersLoding,SendingFriendRequest,removingFriendRequest,  getsendedRequests,getPendingRequests,friends,friendRequests, getFriends}=useChatStore();
const [searchQuery, setSearchQuery] = useState("");
const [filteredUsers, setFilteredUsers] = useState([]);


const currentUser=authUser;

useEffect(() => {
  getAllUsers();
  getFriends();
  
  getsendedRequests();

  getPendingRequests(); 
}, []);

useEffect(() => {
  if (searchQuery.trim() === "") {
    setFilteredUsers([]);
  } else {
    const result = Users.filter(user =>
      user.fullname.toLowerCase().startsWith(searchQuery.toLowerCase())
    );
    
    setFilteredUsers(result.filter(user => user._id !== currentUser._id));

  }
}, [searchQuery, Users]);

// handle the friend request sending 
const SendRequest = async (userId) => {
  try {
    await SendingFriendRequest(userId);
    await getsendedRequests(); 
    await getPendingRequests(); 
    toast.success("Friend request sent");
  } catch (error) {
    toast.error("Something went wrong");
  }
};

const removeRequest = async (userId) => {
  try {
    await removingFriendRequest(userId);
    await getsendedRequests();
    await getPendingRequests(); 
    toast.success("Friend request removed");
  } catch (error) {
    toast.error("Something went wrong");
  }
};


   
   return (
  <>
    <div className="Search-box">
      <i className="fa fa-search search-icon"></i>
      <input 
        type="text" 
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>

    <div className="search-results">
  {isUsersLoding &&<Loding/> }

  {!isUsersLoding && filteredUsers.map(user => {
    const isRequestSent = friendRequests.sent.some(u => u._id === user._id);
    const isRequestReceived = friendRequests.received.some(u => u._id === user._id);
    const isFriend=friends.some(u=>u._id===user._id);


    return (
      <div key={user._id} className="user-card">
        <img 
          src={user.profilePicture || "avatar.png"} 
          alt={user.fullname} 
          className="user-card-avatar" 
        />
        <span className="user-card-name">{user.fullname}</span>

        <div className="card-buttons">
            <button className="view-btn">View Profile</button>
        

          <button
            disabled={isFriend}
            onClick={() => {
              if (isRequestSent) removeRequest(user._id);
              else if (!isRequestReceived) SendRequest(user._id);
            }}
            className="add-btn"
          >
            {isRequestSent
              ? "Cancel Request"
              : isRequestReceived
              ? "Requested You"
              : isFriend
              ? "Friends"
              : "Add Friend"}
                
          </button>
        
        </div>
      </div>
    );
  })}
</div>
<BottomNavbar/>

  </>
);
}