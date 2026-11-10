import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = 'http://localhost:5109';

interface UserProfile {
  id: number;
  userName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  defaultAddress: string;
  avatarUrl: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile>({
    id: 0,
    userName: localStorage.getItem('userName') || 'User',
    fullName: localStorage.getItem('userName') || '',
    email: '',
    phoneNumber: '',
    role: localStorage.getItem('role') || 'User',
    defaultAddress: localStorage.getItem('defaultDeliveryAddress') || '',
    avatarUrl: ''
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Alerts
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch live profile from backend API
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/api/Account/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch profile.');
        }
        return res.json();
      })
      .then((data: UserProfile) => {
        setProfile({
          id: data.id || 0,
          userName: data.userName || '',
          fullName: data.fullName || data.userName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          role: data.role || 'User',
          defaultAddress: data.defaultAddress || '',
          avatarUrl: data.avatarUrl || ''
        });
        if (data.defaultAddress) {
          localStorage.setItem('defaultDeliveryAddress', data.defaultAddress);
        }
      })
      .catch((err) => {
        console.warn('Could not load profile from backend, using cached credentials:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Save profile changes (Full Name, Email, Phone, Default Address)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setStatusMessage({ type: 'error', text: 'You must be signed in to save profile changes.' });
      return;
    }

    setSavingProfile(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/Account/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          email: profile.email,
          phoneNumber: profile.phoneNumber,
          defaultAddress: profile.defaultAddress,
          avatarUrl: profile.avatarUrl
        })
      });

      const data = await res.json();

      if (!res.ok) {
        const errorText = data.errors ? Object.values(data.errors).flat().join(', ') : (data.message || 'Update failed');
        throw new Error(errorText);
      }

      // Sync local storage so Angular layout reflects changes immediately
      if (profile.fullName) {
        localStorage.setItem('userName', profile.fullName);
      }
      if (profile.defaultAddress) {
        localStorage.setItem('defaultDeliveryAddress', profile.defaultAddress);
      }
      window.dispatchEvent(new Event('profileUpdated'));

      setStatusMessage({ type: 'success', text: 'Profile saved successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error updating profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password
  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      setStatusMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setStatusMessage({ type: 'error', text: 'You must be signed in to change password.' });
      return;
    }

    setUpdatingPassword(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/Account/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        const errorText = data.errors ? Object.values(data.errors).flat().join(', ') : (data.message || 'Password update failed.');
        throw new Error(errorText);
      }

      setStatusMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error changing password.' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Clear password inputs
  const handleClearPassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setStatusMessage(null);
  };

  // Handle avatar image selection and upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setStatusMessage({ type: 'error', text: 'You must be signed in to upload an avatar.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingAvatar(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/Account/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Avatar upload failed.');
      }

      setProfile(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
      setStatusMessage({ type: 'success', text: 'Avatar uploaded successfully!' });
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to upload avatar.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getInitial = () => {
    const name = profile.fullName || profile.userName || 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="tp-profile-page">
      <div className="tp-profile-card">
        {/* TOP PROFILE HEADER */}
        <div className="tp-profile-header">
          <div
            className="tp-avatar-wrapper"
            title="Click to change profile picture"
            onClick={() => fileInputRef.current?.click()}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${API_BASE_URL}${profile.avatarUrl}`}
                alt="Profile Avatar"
                className="tp-avatar-img"
              />
            ) : (
              <div className="tp-avatar-placeholder">
                {uploadingAvatar ? <span className="tp-spinner-sm" /> : getInitial()}
              </div>
            )}
            <div className="tp-avatar-change-overlay">
              <span>📷</span>
              <span>{uploadingAvatar ? '...' : 'Change'}</span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileChange}
              accept="image/png, image/jpeg, image/webp"
              style={{ display: 'none' }}
            />
          </div>

          <div className="tp-header-info">
            <h1 className="tp-user-display-name">
              {profile.fullName || profile.userName || 'User'}
            </h1>
            <p className="tp-user-email-preview">
              <span>✉️</span>
              <span>{profile.email || 'No email set'}</span>
            </p>
            <div className="tp-role-badge">
              <span>👤</span>
              <span>{profile.role || 'user'}</span>
            </div>
          </div>
        </div>

        {/* FEEDBACK STATUS ALERT */}
        {statusMessage && (
          <div className={`tp-alert ${statusMessage.type === 'success' ? 'tp-alert-success' : 'tp-alert-error'}`}>
            <span>{statusMessage.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile}>
          {/* PERSONAL INFORMATION SECTION */}
          <div className="tp-section-title">
            <span className="tp-title-icon">👤</span>
            <span>Personal Information</span>
          </div>

          <div className="tp-form-grid-2">
            <div className="tp-form-group no-mb">
              <label className="tp-form-label">
                <span>👤</span>
                <span>Full Name</span>
              </label>
              <input
                type="text"
                className="tp-input"
                placeholder="ovi"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              />
            </div>

            <div className="tp-form-group no-mb">
              <label className="tp-form-label">
                <span>✉️</span>
                <span>Email Address</span>
              </label>
              <input
                type="email"
                className="tp-input"
                placeholder="your@email.com"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
          </div>

          <div className="tp-form-group">
            <label className="tp-form-label">
              <span>📞</span>
              <span>Phone Number</span>
            </label>
            <input
              type="tel"
              className="tp-input"
              placeholder="+880 1XXX-XXXXXX"
              value={profile.phoneNumber}
              onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
            />
          </div>

          {/* CHECKOUT DEFAULTS SECTION */}
          <div className="tp-section-title">
            <span className="tp-title-icon">🚚</span>
            <span>Checkout Defaults</span>
          </div>

          <div className="tp-form-group">
            <label className="tp-form-label">
              <span>📍</span>
              <span>Default Delivery Address</span>
            </label>
            <textarea
              className="tp-textarea"
              placeholder="Your default delivery address"
              rows={3}
              value={profile.defaultAddress}
              onChange={(e) => setProfile({ ...profile, defaultAddress: e.target.value })}
            />
            <div className="tp-input-help">
              <span>ℹ️</span>
              <span>This address will be pre-filled during checkout.</span>
            </div>
          </div>

          {/* CHANGE PASSWORD SECTION */}
          <div className="tp-section-title">
            <span className="tp-title-icon">🔑</span>
            <span>Change Password</span>
          </div>

          <div className="tp-password-box">
            <div className="tp-form-group">
              <label className="tp-form-label">
                <span>🔒</span>
                <span>Current Password</span>
              </label>
              <input
                type="password"
                className="tp-input"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="tp-form-grid-2">
              <div className="tp-form-group no-mb">
                <label className="tp-form-label">
                  <span>🔑</span>
                  <span>New Password</span>
                </label>
                <input
                  type="password"
                  className="tp-input"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="tp-form-group no-mb">
                <label className="tp-form-label">
                  <span>✔️</span>
                  <span>Confirm New Password</span>
                </label>
                <input
                  type="password"
                  className="tp-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="tp-password-actions">
              <button
                type="button"
                className="tp-btn-update-pwd"
                onClick={handleUpdatePassword}
                disabled={updatingPassword}
              >
                <span>💾</span>
                <span>{updatingPassword ? 'Updating...' : 'Update Password'}</span>
              </button>

              <button
                type="button"
                className="tp-btn-clear"
                onClick={handleClearPassword}
              >
                <span>✖</span>
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* BOTTOM SAVE PROFILE BUTTON */}
          <button
            type="submit"
            className="tp-btn-save-profile"
            disabled={savingProfile}
          >
            {savingProfile ? (
              <>
                <span className="tp-spinner-sm" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Save Profile</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

