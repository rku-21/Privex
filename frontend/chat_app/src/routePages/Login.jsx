import React, { useState } from 'react';
import { Eye, EyeOff, Sun, Moon, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';


export default function Login() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login, isLoginingUp } = useAuthStore();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const validForm = () => {
    if (!formData.email.trim()) return window.toast?.error('Email is required');
    if (!formData.password) return window.toast?.error('Password is required');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = validForm();
    if (success === true) {
      login(formData);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`flex justify-between items-center h-15 p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm fixed top-0 left-0 w-full z-50`}>
       <h1
        className={`text-2xl font-extrabold text-transparent bg-clip-text ${
            isDark
              ? 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500'
              : 'bg-gradient-to-r from-green-500 via-blue-500 to-purple-600'
          }`}
      >
          🔒 Privex
      </h1>


        {/* Theme Toggle */}
        <div className="flex items-center space-x-3">
          <Sun className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-yellow-500'}`} />
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-300 ${
              isDark ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                isDark ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <Moon className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-gray-400'}`} />
        </div>
      </div>

      {/* Main */}
      <div className="flex items-center justify-center min-h-screen">
        <div
          className={`w-full max-w-md rounded-2xl shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-8 m-2`}
          style={{ marginTop: '4rem' }} // Push below fixed header
        >
          {/* Heading */}
          <div className="flex flex-col items-center mb-8">
            <h2
              className={`text-2xl font-bold text-center bg-clip-text text-transparent ${
                isDark
                  ? 'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500'
                  : 'bg-gradient-to-r from-green-600 to-blue-600'
              }`}
            >
              Welcome Back
            </h2>
            <p
              className={`text-sm text-center mt-2 bg-clip-text text-transparent ${
                isDark
                  ? 'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500'
                  : 'bg-gradient-to-r from-green-600 to-blue-600'
              }`}
            >
              Sign in to continue with Privex
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border transition-colors duration-200 ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-green-500'
                } focus:ring-2 focus:ring-opacity-50`}
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-4 py-3 pr-12 rounded-lg border transition-colors duration-200 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-green-500'
                  } focus:ring-2 focus:ring-opacity-50`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                    isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoginingUp}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50'
                  : 'bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-500 focus:ring-opacity-50'
              } shadow-lg hover:shadow-xl flex justify-center items-center`}
            >
              {isLoginingUp ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className={`flex-grow border-t ${isDark ? 'border-gray-600' : 'border-gray-300'}`} />
            <span className={`flex-shrink-0 px-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>or</span>
            <div className={`flex-grow border-t ${isDark ? 'border-gray-600' : 'border-gray-300'}`} />
          </div>

          {/* Google Login */}
          <a
            href="/auth/google"
            className="flex items-center justify-center w-full py-3 px-4 border rounded-lg hover:shadow transition-colors duration-200"
          >
            {/* <img src="/google-icon.svg" alt="Google" className="w-5 h-5 mr-2" /> */}
            <i className="fa-brands fa-google w-5 h-5 mr-3 mt-2"></i>
            Login with Google
          </a>

          {/* Signup */}
          <div className="text-center mt-6">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Don&apos;t have an account?{' '}
              <Link
                to="/signup"
                className={`font-medium ${
                  isDark ? 'text-blue-400 hover:text-blue-300' : 'text-green-600 hover:text-green-500'
                } transition-colors`}
              >
                Sign up
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}



