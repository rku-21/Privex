import React, { useState } from 'react';
import './styles/settings.css';

const ProfileSettings = () => {
  const [socialLinks, setSocialLinks] = useState(['']);

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, '']);
  };

  const updateLink = (index, value) => {
    const updated = [...socialLinks];
    updated[index] = value;
    setSocialLinks(updated);
  };

  return (
    <div className="settings-container">
      <div className="avatar-section">
        <img
          src="https://randomuser.me/api/portraits/men/32.jpg"
          alt="avatar"
          className="avatar"
        />
        <div className="avatar-buttons">
          <button className="upload-btn">Upload New</button>
          <button className="delete-btn">Delete avatar</button>
        </div>
      </div>

      <form className="settings-form">
        <div className="form-group">
          <label>User ID</label>
          <input type="text" value="USR-2025-01" readOnly />
        </div>

        <div className="form-group">
          <label>Full Name</label>
          <input type="text" placeholder="Enter full name" />
        </div>

        <div className="form-group">
          <label>Email</label>
          <div className="with-button">
            <input type="email" placeholder="example@gmail.com" />
            <button type="button">Change</button>
          </div>
        </div>

        <div className="form-group">
          <label>Mobile Number</label>
          <div className="with-button">
            <input type="text" placeholder="+91 9876543210" />
            <button type="button">Change</button>
          </div>
        </div>

        <div className="form-group full-width">
          <label>About</label>
          <textarea rows="4" placeholder="Write about yourself..." />
        </div>

        <div className="form-group full-width">
          <label>Social Media Links</label>
          {socialLinks.map((link, index) => (
            <input
              key={index}
              type="url"
              placeholder="https://social-link.com"
              value={link}
              onChange={(e) => updateLink(index, e.target.value)}
            />
          ))}
          <button
            type="button"
            className="add-link-btn"
            onClick={addSocialLink}
          >
            + Add Another Link
          </button>
        </div>

        <div className="form-group">
          <label>Country</label>
          <select>
            <option>Nigeria</option>
            <option>India</option>
            <option>USA</option>
            <option>UK</option>
          </select>
        </div>

        <div className="form-group full-width">
          <label>Residential Address</label>
          <textarea rows="2" placeholder="Street, City, State" />
        </div>

        <div className="form-group full-width">
          <button type="submit" className="save-btn">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
