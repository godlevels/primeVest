import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Save, X } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    dateOfBirth: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        country: user.profile?.country || '',
        dateOfBirth: user.profile?.dateOfBirth
          ? new Date(user.profile.dateOfBirth).toISOString().split('T')[0]
          : ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token'); 
      if (!token) {
        toast.error('You are not logged in. Please login again.');
        setLoading(false);
        return;
      }

      const response = await axios.put(
        '/api/users/profile',
        {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          country: profile.country,
          dateOfBirth: profile.dateOfBirth
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      updateUser(response.data.user);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update failed:', error.response || error.message);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user?.isEmailVerified
                    ? 'bg-success-100 text-success-800'
                    : 'bg-warning-100 text-warning-800'
                }`}
              >
                {user?.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
              </span>
              <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                {user?.role === 'admin' ? 'Administrator' : 'Member'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">
                <User className="h-4 w-4 mr-2" />
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                disabled={!isEditing}
                className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                required
              />
            </div>

            <div>
              <label className="label">
                <User className="h-4 w-4 mr-2" />
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                disabled={!isEditing}
                className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                required
              />
            </div>

            <div>
              <label className="label">
                <Mail className="h-4 w-4 mr-2" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={profile.email}
                disabled
                className="input-field bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div>
              <label className="label">
                <Phone className="h-4 w-4 mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="label">
                <MapPin className="h-4 w-4 mr-2" />
                Country
              </label>
              <input
                type="text"
                name="country"
                value={profile.country}
                onChange={handleChange}
                disabled={!isEditing}
                className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                placeholder="Enter country"
              />
            </div>

            <div>
              <label className="label">
                <Calendar className="h-4 w-4 mr-2" />
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={profile.dateOfBirth}
                onChange={handleChange}
                disabled={!isEditing}
                className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  // Reset form to original values
                  setProfile({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    phone: user.profile?.phone || '',
                    country: user.profile?.country || '',
                    dateOfBirth: user.profile?.dateOfBirth
                      ? new Date(user.profile.dateOfBirth).toISOString().split('T')[0]
                      : ''
                  });
                }}
                className="btn-secondary"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Account Information */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Member Since</p>
            <p className="font-medium text-gray-900">
              {new Date(user?.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Last Login</p>
            <p className="font-medium text-gray-900">
              {user?.lastLogin
                ? new Date(user.lastLogin).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'Never'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Referral Code</p>
            <p className="font-medium text-primary-600 text-lg">
              {user?.referralCode}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Account Status</p>
            <span
              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                user?.isActive
                  ? 'bg-success-100 text-success-800'
                  : 'bg-danger-100 text-danger-800'
              }`}
            >
              {user?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
