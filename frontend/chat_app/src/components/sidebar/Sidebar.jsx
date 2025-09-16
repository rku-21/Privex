import React from 'react'
import { useChatStore } from '../../store/useChatStore.js';
import { useEffect, useState } from 'react';
import { SidebarSkeleton } from '../../Skeleton/SidebarSkeleton.jsx';
import {Users} from "lucide-react"
import { useAuthStore } from '../../store/useAuthStore.js';
// Sidebar component for displaying friends list with online status sorting
export const Sidebar = () => {
  // Get online users and current authenticated user from auth store
  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  // Get friends and related state from chat store
  const { getFriends, friends, selectedUser, setSelectedUser, isUsersLoding } = useChatStore();

  // Fetch friends list on mount
  useEffect(() => {
    getFriends();
  }, [getFriends]);

  const currentUser = authUser;

  // Filter out the current user from the friends list
  let filteredUsers = friends.filter((user) => user._id !== currentUser._id);

  // If 'Show online only' is checked, filter to only online friends
  if (showOnlineOnly) {
    filteredUsers = filteredUsers.filter((user) => onlineUsers.includes(user._id));
  }

  // Sort friends: online users first, then offline users
  filteredUsers = filteredUsers.sort((a, b) => {
    const aOnline = onlineUsers.includes(a._id);
    const bOnline = onlineUsers.includes(b._id);
    if (aOnline === bOnline) return 0;
    return aOnline ? -1 : 1;
  });

  // Show loading skeleton if users are loading
  if (isUsersLoding) return <SidebarSkeleton />;

  // Render the sidebar UI
  return (
      <div className={`sidebar ${selectedUser?'sidebar-no-small-screen':''}`}>
        <h2 className="contacts-title">Contacts</h2>
       
        <div className="show-online">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="Checkbox"
            />
            <p className='show-online-text'>Show online only</p>
      </div>
      

        <div className="user-list">
          {/* Render each friend, sorted by online status */}
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={` eachUser ${selectedUser?._id === user._id ? "selected" : ""}`}
            >
              <div className='each-user-inside'>
                <img src={user.profilePicture || "avatar.png"} alt={user.fullname} className="user-avatar" />
                {/* Show online indicator if user is online or is the bot */}
                {(user.fullname === "Privex Bot" || onlineUsers.includes(user._id)) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900"
                  />
                )}
                <div className="user-name">{user.fullname}
                  <div className="text-sm text-zinc-400">
                    {user.fullname === "Privex Bot"
                      ? "Online"
                      : onlineUsers.includes(user._id)
                        ? "Online"
                        : "Offline"}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* Show message if no users are available */}
          {filteredUsers.length === 0 && (
            <div className="text-center text-zinc-500 py-4">No online users</div>
          )}
        </div>
      </div>
  )
}
