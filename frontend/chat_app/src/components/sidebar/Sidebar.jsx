import React, { useEffect, useState } from "react";
import { Search, MoreVertical } from "lucide-react";
import { useChatStore } from "../../store/useChatStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { SidebarSkeleton } from "../../Skeleton/SidebarSkeleton.jsx";

export const Sidebar = () => {
  const { onlineUsers, authUser } = useAuthStore();
  const { getFriends, friends, selectedUser, setSelectedUser, isUsersLoding } = useChatStore();

  const [searchTerm, setSearchTerm] = useState("");

  // Fetch friends from DB
  useEffect(() => {
    getFriends();
  }, [getFriends]);

  // Filter out self
  let filteredUsers = friends.filter((user) => user._id !== authUser._id);

  // Apply search filter
  filteredUsers = filteredUsers.filter(
    (user) =>
      user.fullname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort online first
  filteredUsers = filteredUsers.sort((a, b) => {
    const aOnline = onlineUsers.includes(a._id);
    const bOnline = onlineUsers.includes(b._id);
    if (aOnline === bOnline) return 0;
    return aOnline ? -1 : 1;
  });

  if (isUsersLoding) return <SidebarSkeleton />;

  return (
    <div
      className={`
        ${selectedUser ? "hidden md:flex" : "flex"}
        flex-col h-full w-full md:w-95 bg-gray-900 border-r border-gray-700
        ${selectedUser ? "sidebar-no-small-screen" : ""}
      `}
    >
    {/* Search */}
      <div className="p-3 bg-gray-900">
        <div className="bg-gray-800 rounded-lg flex items-center px-3 py-2">
          <Search size={16} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search users"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-white placeholder-gray-400 outline-none flex-1"
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          const isActive = selectedUser?._id === user._id;

          return (
            <div
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`flex items-center p-3 cursor-pointer transition-colors duration-200 border-b border-gray-800 border-opacity-30 hover:bg-gray-800 ${
                isActive ? "bg-gray-700" : ""
              }`}
            >
              <div className="relative mr-4">
                <img
                  src={user.profilePicture || "avatar.png"}
                  alt={user.fullname}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-normal truncate">{user.fullname}</h3>
                <p className="text-gray-400 text-sm truncate mt-1">
                  {user.fullname === "Privex Bot"
                    ? "Online"
                    : isOnline
                    ? "Online"
                    : "Offline"}
                </p>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center text-gray-500 py-4">No users found</div>
        )}
      </div>
    </div>
  );
};

