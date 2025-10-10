import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";
import BottomNavbar from "../../components/bottomNav/BottomNavbar";
import { Navbar } from "../../components/navbar/Navbar";
import { useChatStore } from "../../store/useChatStore";
import toast from "react-hot-toast";

export const RequestReceived = () => {
  const {
    getPendingRequests,
    friendRequests,
    AcceptsTheRequests,
    getFriends,
    getsendedRequests,
    removingFriendRequest,
  } = useChatStore();

  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    getPendingRequests();
  }, []);

  const handleSeeMore = () => setVisibleCount((prev) => prev + 6);

  const handleAccept = async (id) => {
    try {
      await AcceptsTheRequests(id);
      await getPendingRequests();
      await getsendedRequests();
      await getFriends();
      toast.success("Friend request accepted");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleRemove = async (id) => {
    try {
      await removingFriendRequest(id);
      await getPendingRequests();
      await getsendedRequests();
      await getFriends();
      toast.success("Removed from requests");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Requests List */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        {friendRequests?.received?.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No requests</h3>
            <p className="text-gray-400">You don’t have any friend requests right now.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {friendRequests.received.slice(0, visibleCount).map((user) => (
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
                      @{user.username || "username"}
                    </div>
                  </div>
                </div>

                {/* Right - Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRemove(user._id)}
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => handleAccept(user._id)}
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* See More */}
        {friendRequests?.received?.length > visibleCount && (
          <div className="text-center mt-6">
            <button
              onClick={handleSeeMore}
              className="px-6 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              See more
            </button>
          </div>
        )}
      </div>

      <BottomNavbar />
    </div>
  );
};

