import { useState } from "react";
import styles from './styles/Signup.module.css';
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

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

  return (
    <div className={styles["full-container"]}>
      <div className={styles["login-container"]}>
        <div>
          <h2>Create Account</h2>
        </div>


        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullname"
            placeholder="Full Name"
            onChange={handleChange}
            value={formData.fullname}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <div className={styles["password-wrapper"]}>
            <input
              type={showPassword.password ? "text" : "password"}
              name="password"
              placeholder="Password"
              onChange={handleChange}
              value={formData.password}
              required
            />
            <span
              onClick={() => toggleVisibility("password")}
              className={styles["toggle-password"]}
            >
              👁️
            </span>
          </div>
          <div className={styles["password-wrapper"]}>
            <input
              type={showPassword.confirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              onChange={handleChange}
              value={formData.confirmPassword}
              required
            />
            <span
              onClick={() => toggleVisibility("confirmPassword")}
              className={styles["toggle-password"]}
            >
              👁️
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isSigningUp}
          >
            {isSigningUp ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : (
              "Sign up"
            )}
          </button>
        </form>

        <p className={styles["signup-link"]}>
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
      <div className={styles["auth-pattern"]}>
      <AuthImagePattern
      
      title="Join our community"
      subtitle="Connect with friends, share moments, and stay in touch with your loved ones" 
    />
    </div>
    </div>
  );
};

export default Signup;




