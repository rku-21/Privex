import { useEffect } from 'react';
import { useAuthStore } from './useAuthStore';


const useSocket = (user) => {
  const { connectSocket, socket } = useAuthStore();
  
  useEffect(() => {
    if (!user) return;
    if (!socket) {
      connectSocket();
    }
    
    
  }, [user, socket, connectSocket]);
  
  return socket;
};

export default useSocket;
