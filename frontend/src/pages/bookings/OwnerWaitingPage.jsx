import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { bookingApi } from '../../api/bookingApi';
import Button from '../../components/ui/Button';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const OwnerWaitingPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { addNotification } = useNotification();
    const { user } = useAuth();

    // Simple state management
    const [bookingData, setBookingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lastCheckTime, setLastCheckTime] = useState(null);

    // Initialize data from navigation
    useEffect(() => {
        if (location.state?.bookingData) {
            console.log('🚀 [DEBUG] Initializing with booking data:', location.state.bookingData);
            setBookingData(location.state.bookingData);
        } else {
            console.log('❌ [DEBUG] No booking data in location state');
            addNotification('No booking data found. Please start over.', 'error');
            navigate('/dashboard');
        }
    }, [location.state, navigate, addNotification]);

    // Fetch complete booking data from API
    useEffect(() => {
        const fetchCompleteBookingData = async () => {
            if (!bookingData?.booking_id) return;

            try {
                setLoading(true);
                console.log('🔍 [DEBUG] Fetching complete booking data for ID:', bookingData.booking_id);

                const response = await bookingApi.getMyBookings();
                const bookings = response.data.bookings || [];

                if (bookings.length === 0) {
                    console.log('⚠️ [DEBUG] No bookings found');
                    return;
                }

                // Find the current booking by ID or matching criteria
                let completeBooking = null;

                // First try exact ID match
                completeBooking = bookings.find(booking =>
                    booking.booking_id === bookingData.booking_id ||
                    String(booking.booking_id) === String(bookingData.booking_id)
                );

                // If not found, try matching by criteria
                if (!completeBooking) {
                    completeBooking = bookings.find(booking =>
                        (booking.rental_item_name && bookingData?.item_name &&
                            booking.rental_item_name.toLowerCase().includes(bookingData.item_name.toLowerCase())) ||
                        (booking.payment_amount && bookingData?.payment_amount &&
                            Math.abs(booking.payment_amount - bookingData.payment_amount) < 1)
                    );

                    if (completeBooking) {
                        console.log('✅ [DEBUG] Found matching booking by criteria:', completeBooking.booking_id);
                        // Update local data with correct ID
                        setBookingData(prevData => ({
                            ...prevData,
                            ...completeBooking
                        }));
                    }
                }

                if (completeBooking) {
                    console.log('✅ [DEBUG] Complete booking data loaded:', completeBooking);
                }

            } catch (error) {
                console.error('❌ [DEBUG] Error fetching booking data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompleteBookingData();
    }, [bookingData?.booking_id]);

    // Simple status check function
    const handleCheckStatus = async () => {
        if (loading || !bookingData?.booking_id) return;

        try {
            setLoading(true);
            setLastCheckTime(new Date().toLocaleTimeString());

            console.log('🔍 [DEBUG] Checking status for booking:', bookingData.booking_id);

            const response = await bookingApi.getMyBookings();
            const bookings = response.data.bookings || [];

            const currentBooking = bookings.find(booking =>
                booking.booking_id === bookingData.booking_id ||
                String(booking.booking_id) === String(bookingData.booking_id)
            );

            if (!currentBooking) {
                addNotification('⚠️ Booking not found. Please check your booking status.', 'warning');
                return;
            }

            console.log('🎯 [DEBUG] Current booking status:', currentBooking);

            // Check status and navigate accordingly
            if (currentBooking.owner_confirmation_status === 'ACCEPTED') {
                console.log('🎉 [DEBUG] Owner accepted! Navigating to confirmation...');
                addNotification('🎉 Owner accepted your booking! Please confirm delivery.', 'success');

                navigate('/delivery-confirmation/' + currentBooking.booking_id, {
                    state: {
                        message: 'Owner accepted! Enter confirmation code.',
                        bookingData: currentBooking
                    }
                });
                return;
            }

            if (currentBooking.owner_confirmation_status === 'REJECTED') {
                console.log('❌ [DEBUG] Owner rejected! Navigating to dashboard...');
                addNotification('❌ Owner rejected your booking. Payment will be refunded.', 'error');

                navigate('/dashboard', {
                    state: {
                        message: 'Booking rejected. Payment refunded minus service fee.',
                        type: 'rejected'
                    }
                });
                return;
            }

            // Owner hasn't taken action yet
            console.log('⏳ [DEBUG] Owner has not taken action yet');
            addNotification('⏳ Owner has not taken action yet. Please wait or check again later.', 'info');

        } catch (error) {
            console.error('❌ [DEBUG] Error checking status:', error);
            addNotification('❌ Error checking status. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoToDashboard = () => {
        navigate('/dashboard');
    };

    // Simple helper functions
    const getStatusDisplay = () => {
        if (!bookingData) return 'Loading...';

        if (bookingData.owner_confirmation_status === 'ACCEPTED') {
            return '🎉 Owner Accepted - Ready for Confirmation';
        }

        if (bookingData.owner_confirmation_status === 'REJECTED') {
            return '❌ Owner Rejected - Refund Pending';
        }

        return '⏳ Waiting for Owner Action';
    };

    const getStatusColor = () => {
        if (!bookingData) return 'text-gray-500';

        if (bookingData.owner_confirmation_status === 'ACCEPTED') {
            return 'text-green-600';
        }

        if (bookingData.owner_confirmation_status === 'REJECTED') {
            return 'text-red-600';
        }

        return 'text-blue-600';
    };

    if (!bookingData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Waiting for Owner Action</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Your booking is waiting for the owner to accept or reject
                    </p>
                </div>

                {/* Booking Details */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                        📋 Booking Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Booking ID:</span>
                            <span className="ml-2 font-medium">{bookingData.booking_id}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Item:</span>
                            <span className="ml-2 font-medium">{bookingData.item_name || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Total Amount:</span>
                            <span className="ml-2 font-medium">${bookingData.total_amount || bookingData.payment_amount || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Payment Status:</span>
                            <span className="ml-2 font-medium">{bookingData.payment_status || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Status Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                        📊 Status Information
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                        <div className="flex justify-between">
                            <span>Last Check:</span>
                            <span className="font-medium">
                                {loading ? 'Checking now...' :
                                    lastCheckTime ? lastCheckTime : 'Not checked yet'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Status:</span>
                            <span className={`font-medium ${getStatusColor()}`}>
                                {getStatusDisplay()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Owner Confirmation:</span>
                            <span className="font-medium">
                                {bookingData.owner_confirmation_status || 'PENDING'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
                    <Button
                        onClick={handleCheckStatus}
                        variant="primary"
                        loading={loading}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                    >
                        <CheckCircleIcon className="h-5 w-5" />
                        <span>{loading ? 'Checking...' : 'Check Status'}</span>
                    </Button>

                    <Button
                        onClick={handleGoToDashboard}
                        variant="secondary"
                        className="flex items-center space-x-2"
                    >
                        <span>Go to Dashboard</span>
                    </Button>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                What happens next?
                            </h3>
                            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                <p>
                                    The owner will review your booking and either accept or reject it.
                                    If accepted, you'll receive a confirmation code to complete the delivery process.
                                    If rejected, your payment will be refunded minus the service fee.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerWaitingPage;
