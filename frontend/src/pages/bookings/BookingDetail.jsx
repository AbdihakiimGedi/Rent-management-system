import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { bookingApi } from '../../api/bookingApi';
import { adminApi } from '../../api/adminApi';
import { ownerApi } from '../../api/ownerApi';
import Button from '../../components/ui/Button';

const BookingDetail = () => {
  const params = useParams();
  const bookingId = params.id || params.bookingId;
  const { t } = useLanguage();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Debug: Log the received parameters
  console.log('🔍 BookingDetail: useParams() result:', params);
  console.log('🔍 BookingDetail: resolved bookingId:', bookingId);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Refresh data when component is focused (user returns from other pages)
  useEffect(() => {
    const handleFocus = () => {
      fetchBooking();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchBooking = async () => {
    // Check if bookingId is valid
    if (!bookingId || bookingId === 'undefined') {
      console.error('🔍 BookingDetail: Invalid bookingId:', bookingId);
      addNotification('Invalid booking ID', 'error');
      navigate('/owner/dashboard');
      return;
    }

    try {
      setLoading(true);
      // Prefer data passed via navigation state
      if (location.state && location.state.bookingData) {
        setBooking(location.state.bookingData);
        return;
      }
      let response;

      if (user.role === 'admin') {
        response = await adminApi.getBooking(bookingId);
      } else if (user.role === 'owner') {
        response = await ownerApi.getBooking(bookingId);
      } else {
        response = await bookingApi.getBooking(bookingId);
      }

      // The backend returns {"booking": {...}} so we need to access response.data.booking
      console.log('🔍 BookingDetail: API Response:', response);
      console.log('🔍 BookingDetail: Response data:', response.data);
      console.log('🔍 BookingDetail: Response data.booking:', response.data.booking);

      if (response.data.booking) {
        setBooking(response.data.booking);
      } else if (response.data) {
        console.log('🔍 BookingDetail: Using fallback response.data');
        setBooking(response.data);
      } else {
        console.error('🔍 BookingDetail: No booking data found in response');
        addNotification('No booking data received from server', 'error');
        return;
      }
    } catch (error) {
      console.error('🔍 BookingDetail: Error fetching booking:', error);
      console.error('🔍 BookingDetail: Error response:', error.response);
      addNotification('Error fetching booking details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to change the status to "${newStatus}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      if (user.role === 'admin') {
        await adminApi.updateBookingStatus(bookingId, { status: newStatus });
      } else if (user.role === 'owner') {
        await ownerApi.updateBookingStatus(bookingId, { status: newStatus });
      }

      addNotification('Booking status updated successfully', 'success');
      fetchBooking(); // Refresh data
    } catch (error) {
      addNotification('Error updating booking status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentRelease = async () => {
    if (!window.confirm('Are you sure you want to release the payment to the owner?')) {
      return;
    }

    setActionLoading(true);
    try {
      await adminApi.releasePayment(bookingId);
      addNotification('Payment released successfully', 'success');
      fetchBooking(); // Refresh data
    } catch (error) {
      addNotification('Error releasing payment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliveryConfirmation = async () => {
    if (!window.confirm('Confirm that the item has been delivered to the renter?')) {
      return;
    }

    setActionLoading(true);
    try {
      if (user.role === 'owner') {
        await ownerApi.confirmDelivery(bookingId);
      } else if (user.role === 'user') {
        await bookingApi.confirmDelivery(bookingId);
      }

      addNotification('Delivery confirmed successfully', 'success');
      fetchBooking(); // Refresh data
    } catch (error) {
      addNotification('Error confirming delivery', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { bg: 'bg-yellow-100 text-yellow-800', dark: 'dark:bg-yellow-900/20 dark:text-yellow-400' },
      'Confirmed': { bg: 'bg-blue-100 text-blue-800', dark: 'dark:bg-blue-900/20 dark:text-blue-400' },
      'Active': { bg: 'bg-blue-100 text-blue-800', dark: 'dark:bg-blue-900/20 dark:text-blue-400' },
      'Completed': { bg: 'bg-green-100 text-green-800', dark: 'bg-green-900/20 dark:text-green-400' },
      'Rejected': { bg: 'bg-red-100 text-red-800', dark: 'dark:bg-red-900/20 dark:text-red-400' },
      'Requirements_Submitted': { bg: 'bg-purple-100 text-purple-800', dark: 'dark:bg-purple-900/20 dark:text-purple-400' },
      'Payment_Held': { bg: 'bg-orange-100 text-orange-800', dark: 'dark:bg-orange-900/20 dark:text-orange-400' }
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100 text-gray-800', dark: 'dark:bg-gray-900/20 dark:text-gray-400' };
    return `px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.dark}`;
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const paymentConfig = {
      'PENDING': { bg: 'bg-yellow-100 text-yellow-800', dark: 'dark:bg-yellow-900/20 dark:text-yellow-400' },
      'HELD': { bg: 'bg-orange-100 text-orange-800', dark: 'dark:bg-orange-900/20 dark:text-orange-400' },
      'COMPLETED': { bg: 'bg-green-100 text-green-800', dark: 'dark:bg-green-900/20 dark:text-green-400' },
      'FAILED': { bg: 'bg-red-100 text-red-800', dark: 'dark:bg-red-900/20 dark:text-red-400' },
      'REFUNDED': { bg: 'bg-gray-100 text-gray-800', dark: 'dark:bg-gray-900/20 dark:text-gray-400' }
    };

    const config = paymentConfig[paymentStatus] || { bg: 'bg-gray-100 text-gray-800', dark: 'dark:bg-gray-900/20 dark:text-gray-400' };
    return `px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.dark}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Booking not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Booking #{bookingId}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {booking.rental_item_name || 'Rental Item'}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => navigate('/bookings')}
              variant="secondary"
            >
              Back to List
            </Button>
            {user.role === 'user' && booking.status === 'Pending' && (
              <Button
                onClick={() => navigate(`/bookings/${bookingId}/edit`)}
                variant="primary"
              >
                Edit Booking
              </Button>
            )}
          </div>
        </div>
      </div>



      {/* Status and Actions */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Current Status
            </h2>
            <div className="flex items-center space-x-4">
              <span className={getStatusBadge(booking.status)}>
                {booking.status}
              </span>
              <span className={getPaymentStatusBadge(booking.payment_status)}>
                {booking.payment_status}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={fetchBooking}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </Button>
            {user.role === 'admin' && (
              <>
                <Button
                  onClick={() => handleStatusUpdate('confirmed')}
                  disabled={actionLoading || booking.status === 'confirmed'}
                  variant="primary"
                  size="sm"
                >
                  Confirm
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={actionLoading || booking.status === 'cancelled'}
                  variant="danger"
                  size="sm"
                >
                  Cancel
                </Button>
                {booking.payment_status === 'paid' && (
                  <Button
                    onClick={handlePaymentRelease}
                    disabled={actionLoading}
                    variant="primary"
                    size="sm"
                  >
                    Release Payment
                  </Button>
                )}
              </>
            )}

            {user.role === 'owner' && booking.status === 'confirmed' && (
              <Button
                onClick={handleDeliveryConfirmation}
                disabled={actionLoading}
                variant="primary"
                size="sm"
              >
                Confirm Delivery
              </Button>
            )}

            {user.role === 'user' && (
              <>
                {/* Show Confirm Delivery button when owner has accepted */}
                {(booking.owner_confirmation_status === 'ACCEPTED' || booking.status === 'Owner_Accepted') && (
                  <Button
                    onClick={() => navigate(`/delivery-confirmation/${booking.booking_id}`)}
                    variant="primary"
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    🔐 Confirm Delivery
                  </Button>
                )}

                {/* Show status when waiting for owner */}
                {(!booking.owner_confirmation_status || booking.owner_confirmation_status === 'PENDING') &&
                  (!booking.status || !booking.status.includes('Owner_Accepted')) && (
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <p className="text-blue-800 dark:text-blue-200 font-medium">
                        ⏳ Waiting for Owner to Accept Your Booking
                      </p>
                      <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                        You'll be able to confirm delivery once the owner accepts
                      </p>
                    </div>
                  )}

                {/* Show when owner rejected */}
                {(booking.owner_confirmation_status === 'REJECTED' || booking.status === 'Owner_Rejected') && (
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                    <p className="text-red-800 dark:text-red-200 font-medium">
                      ❌ Owner Rejected Your Booking
                    </p>
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                      Payment will be refunded minus service fee
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Booking Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rental Item
              </label>
              <p className="text-gray-900 dark:text-white">
                {booking.rental_item_name || 'Unknown Item'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <p className="text-gray-900 dark:text-white">
                {booking.category_name || 'Unknown Category'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <p className="text-gray-900 dark:text-white">
                {new Date(booking.start_date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <p className="text-gray-900 dark:text-white">
                {new Date(booking.end_date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration
              </label>
              <p className="text-gray-900 dark:text-white">
                {Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24))} days
              </p>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Information
          </h3>

          <div className="space-y-4">
            {user.role === 'admin' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Renter
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {user.username || 'Unknown'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Owner
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {booking.owner_username || 'Unknown'}
                  </p>
                </div>
              </>
            )}

            {user.role === 'owner' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Renter
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Renter ID: {booking.renter_id}
                </p>
              </div>
            )}

            {user.role === 'user' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Owner
                </label>
                <p className="text-gray-900 dark:text-white">
                  {booking.owner_username || 'Unknown'}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Created At
              </label>
              <p className="text-gray-900 dark:text-white">
                {new Date(booking.created_at).toLocaleString()}
              </p>
            </div>

            {booking.updated_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Updated
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(booking.updated_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Payment Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Amount
            </label>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${(booking.payment_amount || 0).toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Service Fee
            </label>
            <p className="text-gray-900 dark:text-white">
              ${(booking.service_fee || 0).toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Amount
            </label>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${(booking.total_amount || 0).toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Status
            </label>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${booking.payment_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
              booking.payment_status === 'HELD' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                booking.payment_status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  booking.payment_status === 'FAILED' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}>
              {booking.payment_status || 'Unknown'}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Method
            </label>
            <p className="text-gray-900 dark:text-white">
              {booking.payment_method || 'Not specified'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Account
            </label>
            <p className="text-gray-900 dark:text-white">
              {booking.payment_account || 'Not specified'}
            </p>
          </div>
        </div>

        {/* Payment Timeline */}
        {booking.payment_held_at && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="text-blue-800 dark:text-blue-200 font-medium">
                Payment Held: {new Date(booking.payment_held_at).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {booking.payment_released_at && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-800 dark:text-green-200 font-medium">
                Payment Released: {new Date(booking.payment_released_at).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Booking Status & Confirmation */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Booking Status & Confirmation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Booking Status
            </label>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
              booking.status === 'Confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                booking.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  booking.status === 'Active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                    booking.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}>
              {booking.status || 'Unknown'}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Owner Confirmation Status
            </label>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${booking.owner_confirmation_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
              booking.owner_confirmation_status === 'ACCEPTED' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                booking.owner_confirmation_status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}>
              {booking.owner_confirmation_status || 'Not Set'}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contract Accepted
            </label>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${booking.contract_accepted ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
              {booking.contract_accepted ? 'Yes' : 'No'}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Admin Approved
            </label>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${booking.admin_approved ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}>
              {booking.admin_approved ? 'Yes' : 'Not Required'}
            </span>
          </div>
        </div>

        {/* Confirmation Code Section - Only for users when owner accepted */}
        {user.role === 'user' && (booking.owner_confirmation_status === 'ACCEPTED' || booking.status === 'Owner_Accepted') && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
              🔐 Delivery Confirmation
            </h3>

            <div className="text-center">
              <p className="text-green-800 dark:text-green-200 mb-4">
                Owner has accepted your booking! You can now confirm delivery using the confirmation code.
              </p>

              {booking.confirmation_code && (
                <div className="bg-white dark:bg-gray-800 border-2 border-green-300 dark:border-green-600 rounded-lg p-4 inline-block mb-4">
                  <p className="text-green-800 dark:text-green-200 text-sm font-medium mb-1">Confirmation Code:</p>
                  <p className="text-3xl font-mono font-bold text-green-800 dark:text-green-200">
                    {booking.confirmation_code}
                  </p>
                </div>
              )}

              <Button
                onClick={() => navigate(`/delivery-confirmation/${booking.booking_id}`)}
                variant="primary"
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                🔐 Go to Confirmation Page
              </Button>
            </div>
          </div>
        )}

        {/* Confirmation Code Expiry */}
        {booking.confirmation_code && booking.code_expiry && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800 dark:text-blue-200 font-medium">
                Confirmation Code Expires: {new Date(booking.code_expiry).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Rental Item Details */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Rental Item Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Item Name
            </label>
            <p className="text-gray-900 dark:text-white font-medium">
              {booking.rental_item_name || 'Unknown Item'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <p className="text-gray-900 dark:text-white">
              {booking.category_name || 'Unknown Category'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rental Period
            </label>
            <p className="text-gray-900 dark:text-white">
              {booking.rental_period || 'Not specified'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rental Days
            </label>
            <p className="text-gray-900 dark:text-white">
              {booking.rental_days || 0} days
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Item Rental Price
            </label>
            <p className="text-gray-900 dark:text-white">
              ${(booking.item_rental_price || 0).toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <p className="text-gray-900 dark:text-white">
              {booking.start_date ? new Date(booking.start_date).toLocaleDateString() : 'Not specified'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <p className="text-gray-900 dark:text-white">
              {booking.end_date ? new Date(booking.end_date).toLocaleDateString() : 'Not specified'}
            </p>
          </div>
        </div>
      </div>



      {/* Contract Information */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Contract & Legal
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contract Accepted
            </label>
            <p className="text-gray-900 dark:text-white">
              {booking.contract_accepted ? 'Yes' : 'No'}
            </p>
          </div>

          {booking.contract_accepted_at && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contract Accepted At
              </label>
              <p className="text-gray-900 dark:text-white">
                {new Date(booking.contract_accepted_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={() => navigate('/bookings')}
          variant="secondary"
        >
          Back to List
        </Button>

        <div className="flex space-x-3">
          {user.role === 'user' && booking.status === 'pending' && (
            <Button
              onClick={() => navigate(`/bookings/${id}/edit`)}
              variant="primary"
            >
              Edit Booking
            </Button>
          )}

          {user.role === 'admin' && (
            <Button
              onClick={() => navigate(`/admin/bookings/${id}/edit`)}
              variant="primary"
            >
              Admin Edit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;