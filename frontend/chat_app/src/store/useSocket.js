import { useEffect } from 'react';
import { useAuthStore } from './useAuthStore';

// This hook initializes socket connection when a user is authenticated
const useSocket = (user) => {
  const { connectSocket, socket } = useAuthStore();
  
  useEffect(() => {
    // If no user is authenticated, don't connect
    if (!user) return;
    
    // Connect socket if not already connected
    if (!socket) {
      connectSocket();
    }
    
    // No cleanup needed as disconnection is handled by auth store
  }, [user, socket, connectSocket]);
  
  return socket;
};

export default useSocket;
