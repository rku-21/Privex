import React, { use, useState } from "react";
import { Link } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern"; 
import "./styles/login.css";
import { useAuthStore } from "../store/useAuthStore"; 
import {Loader2} from "lucide-react";

const Login = ({ message, color }) => {
  const {login, isLoginingUp}=useAuthStore();
  const [passwordVisible, setPasswordVisible] = useState(false);
   const [formData, setFormData]=useState({
     email:"",
     password:""
   });

  const validFrom=()=>{
     if(!formData.email.trim()) return toast.error("Email is required");
      if(!formData.password) return toast.error("password is required");
      return true;
  }
const handleSubmit=(e)=>{

      e.preventDefault();
      const success= validFrom();
    if(success===true){
     login(formData);
    } 
}

       const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  return (
    <div className="full-container" >
    <div className="login-container">
      <h2>
        🔒 Welcome <span style={{ color: "#d98aff" }}>Back</span>
         <p style={{fontSize:"1.1rem", marginLeft:"25px" }} className="ml-3">Sign in to your Account</p>
      </h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          value={formData.email}
          required
        />
        <div className="password-wrapper">
          <input
            type={passwordVisible ? "text" : "password"}
            name="password"
            placeholder="Password"
            onChange={handleChange}
            value={formData.password}
            required
            id="password"
          />
          <span
            onClick={() => setPasswordVisible((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            👁️
          </span>
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={isLoginingUp}>
            {isLoginingUp ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : (
              "Sign in"
            )}
        </button>
      </form>

      <div className="signup-link">
       <Link to="/signup" className="text-[#d98aff] hover:underline block">
            Don't have an account? Create one
         </Link>
         <br />
        <Link to="/auth/google" className="text-[#d98aff] hover:underline block google-auth">
          Login with Google
         </Link>

        <br />
       </div>
      </div>
      <div className="auth-pattern">
      <AuthImagePattern
      
      title="Join our community"
      subtitle="Connect with friends, share moments, and stay in touch with your loved ones" 
    />
    </div>
    </div>
  );
};

export default Login;

