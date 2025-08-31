import React from 'react';
import "./bottomNav.css";
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';


const BottomNavbar = () => {
  const Navigate=useNavigate();
  const {profile}=useAuthStore();

  const GoProfile=async()=>{
    const  User= await profile();
    if(User){
      Navigate("/profile");
    }
    else {
      toast.error("something went wrong");
    }
  }
  
  const Gohome=async()=>{
    Navigate("/")
  }
  const Gosearch=async()=>{
    Navigate("/search");
  }
  const GoRequestSection=async()=>{
    Navigate("/request-received")
  }
   const Goconstruction=()=>{
      Navigate("/construction");
    }
  return (
    <nav className="bottom-navbar">
      <ul className="navbar-list">
        <li onClick={Gohome}><i className="fas fa-home"></i></li>
        <li onClick={Gosearch}><i className="fas fa-search"></i></li>
        <li onClick={Goconstruction}><i className="fas fa-address-book"></i></li>
        <li onClick={GoRequestSection}><i className=" fas fa-regular fa-heart"></i></li>
        <li onClick={GoProfile} className="profile-icon"><i className="fas fa-user-circle"></i></li>
      </ul>
    </nav>
  );
};

export default BottomNavbar;
