import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { bookingApi } from '../../api/bookingApi';
import { ownerApi } from '../../api/ownerApi';


const UserDashboard = () => {
  const { t } = useLanguage();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
    activeBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    heldPayments: 0,
    completedPayments: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [existingOwnerRequest, setExistingOwnerRequest] = useState(null);

  useEffect(() => {
    fetchDashboardData();

    // Listen for refresh events from other components
    const handleRefresh = () => {
      console.log('🔄 UserDashboard: Refresh event received');
      fetchDashboardData();
    };

    // Listen for owner request updates
    const handleOwnerRequestUpdate = () => {
      console.log('🔄 UserDashboard: Owner request update received');
      fetchDashboardData();
    };

    window.addEventListener('refreshUserDashboard', handleRefresh);
    window.addEventListener('ownerRequestUpdated', handleOwnerRequestUpdate);

    return () => {
      window.removeEventListener('refreshUserDashboard', handleRefresh);
      window.removeEventListener('ownerRequestUpdated', handleOwnerRequestUpdate);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch renter-only data
      const [bookingsResponse, ownerRequestResponse] = await Promise.all([
        bookingApi.getMyBookings(),
        ownerApi.getOwnerRequest().catch(() => ({ request: null })) // Ignore errors if no request exists
      ]);

      const bookings = bookingsResponse.data.bookings || [];
      setExistingOwnerRequest(ownerRequestResponse.request);

      // Calculate stats based on actual backend data
      const totalSpent = bookings.reduce((sum, booking) => {
        // Extract pricing from rental item data
        if (booking.rental_item_data) {
          const itemData = booking.rental_item_data;

          // Look for common price fields
          const priceFields = ['Price', 'price', 'Daily Rate', 'daily_rate', 'Hourly Rate', 'hourly_rate', 'Cost', 'cost'];
          for (const field of priceFields) {
            if (itemData[field] && !isNaN(parseFloat(itemData[field]))) {
              return sum + parseFloat(itemData[field]);
            }
          }
        }
        return sum;
      }, 0);

      const activeBookings = bookings.filter(booking =>
        booking.status === 'Pending' ||
        booking.status === 'Active' ||
        booking.status === 'Confirmed'
      ).length;
      const completedBookings = bookings.filter(booking =>
        booking.status === 'Completed' ||
        booking.status === 'Finished'
      ).length;
      const cancelledBookings = bookings.filter(booking =>
        booking.status === 'Cancelled' ||
        booking.status === 'Rejected'
      ).length;

      // Calculate payment status stats
      const heldPayments = bookings.filter(booking =>
        booking.payment_status === 'HELD'
      ).length;
      const completedPayments = bookings.filter(booking =>
        booking.payment_status === 'Completed'
      ).length;

      setStats({
        totalBookings: bookings.length,
        totalSpent: totalSpent,
        activeBookings: activeBookings,
        completedBookings: completedBookings,
        cancelledBookings: cancelledBookings,
        heldPayments: heldPayments,
        completedPayments: completedPayments
      });

      setRecentBookings(bookings.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addNotification('Error fetching dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          User Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Track your rentals and manage bookings
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ${stats.totalSpent.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Total from all bookings
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Bookings</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activeBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.completedBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cancelled</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.cancelledBookings}</p>
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
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.heldPayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Payments</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.completedPayments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Renting Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6 mb-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
            🏠 Want to Rent More Items?
          </h3>
          <p className="text-green-700 dark:text-green-300 mb-4">
            You can rent multiple items simultaneously! Each booking requires separate payment and confirmation.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/browse')}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center"
            >
              🏠 Browse More Items
            </button>
            <button
              onClick={() => navigate('/bookings')}
              className="px-6 py-3 border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 font-medium rounded-lg transition-colors"
            >
              📋 View My Bookings ({recentBookings.length})
            </button>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Bookings</h3>
            <div className="flex space-x-2">
              <button
                onClick={fetchDashboardData}
                className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500"
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => navigate('/bookings')}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
              >
                View All
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No bookings yet</p>
              <button
                onClick={() => navigate('/browse')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
              >
                Make Your First Booking
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.booking_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Booking #{booking.booking_id}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Item: {booking.rental_item_name || `Item #${booking.rental_item_id}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Category: {booking.category_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Status: <span className={`px-2 py-1 rounded-full text-xs ${booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                                booking.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                          }`}>{booking.status}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Payment: <span className={`px-2 py-1 rounded-full text-xs ${booking.payment_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          booking.payment_status === 'HELD' ? 'bg-orange-100 text-orange-800' :
                            booking.payment_status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              booking.payment_status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                          }`}>{booking.payment_status}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Created: {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                      {/* Contract Terms Indicator */}
                      {(() => {
                        if (!booking.requirements_data) return null;

                        const hasContractTerms = Object.keys(booking.requirements_data).some(key =>
                          key.toLowerCase().includes('contract') ||
                          (typeof booking.requirements_data[key] === 'string' &&
                            (booking.requirements_data[key] === 'I agree to the terms and conditions' ||
                              booking.requirements_data[key] === 'Accept'))
                        );

                        if (!hasContractTerms) return null;

                        // Find the contract terms content
                        const contractField = Object.entries(booking.requirements_data).find(([key, value]) =>
                          key.toLowerCase().includes('contract') &&
                          typeof value === 'string' &&
                          value !== 'I agree to the terms and conditions' &&
                          value !== 'Accept'
                        );

                        return (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                            <div className="flex items-center mb-2">
                              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">✓ Contract Terms Agreed</span>
                            </div>
                            {contractField && (
                              <div className="text-xs text-blue-800 dark:text-blue-200">
                                <div className="font-medium mb-1">Agreed Terms:</div>
                                <div className="whitespace-pre-wrap max-h-20 overflow-y-auto text-xs">
                                  {contractField[1]}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-400">
                        ${booking.total_amount ? booking.total_amount.toLocaleString() : '0'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Payment: ${booking.payment_amount ? booking.payment_amount.toLocaleString() : '0'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Service Fee: ${booking.service_fee ? booking.service_fee.toLocaleString() : '0'}
                      </p>
                      <div className="space-y-2">
                        <button
                          onClick={() => navigate(`/bookings/${booking.booking_id}`)}
                          className="w-full px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
                        >
                          View Details
                        </button>

                        {/* Show Confirm Delivery button when owner accepted */}
                        {(booking.owner_confirmation_status === 'ACCEPTED' || booking.status === 'Owner_Accepted') && (
                          <button
                            onClick={() => navigate(`/delivery-confirmation/${booking.booking_id}`)}
                            className="w-full px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 focus:ring-2 focus:ring-green-500"
                          >
                            🔐 Confirm Delivery
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/browse')}
            className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">New Booking</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/bookings')}
            className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">View Bookings</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/complaints/new')}
            className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Submit Complaint</p>
            </div>
          </button>
        </div>
      </div>

      {/* Owner Request Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Become an Owner</h3>

        {existingOwnerRequest ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${existingOwnerRequest.status === 'Pending' ? 'bg-yellow-50 border-yellow-200' :
                existingOwnerRequest.status === 'Approved' ? 'bg-green-50 border-green-200' :
                  existingOwnerRequest.status === 'Rejected' ? 'bg-red-50 border-red-200' :
                    'bg-gray-50 border-gray-200'
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium ${existingOwnerRequest.status === 'Pending' ? 'text-yellow-800' :
                      existingOwnerRequest.status === 'Approved' ? 'text-green-800' :
                        existingOwnerRequest.status === 'Rejected' ? 'text-red-800' :
                          'text-gray-800'
                    }`}>
                    Status: {existingOwnerRequest.status}
                  </h4>
                  <p className={`text-sm ${existingOwnerRequest.status === 'Pending' ? 'text-yellow-700' :
                      existingOwnerRequest.status === 'Approved' ? 'text-green-700' :
                        existingOwnerRequest.status === 'Rejected' ? 'text-red-700' :
                          'text-gray-700'
                    }`}>
                    Submitted: {new Date(existingOwnerRequest.submitted_at).toLocaleDateString()}
                  </p>
                  {existingOwnerRequest.approved_at && (
                    <p className={`text-sm ${existingOwnerRequest.status === 'Approved' ? 'text-green-700' : 'text-gray-700'
                      }`}>
                      Processed: {new Date(existingOwnerRequest.approved_at).toLocaleDateString()}
                    </p>
                  )}
                  {existingOwnerRequest.rejection_reason && (
                    <p className={`text-sm text-red-700`}>
                      Reason: {existingOwnerRequest.rejection_reason}
                    </p>
                  )}
                </div>
                <div className={`text-2xl ${existingOwnerRequest.status === 'Pending' ? 'text-yellow-500' :
                    existingOwnerRequest.status === 'Approved' ? 'text-green-500' :
                      existingOwnerRequest.status === 'Rejected' ? 'text-red-500' :
                        'text-gray-500'
                  }`}>
                  {existingOwnerRequest.status === 'Pending' ? '⏳' :
                    existingOwnerRequest.status === 'Approved' ? '✅' :
                      existingOwnerRequest.status === 'Rejected' ? '❌' : '❓'}
                </div>
              </div>
            </div>

            {existingOwnerRequest.status === 'Rejected' && (
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your previous request was not approved. You can submit a new request if you wish.
                </p>
                <button
                  onClick={() => navigate('/owner/request')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors"
                >
                  Submit New Request
                </button>
              </div>
            )}

            {existingOwnerRequest.status === 'Approved' && (
              <div className="text-center">
                <p className="text-green-700 mb-4">
                  🎉 Congratulations! Your owner request has been approved. You can now create and manage rental items.
                </p>
                <button
                  onClick={() => navigate('/owner/rental-items')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Manage Rental Items
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Want to rent out your own items? Submit an owner request to start earning from your properties.
            </p>
            <button
              onClick={() => navigate('/owner/request')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors"
            >
              Submit Owner Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;