import React, { useState } from 'react';
import { Mail, MessageSquare, Send, Phone, CheckCircle } from 'lucide-react';
import BottomNavbar from '../components/bottomNav/BottomNavbar';
import { Navbar } from '../components/navbar/Navbar';
import { useThemeStore } from '../store/useThemeStore';

export const Contact = () => {
  const { theme } = useThemeStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className={`min-h-screen ${
      theme === "dark" 
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black" 
        : "bg-gray-50"
    }`}
    style={theme === "dark" ? {
      background: 'linear-gradient(135deg, #0f0c29, #24204e, #1b1b31)'
    } : {}}
    >
      
      <div className="fixed top-0 left-0 right-0 z-50"
        style={theme === "dark" ? {
          background: 'rgba(26, 26, 46, 0.97)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        } : {}}
      >
        <Navbar />
      </div>

      <div className="pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
         

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
            <div className="lg:col-span-1 space-y-6 mt-4">
              <div className={`rounded-2xl p-6 transition-all duration-300 ${
                theme === "dark" 
                  ? "bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10" 
                  : "bg-white border border-gray-200 hover:shadow-lg"
              }`}>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Email Us
                </h3>
                <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                  support@privex.com
                </p>
              </div>

              <div className={`rounded-2xl p-6 transition-all duration-300 ${
                theme === "dark" 
                  ? "bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10" 
                  : "bg-white border border-gray-200 hover:shadow-lg"
              }`}>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Call Us
                </h3>
                <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                  +1 (555) 123-4567
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className={`rounded-2xl p-8 ${
                theme === "dark" 
                  ? "bg-white/5 backdrop-blur-lg border border-white/10" 
                  : "bg-white border border-gray-200"
              }`}>
                {submitted ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className={`text-2xl font-bold mb-2 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      Message Sent!
                    </h3>
                    <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                      We'll get back to you soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}>
                          Your Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                            theme === "dark"
                              ? "bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400"
                              : "bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400"
                          }`}
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                            theme === "dark"
                              ? "bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400"
                              : "bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400"
                          }`}
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          theme === "dark"
                            ? "bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400"
                            : "bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400"
                        }`}
                        placeholder="How can we help you?"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows="6"
                        className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none ${
                          theme === "dark"
                            ? "bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400"
                            : "bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400"
                        }`}
                        placeholder="Tell us more about your inquiry..."
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center gap-2 group"
                    >
                      <span>Send Message</span>
                      <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          
          <div className={`mt-16 rounded-2xl p-8 ${
            theme === "dark" 
              ? "bg-white/5 backdrop-blur-lg border border-white/10" 
              : "bg-white border border-gray-200"
          }`}>
            <h2 className={`text-3xl font-bold mb-8 text-center ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`rounded-xl p-6 ${
                theme === "dark" 
                  ? "bg-gray-800/30 border border-gray-700/50" 
                  : "bg-gray-50 border border-gray-200"
              }`}>
                <h3 className={`text-lg font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  How quickly will I get a response?
                </h3>
                <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                  We typically respond within 24 hours during business days.
                </p>
              </div>
              <div className={`rounded-xl p-6 ${
                theme === "dark" 
                  ? "bg-gray-800/30 border border-gray-700/50" 
                  : "bg-gray-50 border border-gray-200"
              }`}>
                <h3 className={`text-lg font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  What are your support hours?
                </h3>
                <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                  Our team is available Monday-Friday, 9AM-6PM EST.
                </p>
              </div>
              <div className={`rounded-xl p-6 ${
                theme === "dark" 
                  ? "bg-gray-800/30 border border-gray-700/50" 
                  : "bg-gray-50 border border-gray-200"
              }`}>
                <h3 className={`text-lg font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Can I schedule a call?
                </h3>
                <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                  Yes! Mention your preferred time in the message form.
                </p>
              </div>
              <div className={`rounded-xl p-6 ${
                theme === "dark" 
                  ? "bg-gray-800/30 border border-gray-700/50" 
                  : "bg-gray-50 border border-gray-200"
              }`}>
                <h3 className={`text-lg font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Do you offer live chat support?
                </h3>
                <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                  Live chat is available for premium users during business hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
     <div className="fixed bottom-0 w-full z-40">
        <BottomNavbar />
      </div>
    </div>
  );
};
