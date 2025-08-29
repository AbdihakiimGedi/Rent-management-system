import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../api/adminApi';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    users: { total: 0, owners: 0, renters: 0 },
    categories: 0,
    rental_items: 0,
    bookings: { total: 0, pending: 0, completed: 0 },
    complaints: { total: 0, pending: 0 },
    revenue: 0,
    held_payments: 0
  });
  const [recentActivity, setRecentActivity] = useState({
    owner_requests: [],
    bookings: [],
    complaints: []
  });
  const [pendingOwnerRequests, setPendingOwnerRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('AdminDashboard: useEffect triggered');
    fetchDashboardData();

    // Listen for dashboard refresh events (e.g., after payment approval/rejection)
    const handleDashboardRefresh = () => {
      console.log('AdminDashboard: Dashboard refresh event received');
      fetchDashboardData();
    };

    window.addEventListener('dashboardRefresh', handleDashboardRefresh);

    // Cleanup
    return () => {
      window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('AdminDashboard: Fetching dashboard data...');
      setLoading(true);
      setError(null);

      // Fetch admin-only data
      const [statsResponse, activityResponse, requestsResponse] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getRecentActivity(),
        adminApi.getOwnerRequests()
      ]);

      console.log('AdminDashboard: API responses received:', {
        stats: statsResponse.data,
        activity: activityResponse.data,
        requests: requestsResponse.data
      });

      setStats(statsResponse.data);
      setRecentActivity(activityResponse.data);
      setPendingOwnerRequests(requestsResponse.data.pending_requests || []);
    } catch (error) {
      console.error('AdminDashboard: Error fetching dashboard data:', error);
      setError(error.message || 'Error fetching dashboard data');
      addNotification('Error fetching dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOwner = async (requestId) => {
    try {
      await adminApi.updateOwnerRequest(requestId, { status: 'Approved' });
      addNotification('Owner request approved successfully', 'success');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      addNotification('Error approving owner request', 'error');
    }
  };

  const handleRejectOwner = async (requestId, reason) => {
    try {
      await adminApi.updateOwnerRequest(requestId, {
        status: 'Rejected',
        rejection_reason: reason
      });
      addNotification('Owner request rejected successfully', 'success');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      addNotification('Error rejecting owner request', 'error');
    }
  };

  console.log('AdminDashboard: Rendering with state:', { loading, error, stats, user });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 dark:text-red-400 mb-4">Error: {error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            System overview and management
          </p>
        </div>

        {/* Pending Owner Requests Notification Banner */}
        {pendingOwnerRequests.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {pendingOwnerRequests.length} Pending Owner Request{pendingOwnerRequests.length > 1 ? 's' : ''}
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You have {pendingOwnerRequests.length} owner request{pendingOwnerRequests.length > 1 ? 's' : ''} waiting for review.</p>
                </div>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => navigate('/admin/owner-requests')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Review All Requests
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.users.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Owners</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.users.owners || 0}</p>
              </div>
            </div>
          </div>



          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">${stats.revenue || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Held Payments</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.held_payments || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.categories || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Complaints</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.complaints.total || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Owner Requests */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Owner Requests</h3>
          </div>
          <div className="p-6">
            {pendingOwnerRequests.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No pending owner requests</p>
            ) : (
              <div className="space-y-4">
                {pendingOwnerRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{request.username}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{request.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Submitted: {new Date(request.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveOwner(request.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 focus:ring-2 focus:ring-green-500"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason) handleRejectOwner(request.id, reason);
                          }}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:ring-2 focus:ring-red-500"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Held Payments Management */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Held Payments</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {stats.held_payments || 0} payments pending approval
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Manage payments that are currently held in the system
              </p>
              <button
                onClick={() => navigate('/admin/held-payments')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
              >
                View All Held Payments
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Owner Requests */}
              {recentActivity.owner_requests && recentActivity.owner_requests.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Owner Requests</h4>
                  {recentActivity.owner_requests.slice(0, 3).map((request, index) => (
                    <div key={index} className="flex items-center space-x-3 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {request.username} requested owner status
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {request.submitted_at ? new Date(request.submitted_at).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              )}



              {/* Recent Complaints */}
              {recentActivity.complaints && recentActivity.complaints.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Complaints</h4>
                  {recentActivity.complaints.slice(0, 3).map((complaint, index) => (
                    <div key={index} className="flex items-center space-x-3 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        New {complaint.complaint_type} complaint ({complaint.status})
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* No Activity Message */}
              {(!recentActivity.owner_requests || recentActivity.owner_requests.length === 0) &&
                (!recentActivity.complaints || recentActivity.complaints.length === 0) && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
                )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/admin/categories')}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Manage Categories</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/users')}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Manage Users</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/reports')}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">View Reports</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/owner-requirements')}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Owner Requirements</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/owner-requests')}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors relative"
            >
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Owner Requests</p>
                {pendingOwnerRequests.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                    {pendingOwnerRequests.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;