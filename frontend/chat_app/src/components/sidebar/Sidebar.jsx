import React, { useEffect, useState, useRef, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { useChatStore } from "../../store/useChatStore.js";
import { useQueryPagination } from "../../store/useQueryPagination.js";
import { useAuthStore } from "../../store/useAuthStore";
import { SidebarSkeleton } from "../../Skeleton/SidebarSkeleton.jsx";

export const Sidebar = () => {

  const { onlineUsers, authUser,UserStatus} = useAuthStore();
  const {
    selectedUser,
    setselectedUser,
    unreadCounts,
    } = useChatStore();

  const {
     getFriends,
     friends,
     isUsersLoding,
     friendsPagination,
     loadMoreFriends,
    }=useQueryPagination();
  


  const [searchTerm, setSearchTerm] = useState("");
  const scrollContainerRef = useRef(null);
  const observerRef = useRef(null);


  useEffect(() => {
    getFriends(true);
  }, []);


  const lastFriendRef = useCallback(
    (node) => {
      if (friendsPagination.isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && friendsPagination.hasMore) {
          loadMoreFriends();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [friendsPagination.isLoading, friendsPagination.hasMore, loadMoreFriends]
  );


  let filteredUsers = friends.filter((user) => user._id !== authUser._id);


  filteredUsers = filteredUsers.filter(
    (user) =>
      user.fullname.toLowerCase().includes(searchTerm.toLowerCase())
  );


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
        flex-col h-full w-full md:w-80 lg:w-96 bg-bg border-r border-border
        ${selectedUser ? "sidebar-no-small-screen" : ""}
      `}
    >
      
      <div className="p-3 bg-bg border-border">
        <div className="bg-bg rounded-lg flex items-center px-3 py-2 border border-border">
          <Search size={16} className="text-text mr-3" />
          <input
            type="text"
            placeholder="Search users"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-text placeholder-gray-500 outline-none flex-1 border-border"
          />
        </div>
      </div>


      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {filteredUsers.map((user, index) => {
          const isOnline = onlineUsers.includes(user._id);
          const isActive = selectedUser?._id === user._id;
          const unreadCount = unreadCounts?.[user._id] || 0;
          const isLastItem = index === filteredUsers.length - 1;
          const statusText =
            user.fullname === "Privex Bot"
              ? "Online"
              : UserStatus[user._id] === "typing" && isOnline
                ? "Typing..."
                : isOnline
                  ? "Online"
                  : "Offline";
          const statusColorClass =
            statusText === "Offline" ? "text-text" : "text-green-500";

          return (
            <div
              key={user._id}
              ref={isLastItem ? lastFriendRef : null}
              onClick={() => setselectedUser(user)}
              className={`flex items-center justify-between p-3 cursor-pointer transition-colors duration-200 border-b border-border border-opacity-30 hover:bg-hover-surface ${isActive ? "bg-bg" : ""
                }`}
            >

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={user.profilePicture || "avatar.png"}
                    alt={user.fullname}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-border"></div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-text font-normal truncate">{user.fullname}</h3>
                  <p className={`${statusColorClass} text-sm truncate mt-1`}>
                    {statusText}
                  </p>
                </div>
              </div>


              {unreadCount > 0 && (
                <div className="flex items-center justify-center bg-blue-600 text-white text-xs font-semibold rounded-full w-5 h-5 shadow-md animate-[popIn_0.2s_ease-out]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </div>
              )}
            </div>
          );
        })}

        {filteredUsers.length === 0 && !isUsersLoding && (
          <div className="text-center text-text py-4">No users found</div>
        )}


        {friendsPagination.isLoading && (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        )}
      </div>

    </div>
  );
};

