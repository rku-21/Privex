import React, { useState, useRef, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import './settings.css';
import './styles/profileImageModal.css';
import { motion } from 'framer-motion';
import { Navbar } from '../components/navbar/Navbar';
import BottomNavbar from '../components/bottomNav/BottomNavbar';


export default function Settings() {
 
  const [showProfileModal, setShowProfileModal] = useState(false);
  const handleOpenProfileModal = () => setShowProfileModal(true);
  const handleCloseProfileModal = () => setShowProfileModal(false);
  
  const { theme, toggleTheme } = useThemeStore();
  const { authUser, isUpdateingProfileUP, updateProfile } = useAuthStore();
  const [img, setimg] = useState(null);
  // Profile image upload logic (copied from Profile.jsx)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setimg(base64Image);
      await updateProfile({ profilePicture: base64Image });
    };
  };

 
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const searchInputRef = useRef(null);

  // Settings options for search
  const settingsOptions = [
    { label: 'Dark Mode', id: 'darkmode' },
    { label: 'Profile', id: 'profile' },
    { label: 'Change Password', id: 'password' },
    { label: 'Notifications', id: 'notifications' },
    { label: 'Notification Sound', id: 'notifications' },
    { label: 'Notification Tone', id: 'notifications' },
    { label: 'Language', id: 'language' },
    { label: 'Show Online Status', id: 'privacy' },
    { label: 'Last Seen', id: 'privacy' },
    { label: 'Private Account', id: 'privacy' },
    { label: 'Blocked Contacts', id: 'blocked' },
    { label: 'App Info', id: 'appinfo' },
    { label: 'Privacy Policy', id: 'appinfo' },
    { label: 'Terms of Service', id: 'appinfo' },
  ];
  const [profile, setProfile] = useState({
    fullname: authUser?.fullname || '',
    email: authUser?.email || '',
  });
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [notifications, setNotifications] = useState({
    enabled: true,
    sound: true,
    onlineStatus: true,
    lastSeen: 'everyone',
    tone: 'default',
  });
  const [blockedContacts, setBlockedContacts] = useState([
    // Example blocked contacts (replace with real data)
    { _id: '1', name: 'Blocked User 1' },
    { _id: '2', name: 'Blocked User 2' },
  ]);
  const appVersion = '1.0.0';
  const [language, setLanguage] = useState('en');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  // Handle profile field changes
  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // Handle password field changes
  const handlePasswordChange = (e) => {
    setPassword({ ...password, [e.target.name]: e.target.value });
  };

  // Handle notification toggles and dropdowns
  const handleToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const handleToneChange = (e) => {
    setNotifications((prev) => ({ ...prev, tone: e.target.value }));
  };
  const handleLastSeenChange = (e) => {
    setNotifications((prev) => ({ ...prev, lastSeen: e.target.value }));
  };
  const handleUnblock = (id) => {
    setBlockedContacts((prev) => prev.filter((c) => c._id !== id));
  };

  // Handle language change
  const handleLangChange = (e) => {
    setLanguage(e.target.value);
  };

  // Search logic
  const handleSearchIcon = () => {
    setShowSearch(true);
    setTimeout(() => searchInputRef.current && searchInputRef.current.focus(), 100);
  };
  const handleBackFromSearch = () => {
    setShowSearch(false);
    setSearchValue('');
    setSearchSuggestions([]);
  };
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    if (val.trim()) {
      // Match if any word in label starts with or includes the input (case-insensitive)
      const filtered = settingsOptions.filter(opt =>
        opt.label.toLowerCase().split(/\s+/).some(word => word.startsWith(val.toLowerCase()) || word.includes(val.toLowerCase()))
        || opt.label.toLowerCase().includes(val.toLowerCase())
      );
      setSearchSuggestions(filtered);
      // Auto-scroll to the first matching section if available
      if (filtered.length > 0) {
        // Try to find the section in both columns (single and two-col)
        const allSections = document.querySelectorAll('.settings-section[id="' + filtered[0].id + '"]');
        let el = null;
        if (allSections.length === 1) {
          el = allSections[0];
        } else if (allSections.length > 1) {
          // Prefer the one that is visible in the viewport
          el = Array.from(allSections).find(sec => sec.offsetParent !== null);
        }
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // Debug: log if not found
          console.warn('No visible section found for id', filtered[0].id, allSections);
        }
      }
    } else {
      setSearchSuggestions([]);
    }
  };
  const handleSuggestionClick = (id) => {
    // Scroll to the first visible section with the id (handle both columns)
    const allSections = document.querySelectorAll('.settings-section[id="' + id + '"]');
    let el = null;
    if (allSections.length === 1) {
      el = allSections[0];
    } else if (allSections.length > 1) {
      // Prefer the one that is visible in the viewport
      el = Array.from(allSections).find(sec => sec.offsetParent !== null);
    }
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setShowSearch(false);
      setSearchValue('');
      setSearchSuggestions([]);
    } else {
      // Debug: log if not found
      console.warn('No visible section found for id', id, allSections);
    }
  };
  const handleSave = (e) => {
    e.preventDefault();
    let errs = {};
    setSuccess('');
    // Profile validation
    if (!profile.fullname.trim()) errs.fullname = 'Name required';
    if (!profile.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.email)) errs.email = 'Valid email required';
    // Password validation (if changing)
    if (password.new || password.confirm) {
      if (!password.current) errs.current = 'Current password required';
      if (password.new.length < 6) errs.new = 'Min 6 chars';
      if (password.new !== password.confirm) errs.confirm = 'Passwords do not match';
    }
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setSuccess('Settings saved!');
      // Here you would call backend update APIs
    }
  };

  // Reset all fields to initial state
  const handleReset = () => {
    setProfile({ fullname: authUser?.fullname || '', email: authUser?.email || '' });
    setPassword({ current: '', new: '', confirm: '' });
    setNotifications({ enabled: true, sound: true });
    setLanguage('en');
    setErrors({});
    setSuccess('');
  };

  // Track window width for responsive rendering
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = windowWidth <= 600;
  const isSingleCol = windowWidth < 900;

  return (
    <>
      {/* Top Navbar for large screens only */}
      {!isMobile && <div className="settings-top-navbar"><Navbar /></div>}
      <motion.div
        className={`settings-main-layout${theme === 'dark' ? ' dark-mode' : ''}`}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ minHeight: '100vh' }}
      >
      {isSingleCol ? (
        // Single container for all settings on mobile/tablet
        <div className="settings-container settings-single-col">
          {/* ...all single-col content as before... */}
          {/* Top bar and search bar inside settings container */}
          <div className="settings-topbar">
            {!showSearch ? (
              <>
                <span className="settings-back-arrow" onClick={() => navigate(-1)} title="Back" tabIndex={0}>
                  <i className="fa-solid fa-arrow-left"></i>
                </span>
                <span className="settings-topbar-title">Settings</span>
                <span className="settings-search-icon" onClick={handleSearchIcon} title="Search" tabIndex={0}>
                  <i className="fa-solid fa-magnifying-glass"></i>
                </span>
              </>
            ) : (
              <>
                <span className="settings-back-arrow" onClick={handleBackFromSearch} title="Back" tabIndex={0}>
                  <i className="fa-solid fa-arrow-left"></i>
                </span>
                <input
                  ref={searchInputRef}
                  className="settings-searchbar-input"
                  type="text"
                  placeholder="Search settings..."
                  value={searchValue}
                  onChange={handleSearchChange}
                  style={{ flex: 1, marginLeft: '0.7rem', marginRight: '0.7rem' }}
                />
              </>
            )}
          </div>
          {/* Suggestions dropdown in search mode */}
          {showSearch && (
            <div className="settings-search-suggestions" style={{ position: 'relative', top: 0, left: 0, right: 0, margin: '0.2rem 0 1rem 0' }}>
              {searchSuggestions.length > 0 ? (
                searchSuggestions.map(opt => (
                  <div
                    key={opt.id + opt.label}
                    className="settings-search-suggestion"
                    onClick={() => handleSuggestionClick(opt.id)}
                  >
                    {opt.label}
                  </div>
                ))
              ) : (
                <div className="settings-search-suggestion" style={{ color: '#aaa', cursor: 'default' }}>
                  No results found
                </div>
              )}
            </div>
          )}
          {/* Suggestions box above dark mode (when not in search mode) */}
          {searchValue && searchSuggestions.length > 0 && !showSearch && (
            <div className="settings-search-suggestions-box">
              {searchSuggestions.map(opt => (
                <div
                  key={opt.id + opt.label}
                  className="settings-search-suggestion"
                  onClick={() => handleSuggestionClick(opt.id)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
          {/* User profile section */}
          <div className="settings-section" id="profile">
            <div className="settings-title">Profile</div>
            <div className="settings-profile-row large">
              <div className="avatar-wrapper settings-avatar-wrapper">
                <img
                  src={img || authUser?.profilePicture || '/avatar.png'}
                  alt="avatar"
                  className="settings-avatar large"
                  style={{ cursor: 'pointer' }}
                  onClick={handleOpenProfileModal}
                  tabIndex={0}
                  title="View full image"
                />
                <label
                  htmlFor="settings-avatar-upload"
                  className={`avatar-upload${isUpdateingProfileUP ? ' disabled' : ''}`}
                  style={{ position: 'absolute', bottom: 0, right: 0 }}
                >
                  <Camera className="camera-icon" />
                  <input
                    type="file"
                    id="settings-avatar-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUpdateingProfileUP}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <div className="settings-profile-fields">
                <input
                  className="settings-input"
                  name="fullname"
                  value={profile.fullname}
                  onChange={handleProfileChange}
                  placeholder="Full Name"
                  autoComplete="off"
                />
                {errors.fullname && <div className="settings-error">{errors.fullname}</div>}
                <input
                  className="settings-input"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  placeholder="Email"
                  autoComplete="off"
                />
                {errors.email && <div className="settings-error">{errors.email}</div>}
              </div>
            </div>
          </div>
          {/* Change password section */}
          <div className="settings-section" id="password">
            <div className="settings-title">Change Password</div>
            <input
              className="settings-input"
              name="current"
              value={password.current}
              onChange={handlePasswordChange}
              placeholder="Current Password"
              type="password"
              autoComplete="off"
            />
            {errors.current && <div className="settings-error">{errors.current}</div>}
            <input
              className="settings-input"
              name="new"
              value={password.new}
              onChange={handlePasswordChange}
              placeholder="New Password"
              type="password"
              autoComplete="off"
            />
            {errors.new && <div className="settings-error">{errors.new}</div>}
            <input
              className="settings-input"
              name="confirm"
              value={password.confirm}
              onChange={handlePasswordChange}
              placeholder="Confirm New Password"
              type="password"
              autoComplete="off"
            />
            {errors.confirm && <div className="settings-error">{errors.confirm}</div>}
          </div>
          {/* Notification settings */}
          <div className="settings-section" id="notifications">
            <div className="settings-title">Notifications</div>
            <div className="settings-toggle-row">
              <span className="settings-toggle-label">Enable Notifications</span>
              <div
                className={`settings-toggle${notifications.enabled ? ' active' : ''}`}
                onClick={() => handleToggle('enabled')}
                aria-label="Toggle notifications"
              >
                <div className="settings-toggle-knob" />
              </div>
            </div>
            <div className="settings-toggle-row">
              <span className="settings-toggle-label">Notification Sound</span>
              <div
                className={`settings-toggle${notifications.sound ? ' active' : ''}`}
                onClick={() => handleToggle('sound')}
                aria-label="Toggle notification sound"
              >
                <div className="settings-toggle-knob" />
              </div>
            </div>
            <div className="settings-toggle-row">
              <span className="settings-toggle-label">Notification Tone</span>
              <select className="settings-lang-select" value={notifications.tone} onChange={handleToneChange}>
                <option value="default">Default</option>
                <option value="chime">Chime</option>
                <option value="pop">Pop</option>
                <option value="ding">Ding</option>
              </select>
            </div>
          </div>
          {/* Language selection */}
          <div className="settings-section" id="language">
            <div className="settings-title">Language</div>
            <select
              className="settings-lang-select"
              value={language}
              onChange={handleLangChange}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
          {/* Privacy Section */}
          <div className="settings-section" id="privacy">
            <div className="settings-title">Privacy</div>
            <div className="settings-toggle-row">
              <span className="settings-toggle-label">Show Online Status</span>
              <div
                className={`settings-toggle${notifications.onlineStatus ? ' active' : ''}`}
                onClick={() => handleToggle('onlineStatus')}
                aria-label="Toggle online status"
              >
                <div className="settings-toggle-knob" />
              </div>
            </div>
            <div className="settings-toggle-row">
              <span className="settings-toggle-label">Last Seen</span>
              <select className="settings-lang-select" value={notifications.lastSeen} onChange={handleLastSeenChange}>
                <option value="nobody">Nobody</option>
                <option value="everyone">Everyone</option>
                <option value="contacts">Friends</option>
              </select>
            </div>
            <div className="settings-toggle-row">
              <span className="settings-toggle-label">Private Account</span>
              <div
                className={`settings-toggle${notifications.privateAccount ? ' active' : ''}`}
                onClick={() => handleToggle('privateAccount')}
                aria-label="Toggle private account"
              >
                <div className="settings-toggle-knob" />
              </div>
            </div>
          </div>
          {/* Blocked Contacts Section */}
          <div className="settings-section" id="blocked">
            <div className="settings-title">Blocked Contacts</div>
            {blockedContacts.length === 0 ? (
              <div style={{ color: '#8e44ad', opacity: 0.7, fontSize: '1rem', margin: '0.5rem 0' }}>No blocked contacts</div>
            ) : (
              <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                {blockedContacts.map((c) => (
                  <li key={c._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>{c.name}</span>
                    <button className="settings-btn reset unblock" onClick={() => handleUnblock(c._id)}>Unblock</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* App Info Section */}
          <div className="settings-section" id="appinfo">
            <div className="settings-title">App Info</div>
            <div style={{ marginBottom: '0.7rem', color: '#8e44ad', fontWeight: 500 }}>Version: {appVersion}</div>
            <a href="/privacy-policy" className="settings-link" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            <span style={{ margin: '0 0.5rem' }}>|</span>
            <a href="/terms-of-service" className="settings-link" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            <div style={{ marginTop: '1.2rem', color: '#8e44ad', fontWeight: 600, fontSize: '1.1rem', textAlign: 'center', opacity: 0.7 }}>
              Privex Private Limited
            </div>
          </div>
          {/* Save and Reset buttons at the end for mobile/tablet */}
          <div className="settings-btn-row">
            <button className="settings-btn" onClick={handleSave}>Save</button>
            <button className="settings-btn reset" onClick={handleReset}>Reset</button>
          </div>
          {success && <div className="settings-success">{success}</div>}
        </div>
      ) : (
        <>
          {/* Left: Main settings */}
          <div className="settings-container">
            {/* ...existing left container content (profile, password, notifications, language, save/reset)... */}
            {/* Top bar and search bar inside settings container */}
            <div className="settings-topbar">
              {!showSearch ? (
                <>
                  <span className="settings-back-arrow" onClick={() => navigate(-1)} title="Back" tabIndex={0}>
                    <i className="fa-solid fa-arrow-left"></i>
                  </span>
                  <span className="settings-topbar-title">Settings</span>
                  <span className="settings-search-icon" onClick={handleSearchIcon} title="Search" tabIndex={0}>
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </span>
                </>
              ) : (
                <>
                  <span className="settings-back-arrow" onClick={handleBackFromSearch} title="Back" tabIndex={0}>
                    <i className="fa-solid fa-arrow-left"></i>
                  </span>
                  <input
                    ref={searchInputRef}
                    className="settings-searchbar-input"
                    type="text"
                    placeholder="Search settings..."
                    value={searchValue}
                    onChange={handleSearchChange}
                    style={{ flex: 1, marginLeft: '0.7rem', marginRight: '0.7rem' }}
                  />
                </>
              )}
            </div>
            {/* Suggestions dropdown in search mode */}
            {showSearch && searchSuggestions.length > 0 && (
              <div className="settings-search-suggestions" style={{ position: 'relative', top: 0, left: 0, right: 0, margin: '0.2rem 0 1rem 0' }}>
                {searchSuggestions.length > 0 ? (
                  searchSuggestions.map(opt => (
                    <div
                      key={opt.id + opt.label}
                      className="settings-search-suggestion"
                      onClick={() => handleSuggestionClick(opt.id)}
                    >
                      {opt.label}
                    </div>
                  ))
                ) : (
                  <div className="settings-search-suggestion" style={{ color: '#aaa', cursor: 'default' }}>
                    No results found
                  </div>
                )}
              </div>
            )}
            {/* Suggestions box above dark mode (when not in search mode) */}
            {searchValue && searchSuggestions.length > 0 && !showSearch && (
              <div className="settings-search-suggestions-box">
                {searchSuggestions.map(opt => (
                  <div
                    key={opt.id + opt.label}
                    className="settings-search-suggestion"
                    onClick={() => handleSuggestionClick(opt.id)}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
            {/* User profile section */}
            <div className="settings-section" id="profile">
              <div className="settings-title">Profile</div>
              <div className="settings-profile-row large">
                <img
                  src={authUser?.profilePicture || '/avatar.png'}
                  alt="avatar"
                  className="settings-avatar large"
                  style={{ cursor: 'pointer' }}
                  onClick={handleOpenProfileModal}
                  tabIndex={0}
                  title="View full image"
                />
                <div className="settings-profile-fields">
                  <input
                    className="settings-input"
                    name="fullname"
                    value={profile.fullname}
                    onChange={handleProfileChange}
                    placeholder="Full Name"
                    autoComplete="off"
                  />
                  {errors.fullname && <div className="settings-error">{errors.fullname}</div>}
                  <input
                    className="settings-input"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    placeholder="Email"
                    autoComplete="off"
                  />
                  {errors.email && <div className="settings-error">{errors.email}</div>}
                </div>
              </div>
            </div>
            {/* Change password section */}
            <div className="settings-section" id="password">
              <div className="settings-title">Change Password</div>
              <input
                className="settings-input"
                name="current"
                value={password.current}
                onChange={handlePasswordChange}
                placeholder="Current Password"
                type="password"
                autoComplete="off"
              />
              {errors.current && <div className="settings-error">{errors.current}</div>}
              <input
                className="settings-input"
                name="new"
                value={password.new}
                onChange={handlePasswordChange}
                placeholder="New Password"
                type="password"
                autoComplete="off"
              />
              {errors.new && <div className="settings-error">{errors.new}</div>}
              <input
                className="settings-input"
                name="confirm"
                value={password.confirm}
                onChange={handlePasswordChange}
                placeholder="Confirm New Password"
                type="password"
                autoComplete="off"
              />
              {errors.confirm && <div className="settings-error">{errors.confirm}</div>}
            </div>
            {/* Notification settings */}
            <div className="settings-section" id="notifications">
              <div className="settings-title">Notifications</div>
              <div className="settings-toggle-row">
                <span className="settings-toggle-label">Enable Notifications</span>
                <div
                  className={`settings-toggle${notifications.enabled ? ' active' : ''}`}
                  onClick={() => handleToggle('enabled')}
                  aria-label="Toggle notifications"
                >
                  <div className="settings-toggle-knob" />
                </div>
              </div>
              <div className="settings-toggle-row">
                <span className="settings-toggle-label">Notification Sound</span>
                <div
                  className={`settings-toggle${notifications.sound ? ' active' : ''}`}
                  onClick={() => handleToggle('sound')}
                  aria-label="Toggle notification sound"
                >
                  <div className="settings-toggle-knob" />
                </div>
              </div>
              <div className="settings-toggle-row">
                <span className="settings-toggle-label">Notification Tone</span>
                <select className="settings-lang-select" value={notifications.tone} onChange={handleToneChange}>
                  <option value="default">Default</option>
                  <option value="chime">Chime</option>
                  <option value="pop">Pop</option>
                  <option value="ding">Ding</option>
                </select>
              </div>
            </div>
            {/* Language selection */}
            <div className="settings-section" id="language">
              <div className="settings-title">Language</div>
              <select
                className="settings-lang-select"
                value={language}
                onChange={handleLangChange}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
            {/* Save and Reset buttons */}
            <div className="settings-btn-row">
              <button className="settings-btn" onClick={handleSave}>Save</button>
              <button className="settings-btn reset" onClick={handleReset}>Reset</button>
            </div>
            {success && <div className="settings-success">{success}</div>}
          </div>
          {/* Right: Advanced options in a card-like box */}
          <div className="settings-advanced settings-container">
            {/* Privacy Section */}
            <div className="settings-section" id="privacy">
              <div className="settings-title">Privacy</div>
              <div className="settings-toggle-row">
                <span className="settings-toggle-label">Show Online Status</span>
                <div
                  className={`settings-toggle${notifications.onlineStatus ? ' active' : ''}`}
                  onClick={() => handleToggle('onlineStatus')}
                  aria-label="Toggle online status"
                >
                  <div className="settings-toggle-knob" />
                </div>
              </div>
              <div className="settings-toggle-row">
                <span className="settings-toggle-label">Last Seen</span>
                <select className="settings-lang-select" value={notifications.lastSeen} onChange={handleLastSeenChange}>
                  <option value="nobody">Nobody</option>
                  <option value="everyone">Everyone</option>
                  <option value="contacts">Friends</option>
                </select>
              </div>
              <div className="settings-toggle-row">
                <span className="settings-toggle-label">Private Account</span>
                <div
                  className={`settings-toggle${notifications.privateAccount ? ' active' : ''}`}
                  onClick={() => handleToggle('privateAccount')}
                  aria-label="Toggle private account"
                >
                  <div className="settings-toggle-knob" />
                </div>
              </div>
            </div>
            {/* Blocked Contacts Section */}
            <div className="settings-section" id="blocked">
              <div className="settings-title">Blocked Contacts</div>
              {blockedContacts.length === 0 ? (
                <div style={{ color: '#8e44ad', opacity: 0.7, fontSize: '1rem', margin: '0.5rem 0' }}>No blocked contacts</div>
              ) : (
                <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                  {blockedContacts.map((c) => (
                    <li key={c._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>{c.name}</span>
                      <button className="settings-btn reset" style={{ padding: '0.3rem 0.8rem', fontSize: '0.95rem' }} onClick={() => handleUnblock(c._id)}>Unblock</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* App Info Section */}
            <div className="settings-section" id="appinfo">
              <div className="settings-title">App Info</div>
              <div style={{ marginBottom: '0.7rem', color: '#8e44ad', fontWeight: 500 }}>Version: {appVersion}</div>
              <a href="/privacy-policy" className="settings-link" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              <span style={{ margin: '0 0.5rem' }}>|</span>
              <a href="/terms-of-service" className="settings-link" target="_blank" rel="noopener noreferrer">Terms of Service</a>
              <div style={{ marginTop: '1.2rem', color: '#8e44ad', fontWeight: 600, fontSize: '1.1rem', textAlign: 'center', opacity: 0.7 }}>
                Privex Private Limited
              </div>
            </div>
          </div>
        </>
      )}
      </motion.div>
      {/* Bottom Navbar for large screens only */}
      {!isMobile && <div className="settings-bottom-navbar"><BottomNavbar /></div>}
    {/* Profile image modal */}
    {showProfileModal && (
      <div className="profile-image-modal-bg" onClick={handleCloseProfileModal}>
        <img
          src={authUser?.profilePicture || '/avatar.png'}
          alt="Profile Full"
          className="profile-image-modal-img"
        />
      </div>
    )}
    </>

  );
}
