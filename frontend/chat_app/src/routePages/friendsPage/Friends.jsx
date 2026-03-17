import React, { useEffect, useCallback, useRef } from 'react';
import BottomNavbar from '../../components/bottomNav/BottomNavbar';
import { Navbar } from '../../components/navbar/Navbar';
import { useChatStore } from '../../store/useChatStore';
import { useQueryPagination } from '../../store/useQueryPagination';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const Friends = () => {
  const { removeFriend } = useChatStore();
  const { getFriends, friends, friendsPagination, loadMoreFriends } = useQueryPagination();
  const navigate = useNavigate();
  const observerRef = useRef();
  
 
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
      
    }
  };

  const handleViewProfile = (userId) => {
   
    navigate('/construction');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar/>
      
      <div className="max-w-6xl mx-auto px-4 pb-20">
        
        {!friendsPagination.isLoading && friends.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-4xl">👥</div>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Friends Yet</h3>
            <p className="text-gray-400">Start connecting with people!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {friends.map((user, index) => (
              <div 
                key={user._id} 
                ref={index === friends.length - 1 ? lastFriendRef : null}
                className="bg-gray-900/50 rounded-xl p-4 flex flex-col items-center hover:bg-gray-900 transition-all duration-200 border border-gray-800 hover:border-gray-700"
              >
                <div className="relative mb-3">
                  <img
                    src={user.profilePicture || 'avatar.png'}
                    alt={user.fullname}
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-700"
                  />
                </div>
                
                <div className="text-center mb-3">
                  <div className="font-semibold text-sm truncate w-full">{user.fullname}</div>
                  <div className="text-xs text-gray-400 truncate w-full">
                    @{user.username || "username"}
                  </div>
                </div>
                
                <div className="flex flex-col w-full space-y-2">
                  <button 
                    onClick={() => handleViewProfile(user._id)}
                    className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    View Profile
                  </button>
                  <button 
                    onClick={() => handleRemoving(user._id)}
                    className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {friendsPagination.isLoading && (
          <div className="text-center py-6">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-400">Loading more friends...</p>
          </div>
        )}
      </div>
      
      <BottomNavbar />
    </div>
  );
};
