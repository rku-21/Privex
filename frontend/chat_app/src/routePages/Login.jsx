
import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import "./styles/login.css";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { Loader2, Sun, Moon } from "lucide-react";

const Login = () => {
  const { login, isLoginingUp } = useAuthStore();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { theme, toggleTheme } = useThemeStore();

  const validFrom = () => {
    if (!formData.email.trim()) return window.toast?.error("Email is required");
    if (!formData.password) return window.toast?.error("Password is required");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = validFrom();
    if (success === true) {
      login(formData);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="full-container login-page-root">
      <div className="login-header-row">
        <div className="login-logo" style={{ fontSize: '2.1rem' }}>🔒 Privex</div>
        <button className={"darkmode-switch" + (theme === "dark" ? " dark" : "")}
          onClick={toggleTheme} aria-label="Toggle dark mode">
          <span className="slider" style={{ left: theme === "dark" ? 24 : 4 }}></span>
     
        </button>
      </div>
      <div className="login-container modern-glass">
        <h2 className="login-title">
          Welcome <span style={{ color: "#d98aff" }}>Back</span>
        </h2>
        <p className="login-subtitle">Sign in to your Account</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="floating-label-group">
            <input
              type="text"
              name="email"
              id="login-email"
              placeholder=""
              onChange={handleChange}
              value={formData.email}
              required
              autoComplete="username"
              className="floating-input"
            />
            <label htmlFor="login-email" className="floating-label">Email</label>
          </div>
          <div className="password-wrapper floating-label-group">
            <input
              type={passwordVisible ? "text" : "password"}
              name="password"
              id="login-password"
              placeholder=""
              onChange={handleChange}
              value={formData.password}
              required
              autoComplete="current-password"
              className="floating-input"
            />
            <label htmlFor="login-password" className="floating-label">Password</label>
            <span
              onClick={() => setPasswordVisible((prev) => !prev)}
              className="password-toggle"
              aria-label="Toggle password visibility"
            >
              {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
            </span>
          </div>
          <button type="submit" className="btn btn-primary w-full login-btn" disabled={isLoginingUp}>
            {isLoginingUp ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Loading...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
        <div className="divider"><span>or</span></div>
        <a href="/auth/google" className="google-login-btn">
          <img src="/google-icon.svg" alt="Google" className="google-icon" /> Login with Google
        </a>
        <div className="signup-link">
          <Link to="/signup" className="text-[#d98aff] hover:underline block">
            Don't have an account? Create one
          </Link>
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

// Eye icons for password toggle
function EyeIcon() {
  return (
    <svg width="22" height="22" fill="none" stroke="#d98aff" strokeWidth="2" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="7" ry="5"/><circle cx="12" cy="12" r="2.5"/></svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="22" height="22" fill="none" stroke="#d98aff" strokeWidth="2" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="7" ry="5"/><line x1="4" y1="4" x2="20" y2="20"/></svg>
  );
}

export default Login;

