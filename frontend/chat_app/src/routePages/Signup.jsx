import React, { useState } from 'react';
import { Eye, EyeOff, Sun, Moon, Loader2, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';



export default function Signup() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({ fullname: '', email: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { setAuthUser,requestSignup } = useAuthStore();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const validForm = () => {
    if (!formData.fullname.trim()){
      return toast.error("Name is  Required");
    }
    if (!formData.email.trim()) {
      return toast.error('Email is required');
    }
    if (!formData.password) return toast.error('Password is required');
    if (formData.password.length < 6) return window.toast?.error('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) return window.toast?.error('Passwords do not match');
    return true;
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    const success = validForm();
    if (success !== true) return;
    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      window.toast?.error('Request timeout');
    }, 35000); 

    try {
      const { confirmPassword, ...signupData } = formData; // remove the confrimPassword
      const res = await requestSignup(signupData);
      clearTimeout(timeoutId); 
      window.toast?.success(res.data.message || 'OTP sent to your email!');
      setStep(2);
      setResendTimer(60); 
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      clearTimeout(timeoutId); 
      console.error('OTP request error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      return window.toast?.error('Please enter valid 6 digit OTP');
    }
    setIsLoading(true);
    try {
      const res = await axiosInstance.post('/auth/verify-signup', {
        email: formData.email,
        otp: otp
      });

     
      setAuthUser(res.data);

      window.toast?.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      window.toast?.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);

  
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      window.toast?.error('Request timeout Please try again');
    }, 35000);

    try {
      const res = await axiosInstance.post('/auth/resend-otp', { email: formData.email });
      clearTimeout(timeoutId);
      window.toast?.success(res.data.message || 'New OTP sent!');
      setResendTimer(60);

      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      clearTimeout(timeoutId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
     
      <div
        className={`flex justify-between items-center p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm fixed top-0 left-0 w-full z-50`}
      >
        <h1 className={` text-2xl font-extrabold text-transparent bg-clip-text ${isDark
            ? 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500'
            : 'bg-gradient-to-r from-green-500 via-blue-500 to-purple-600'


          }`}> Privex</h1>
      </div>

      
      <div className="flex items-center justify-center min-h-screen">
        <div
          className={`w-full max-w-md rounded-2xl shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-8 m-2`}
          style={{ marginTop: '4rem' }}
        >
          
          <div className="flex flex-col items-center mb-8">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className={`self-start mb-4 flex items-center gap-2 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-green-600 hover:text-green-500'
                  }`}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            <h2
              className={`text-2xl font-bold text-center bg-clip-text text-transparent ${isDark
                  ? 'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500'
                  : 'bg-gradient-to-r from-green-600 to-blue-600'
                }`}
            >
              {step === 1 ? 'Create Account' : 'Verify Email'}
            </h2>
            <p
              className={`text-sm text-center mt-2 bg-clip-text text-transparent ${isDark
                  ? 'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500'
                  : 'bg-gradient-to-r from-green-600 to-blue-600'
                }`}
            >
              {step === 1 ? 'Join Privex and get started' : `Enter the 6-digit code sent to ${formData.email}`}
            </p>
          </div>

        
          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-6">
              
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
                  className={`w-full px-4 py-3 rounded-lg border transition-colors duration-200 ${isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-green-500'
                    } focus:ring-2 focus:ring-opacity-50`}
                  placeholder="Enter your name"
                  required
                />
              </div>

              
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
                  className={`w-full px-4 py-3 rounded-lg border transition-colors duration-200 ${isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-green-500'
                    } focus:ring-2 focus:ring-opacity-50`}
                  placeholder="Enter your email"
                  required
                />
              </div>

              
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
                    className={`w-full px-4 py-3 pr-12 rounded-lg border transition-colors duration-200 ${isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-green-500'
                      } focus:ring-2 focus:ring-opacity-50`}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>



              
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
                    className={`w-full px-4 py-3 pr-12 rounded-lg border transition-colors duration-200 ${isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-green-500'
                      } focus:ring-2 focus:ring-opacity-50`}
                    placeholder="Re-enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${isDark
                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50'
                    : 'bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-500 focus:ring-opacity-50'
                  } shadow-lg hover:shadow-xl flex justify-center items-center`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Sending OTP...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </form>
          )}

         
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label
                  htmlFor="otp"
                  className={`block text-sm font-medium mb-2 text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Enter OTP
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors duration-200 text-center text-2xl tracking-widest font-bold ${isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-green-500'
                    } focus:ring-2 focus:ring-opacity-50`}
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
                <p className={`text-xs mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  OTP valid for 10 minutes
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${isDark
                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-600'
                    : 'bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-gray-400'
                  } shadow-lg hover:shadow-xl flex justify-center items-center disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Verifying...
                  </>
                ) : (
                  'Verify & Create Account'
                )}
              </button>

             
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || isLoading}
                  className={`text-sm font-medium ${resendTimer > 0 || isLoading
                      ? 'text-gray-400 cursor-not-allowed'
                      : isDark
                        ? 'text-blue-400 hover:text-blue-300'
                        : 'text-green-600 hover:text-green-500'
                    } transition-colors`}
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

        
          <div className="text-center mt-6">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Already have an account?{' '}
              <Link
                to="/login"
                className={`font-medium ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-green-600 hover:text-green-500'
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
