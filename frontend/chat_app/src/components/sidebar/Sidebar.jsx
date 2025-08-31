import React from 'react'
import { useChatStore } from '../../store/useChatStore.js';
import { useEffect, useState } from 'react';
import { SidebarSkeleton } from '../../Skeleton/SidebarSkeleton.jsx';
import {Users} from "lucide-react"
import { useAuthStore } from '../../store/useAuthStore.js';
export const Sidebar = () => {
  const { onlineUsers,authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

    const {getFriends, friends, selectedUser, setSelectedUser,isUsersLoding}=useChatStore();
   useEffect(()=>{
    getFriends();
   }, [getFriends]);

   const currentUser =authUser;
   const filteredUsers = showOnlineOnly
  ? friends.filter((user) => onlineUsers.includes(user._id) && user._id !== currentUser._id)
  : friends.filter((user) => user._id !== currentUser._id);


   if(isUsersLoding) return <SidebarSkeleton/>
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
          {filteredUsers.map((user) => (
            <div 
              key={user._id} onClick={()=>setSelectedUser(user)} className={` eachUser ${selectedUser?._id==user._id?"selected":""}`}>
              <div className='each-user-inside'>
                <img src={user.profilePicture||"avatar.png"} alt={user.fullname} className="user-avatar" />


                {(user.fullname === "Privex Bot" || onlineUsers.includes(user._id)) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                  />
                )}

                <div className="user-name">{user.fullname}
                  <div className="text-sm text-zinc-400">
                    
                {user.fullname === "Privex Bot" ? "Online" : (onlineUsers.includes(user._id) ? "Online" : "Offline")}
              </div>

                 
                </div>
               </div>
              </div>
            
          ))}
          {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
        </div>
      </div>
  )
}
