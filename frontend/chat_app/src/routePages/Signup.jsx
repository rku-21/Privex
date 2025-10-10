import React, { useState } from 'react';
import { Eye, EyeOff, Sun, Moon, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';


export default function Signup() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({ fullname: '', email: '', password: '', confirmPassword: '' });
  const { signup, isSigningUp } = useAuthStore();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const validForm = () => {
    if (!formData.fullname.trim()) return window.toast?.error('Name is required');
    if (!formData.email.trim()) return window.toast?.error('Email is required');
    if (!formData.password) return window.toast?.error('Password is required');
    if (formData.password.length <6) return window.toast?.error('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) return window.toast?.error('Passwords do not match');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData); // Add this line
    const success = validForm();
    if (success === true) {
      const { confirmPassword, ...signupData} = formData;
      signup(signupData);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div
        className={`flex justify-between items-center p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm fixed top-0 left-0 w-full z-50`}
      >
        <h1 className={` text-2xl font-extrabold text-transparent bg-clip-text ${
          
          isDark 
               ? 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500'
              : 'bg-gradient-to-r from-green-500 via-blue-500 to-purple-600'
        
        
        }`}>🔒 Privex</h1>

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
          style={{ marginTop: '4rem' }}
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
              Create Account
            </h2>
            <p
              className={`text-sm text-center mt-2 bg-clip-text text-transparent ${
                isDark
                  ? 'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500'
                  : 'bg-gradient-to-r from-green-600 to-blue-600'
              }`}
            >
              Join Privex and get started
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.fullname}
                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border transition-colors duration-200 ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-green-500'
                } focus:ring-2 focus:ring-opacity-50`}
                placeholder="Enter your name"
                required
              />
            </div>

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

      
            
            {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border transition-colors duration-200 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-green-500'
                    } focus:ring-2 focus:ring-opacity-50`}
                    placeholder="Re-enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                      isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>


            

            {/* Submit */}
            <button
              type="submit"
              disabled={isSigningUp}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50'
                  : 'bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-500 focus:ring-opacity-50'
              } shadow-lg hover:shadow-xl flex justify-center items-center`}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Creating...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          {/* Already have account */}
          <div className="text-center mt-6">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Already have an account?{' '}
              <Link
                to="/login"
                className={`font-medium ${
                  isDark ? 'text-blue-400 hover:text-blue-300' : 'text-green-600 hover:text-green-500'
                } transition-colors`}
              >
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
