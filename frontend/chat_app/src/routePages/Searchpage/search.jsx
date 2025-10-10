import React, { useState, useEffect } from "react";
import { X, SearchIcon} from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import BottomNavbar from "../../components/bottomNav/BottomNavbar";
import { Loding } from "../../Skeleton/loding";
import toast from "react-hot-toast";

const Search = () => {
  const { authUser } = useAuthStore();
  const {
    getAllUsers,
    Users,
    isUsersLoding,
    SendingFriendRequest,
    removingFriendRequest,
    getsendedRequests,
    getPendingRequests,
    friends,
    friendRequests,
    getFriends,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  const currentUser = authUser;

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
      const result = Users.filter((user) =>
        user.fullname.toLowerCase().startsWith(searchQuery.toLowerCase())
      );
      setFilteredUsers(result.filter((user) => user._id !== currentUser._id));
    }
  }, [searchQuery, Users]);

  // friend request handling
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
    <div className="min-h-screen bg-black text-white">
      {/* Search Bar */}
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
        {isUsersLoding && <Loding />}

        {!isUsersLoding && filteredUsers.length > 0 && (
          <div className="space-y-3 mt-4">
            {filteredUsers.map((user) => {
              const isRequestSent = friendRequests.sent.some(
                (u) => u._id === user._id
              );
              const isRequestReceived = friendRequests.received.some(
                (u) => u._id === user._id
              );
              const isFriend = friends.some((u) => u._id === user._id);

              return (
                <div
                  key={user._id}
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

                  {/* Right - Button */}
                  <button
                    disabled={isFriend}
                    onClick={() => {
                      if (isRequestSent) removeRequest(user._id);
                      else if (!isRequestReceived) SendRequest(user._id);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      isFriend
                        ? "bg-gray-700 text-white cursor-default"
                        : isRequestSent
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : isRequestReceived
                        ? "bg-gray-700 text-yellow-400 cursor-default"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isRequestSent
                      ? "Cancel"
                      : isRequestReceived
                      ? "Requested You"
                      : isFriend
                      ? "Friends"
                      : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!isUsersLoding && searchQuery && filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              
            </div>
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
