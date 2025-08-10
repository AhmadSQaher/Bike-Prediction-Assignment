// src/components/Profile.js
import React, { useState, useEffect } from 'react';

const Profile = ({ user, setUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    new_email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        new_email: ''
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user types
    if (error) setError('');
    if (message) setMessage('');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const updateData = {
        name: formData.name
      };

      // Add email if it's being changed
      if (formData.new_email && formData.new_email !== user.email) {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.new_email)) {
          setError('Please enter a valid email address');
          setLoading(false);
          return;
        }
        
        if (!formData.current_password) {
          setError('Current password is required to change email address');
          setLoading(false);
          return;
        }
        updateData.new_email = formData.new_email;
        updateData.current_password = formData.current_password;
      }

      // Only include password fields if user wants to change password
      if (showPasswordSection && formData.new_password) {
        if (formData.new_password !== formData.confirm_password) {
          setError('New passwords do not match');
          setLoading(false);
          return;
        }
        updateData.current_password = formData.current_password;
        updateData.new_password = formData.new_password;
      }

      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update user state with new information
      setUser(data.user);
      setMessage('Profile updated successfully!');
      
      // Clear password fields and email field
      setFormData(prev => ({
        ...prev,
        new_email: '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      setShowPasswordSection(false);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeOnly = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.current_password || !formData.new_password) {
      setError('Please fill in all password fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          current_password: formData.current_password,
          new_password: formData.new_password,
          confirm_password: formData.confirm_password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setMessage('Password changed successfully!');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      setShowPasswordSection(false);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container">
        <div className="auth-container">
          <h2>Access Denied</h2>
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="profile-container">
        <div className="profile-header">
          <h1>👤 User Profile</h1>
          <p>Manage your account information and security settings</p>
        </div>

        {message && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">❌</span>
            {error}
          </div>
        )}

        <div className="profile-content">
          {/* Left Side - Account Information Form */}
          <div className="profile-left-section">
            <div className="profile-section">
              <h2>📋 Account Information</h2>
              <form onSubmit={handleProfileUpdate} className="profile-form">
              <div className="form-group">
                <label htmlFor="email">Current Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={user.email}
                  disabled
                  className="form-input disabled"
                />
              </div>

              <div className="form-group">
                <label htmlFor="new_email">New Email Address (Optional)</label>
                <input
                  type="email"
                  id="new_email"
                  name="new_email"
                  value={formData.new_email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter new email address"
                />
                <small className="form-help">Leave empty to keep current email. Requires current password to change.</small>
              </div>

              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your full name"
                />
              </div>

              {formData.new_email && (
                <div className="form-group">
                  <label htmlFor="current_password_profile">Current Password</label>
                  <input
                    type="password"
                    id="current_password_profile"
                    name="current_password"
                    value={formData.current_password}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter current password to change email"
                    required
                  />
                  <small className="form-help">Required to change email address</small>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="role">Account Type</label>
                <input
                  type="text"
                  id="role"
                  value={user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User'}
                  disabled
                  className="form-input disabled"
                />
                <small className="form-help">Account type cannot be changed</small>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '⏳ Updating...' : '💾 Update Information'}
              </button>
            </form>
            </div>
          </div>

          {/* Right Side - Account Summary & Password Security */}
          <div className="profile-right-section">
            {/* Account Summary Section */}
            <div className="profile-section">
              <h2>📊 Account Summary</h2>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-icon">📧</span>
                  <div className="stat-info">
                    <span className="stat-label">Email</span>
                    <span className="stat-value">{user.email}</span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">👤</span>
                  <div className="stat-info">
                    <span className="stat-label">Name</span>
                    <span className="stat-value">{user.name || 'Not set'}</span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🆔</span>
                  <div className="stat-info">
                    <span className="stat-label">Account Type</span>
                    <span className="stat-value">{user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Management Section */}
            <div className="profile-section">
              <h2>🔒 Password & Security</h2>
              
              {!showPasswordSection ? (
                <div className="password-toggle">
                  <p>Keep your account secure by changing your password regularly.</p>
                  <button 
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowPasswordSection(true)}
                  >
                    🔑 Change Password
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordChangeOnly} className="profile-form">
                  <div className="form-group">
                    <label htmlFor="current_password">Current Password</label>
                    <input
                      type="password"
                      id="current_password"
                      name="current_password"
                      value={formData.current_password}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your current password"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="new_password">New Password</label>
                    <input
                      type="password"
                      id="new_password"
                      name="new_password"
                      value={formData.new_password}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your new password"
                      minLength="6"
                      required
                    />
                    <small className="form-help">Password must be at least 6 characters long</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirm_password">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirm_password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Confirm your new password"
                      minLength="6"
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? '⏳ Changing...' : '🔑 Change Password'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowPasswordSection(false);
                        setFormData(prev => ({
                          ...prev,
                          current_password: '',
                          new_password: '',
                          confirm_password: ''
                        }));
                      }}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div> {/* End of profile-right-section */}
        </div>
      </div>
    </div>
  );
};

export default Profile;
