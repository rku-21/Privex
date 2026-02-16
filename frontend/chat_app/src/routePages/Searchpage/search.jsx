import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, SearchIcon, Loader2 } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import BottomNavbar from "../../components/bottomNav/BottomNavbar";
import { Loding } from "../../Skeleton/loding";
import toast from "react-hot-toast";

const Search = () => {
  const { authUser } = useAuthStore();

  const {
    searchUsers,
    searchResults,
    searchPagination,
    loadMoreSearchResults,
    isUsersLoding,
    SendingFriendRequest,
    removingFriendRequest,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [userStatus, setUserStatus] = useState({});
  const observerRef = useRef(null);
  const debounceTimeout = useRef(null);

  const currentUser = authUser;


  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      searchUsers(searchQuery, true);
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery]);
  useEffect(() => {
    if (!searchResults) return;
    const newStatus = {};
    searchResults.forEach((user) => {
      newStatus[user._id] = user.relationshipStatus || "none";
    });
    setUserStatus(newStatus);
  }, [searchResults]);


  const lastUserRef = useCallback(
    (node) => {
      if (searchPagination?.isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && searchPagination?.hasMore) {
          loadMoreSearchResults();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [searchPagination?.isLoading, searchPagination?.hasMore, loadMoreSearchResults]
  );


  const SendRequest = async (userId) => {
    setUserStatus((prev) => ({ ...prev, [userId]: "sent" }));
    try {
      await SendingFriendRequest(userId);
      toast.success("Friend request sent");
    } catch (error) {

      setUserStatus((prev) => ({ ...prev, [userId]: "none" }));
      toast.error(error.response?.data?.message || error.response?.data?.error || "Something went wrong");
    }
  };


  const removeRequest = async (userId) => {

    setUserStatus((prev) => ({ ...prev, [userId]: "none" }));
    try {
      await removingFriendRequest(userId);
      toast.success("Friend request removed");
    } catch (error) {

      setUserStatus((prev) => ({ ...prev, [userId]: "sent" }));
      toast.error(error.response?.data?.message || error.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-12 pr-10 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        {isUsersLoding && (!searchResults || searchResults.length === 0) && <Loding />}

        {!isUsersLoding && searchResults && searchResults.length > 0 && (
          <div className="space-y-3 mt-4">
            {searchResults.map((user, index) => {
              const status = userStatus[user._id] || "none";
              const isLastItem = index === searchResults.length - 1;

              return (
                <div
                  key={user._id}
                  ref={isLastItem ? lastUserRef : null}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-900/50 transition-colors"
                >
                  {/* Left */}
                  <div className="flex items-center space-x-3">
                    <img
                      src={user.profilePicture || "avatar.png"}
                      alt={user.fullname}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">{user.fullname}</div>
                      <div className="text-sm text-gray-400">
                        @{user.fullname || "username"}
                      </div>
                    </div>
                  </div>


                  <button
                    disabled={status === "friend" || status === "received"}
                    onClick={() => {
                      if (status === "sent") removeRequest(user._id);
                      else if (status === "none") SendRequest(user._id);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${status === "friend"
                      ? "bg-gray-700 text-white cursor-default"
                      : status === "sent"
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : status === "received"
                          ? "bg-gray-700 text-yellow-400 cursor-default"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                  >
                    {status === "sent"
                      ? "Cancel"
                      : status === "received"
                        ? "Requested You"
                        : status === "friend"
                          ? "Friends"
                          : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        )}


        {searchPagination?.isLoading && searchResults && searchResults.length > 0 && (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        )}

        {!isUsersLoding && searchQuery && (!searchResults || searchResults.length === 0) && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-gray-400">Try searching for someone else.</p>
          </div>
        )}
      </div>

      <BottomNavbar />
    </div>
  );
};

export default Search;

