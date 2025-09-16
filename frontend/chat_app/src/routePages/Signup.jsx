
import { useState } from "react";
import styles from './styles/signup.module.css';
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";
import { Loader2} from "lucide-react";

const Signup = () => {
  const { signup, isSigningUp } = useAuthStore();
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setshowPassword] = useState({
    password: false,
    confirmPassword: false
  });

  const toggleVisibility = (field) => {
    setshowPassword((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validFrom = () => {
    if (!formData.fullname.trim()) return toast.error("Full name is required");
    if (!formData.email.trim()) return toast.error("Email is required");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return toast.error("Enter a valid email address");

    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 6) return toast.error("Password must be at least 6 characters");

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formDataobj = new FormData(e.target);
    const data = Object.fromEntries(formDataobj.entries());

    if (data.password !== data.confirmPassword) {
      toast.error("Invalid Password");
      return;
    }

    const success = validFrom();
    if (success === true) {
      const { fullname, email, password } = data;
      signup({ fullname, email, password });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const { theme, toggleTheme } = useThemeStore();
  return (
    <div className={styles["full-container"] + " signup-page-root"}>
      <div className="login-header-row">
        <div className="login-logo" style={{ fontSize: '2.1rem' }}>🔒 Privex</div>
        <button className={"darkmode-switch" + (theme === "dark" ? " dark" : "")}
          onClick={toggleTheme} aria-label="Toggle dark mode">
          <span className="slider" style={{ left: theme === "dark" ? 24 : 4 }}></span>
         
        </button>
      </div>
      <div className={styles["login-container"] + " modern-glass"}>
        <h2 className="login-title">Create Account</h2>
        <p className="login-subtitle">Welcome to Privex! Join us</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className={styles["floating-label-group"]}>
            <input
              type="text"
              name="fullname"
              id="signup-fullname"
              autoComplete="name"
              placeholder=""
              onChange={handleChange}
              value={formData.fullname}
              required
              className={styles["floating-input"]}
            />
            <label htmlFor="signup-fullname" className={styles["floating-label"]}>Full Name</label>
          </div>
          <div className={styles["floating-label-group"]}>
            <input
              type="email"
              name="email"
              id="signup-email"
              autoComplete="email"
              placeholder=""
              value={formData.email}
              onChange={handleChange}
              required
              className={styles["floating-input"]}
            />
            <label htmlFor="signup-email" className={styles["floating-label"]}>Email</label>
          </div>
          <div className={styles["signup-password-row"]}>
            <div className={styles["password-wrapper"] + " " + styles["floating-label-group"]}>
              <input
                type={showPassword.password ? "text" : "password"}
                name="password"
                id="signup-password"
                autoComplete="new-password"
                placeholder=""
                onChange={handleChange}
                value={formData.password}
                required
                className={styles["floating-input"]}
              />
              <label htmlFor="signup-password" className={styles["floating-label"]}>Password</label>
              <span
                onClick={() => toggleVisibility("password")}
                className={styles["toggle-password"] + " password-toggle"}
              >
                {showPassword.password ? <EyeOffIcon /> : <EyeIcon />}
              </span>
            </div>
            <div className={styles["password-wrapper"] + " " + styles["floating-label-group"]}>
              <input
                type={showPassword.confirmPassword ? "text" : "password"}
                name="confirmPassword"
                id="signup-confirmPassword"
                autoComplete="new-password"
                placeholder=""
                onChange={handleChange}
                value={formData.confirmPassword}
                required
                className={styles["floating-input"]}
              />
              <label htmlFor="signup-confirmPassword" className={styles["floating-label"]}>Confirm Password</label>
              <span
                onClick={() => toggleVisibility("confirmPassword")}
                className={styles["toggle-password"] + " password-toggle"}
              >
                {showPassword.confirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </span>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full login-btn"
            disabled={isSigningUp}
          >
            {isSigningUp ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Loading...
              </>
            ) : (
              "Sign up"
            )}
          </button>
        </form>
        <div className="divider"><span>or</span></div>
        <a href="/auth/google" className="google-login-btn">
          <img src="/google-icon.svg" alt="Google" className="google-icon" /> Continue with Google
        </a>
        <div className="signup-link">
          Already have an account? <a href="/login">Login here</a>
        </div>
      </div>
      <div className={styles["auth-pattern"]}>
        <AuthImagePattern
          title="Join our community"
          subtitle="Connect with friends, share moments, and stay in touch with your loved ones"
        />
      </div>
    </div>
  );
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


};

export default Signup;




