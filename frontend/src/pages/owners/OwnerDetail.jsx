import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { adminApi } from '../../api/adminApi';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const OwnerDetail = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOwnerDetails = async () => {
      try {
        const response = await adminApi.getUser(id);

        // Extract the actual data from Axios response
        const responseData = response.data || response;

        if (responseData && responseData.user) {
          setOwner(responseData.user);
        } else {
          setError(new Error('No user data received'));
        }
      } catch (err) {
        setError(err);
        addNotification('Error loading owner details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerDetails();
  }, [id, addNotification]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <LoadingSpinner />
            <p className="text-gray-600 mt-4">Loading owner details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Owner</h2>
            <p className="text-gray-600 mb-6">There was an error loading the owner details.</p>
            <Button
              onClick={() => navigate('/admin/owners')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Back to Owners
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Owner Not Found</h2>
            <p className="text-gray-600 mb-6">The requested owner could not be found.</p>
            <Button
              onClick={() => navigate('/admin/owners')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Back to Owners
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (isActive, isRestricted) => {
    if (isRestricted) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
          Restricted
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${isActive
        ? 'bg-green-100 text-green-800 border-green-200'
        : 'bg-gray-100 text-gray-800 border-gray-200'
        }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      'owner': 'bg-blue-100 text-blue-800 border-blue-200',
      'admin': 'bg-purple-100 text-purple-800 border-purple-200',
      'user': 'bg-green-100 text-green-800 border-green-200'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${roleColors[role] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {owner.full_name?.charAt(0) || owner.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {owner.full_name || owner.username}
                </h1>
                <p className="text-gray-600">Owner Account Details</p>
                <div className="flex items-center space-x-3 mt-2">
                  {getStatusBadge(owner.is_active, owner.is_restricted)}
                  {getRoleBadge(owner.role)}
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <Button
                onClick={() => navigate(`/admin/owners/${id}/edit`)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Edit Owner
              </Button>
              <Button
                onClick={() => navigate('/admin/owners')}
                className="bg-gray-500 hover:bg-gray-600 text-white"
              >
                Back to Owners
              </Button>
            </div>
          </div>

          {/* Owner Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Full Name
                  </label>
                  <p className="text-gray-900 font-medium">
                    {owner.full_name || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Username
                  </label>
                  <p className="text-gray-900 font-medium">
                    @{owner.username}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Email Address
                  </label>
                  <p className="text-gray-900 font-medium">
                    {owner.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Account Role
                  </label>
                  <div className="mt-1">
                    {getRoleBadge(owner.role)}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Contact Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Phone Number
                  </label>
                  <p className="text-gray-900 font-medium">
                    {owner.phone_number || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Address
                  </label>
                  <p className="text-gray-900 font-medium">
                    {owner.address || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Birthdate
                  </label>
                  <p className="text-gray-900 font-medium">
                    {owner.birthdate ? new Date(owner.birthdate).toLocaleDateString() : 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Account Status
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Account Status
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(owner.is_active, owner.is_restricted)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Member Since
                  </label>
                  <p className="text-gray-900 font-medium">
                    {owner.created_at ? new Date(owner.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Account ID
                  </label>
                  <p className="text-gray-900 font-medium font-mono">
                    #{owner.id}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate(`/admin/owners/${id}/edit`)}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Edit Owner Details
                </Button>
                <Button
                  onClick={() => navigate('/admin/owners')}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Back to Owners List
                </Button>
                <Button
                  onClick={() => navigate('/admin/users')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View All Users
                </Button>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Last Updated
                </label>
                <p className="text-gray-900">
                  {owner.updated_at ? new Date(owner.updated_at).toLocaleString() : 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Account Type
                </label>
                <p className="text-gray-900">
                  {owner.role === 'owner' ? 'Property Owner' : 'System User'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDetail;