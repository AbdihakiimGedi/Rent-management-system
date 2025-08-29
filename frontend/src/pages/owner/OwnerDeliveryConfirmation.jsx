import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { ownerApi } from '../../api/ownerApi';
import Button from '../../components/ui/Button';
import { CheckCircleIcon, XCircleIcon, ClockIcon, KeyIcon } from '@heroicons/react/24/outline';

const OwnerDeliveryConfirmation = () => {
    const { bookingId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { addNotification } = useNotification();
    const { user } = useAuth();

    // Simple state
    const [bookingData, setBookingData] = useState(null);
    const [confirmationCode, setConfirmationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    // Initialize data
    useEffect(() => {
        // Always fetch fresh data to ensure we have the latest confirmation code
        if (bookingId) {
            fetchBookingData();
        } else {
            addNotification('❌ No booking information available. Please go back and try again.', 'error');
        }
    }, [bookingId]);

    // Check if owner has already confirmed delivery
    const checkConfirmationStatus = (booking) => {
        if (booking && booking.owner_confirmed) {
            setIsConfirmed(true);
        }
    };

    const fetchBookingData = async () => {
        try {
            setLoading(true);

            // Use the working ownerApi method instead of direct fetch
            const response = await ownerApi.getBooking(bookingId);

            // The API returns { "booking": {...} }
            if (response.data.booking) {
                const booking = response.data.booking;
                setBookingData(booking);
                checkConfirmationStatus(booking);
            } else {
                addNotification('❌ No booking data received. Please try again.', 'error');
            }
        } catch (error) {
            if (error.response?.data?.error) {
                addNotification(`❌ ${error.response.data.error}`, 'error');
            } else if (error.response?.status === 404) {
                addNotification('❌ Booking not found. Please check the booking ID.', 'error');
            } else if (error.response?.status === 403) {
                addNotification('❌ Access denied. This booking may not belong to you.', 'error');
            } else {
                addNotification('❌ Error loading booking data. Please try again.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDelivery = async (e) => {
        e.preventDefault();

        if (!confirmationCode.trim()) {
            addNotification('❌ Please enter the confirmation code.', 'error');
            return;
        }

        try {
            setSubmitting(true);

            // Use ownerApi for consistency
            const response = await ownerApi.confirmDelivery(bookingId, confirmationCode);

            addNotification('✅ Delivery confirmed successfully by owner!', 'success');

            // Set confirmed state to disable form
            setIsConfirmed(true);

            // Update local booking data to reflect confirmation
            setBookingData(prev => ({
                ...prev,
                owner_confirmed: true
            }));

            // Navigate to success page or dashboard
            navigate('/owner/dashboard', {
                state: {
                    message: 'Delivery confirmed! Payment will be processed.',
                    type: 'delivery_confirmed'
                }
            });

        } catch (error) {
            if (error.response?.data?.error) {
                addNotification(`❌ ${error.response.data.error}`, 'error');
            } else {
                addNotification('❌ Error confirming delivery. Please try again.', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoBack = () => {
        navigate('/owner/dashboard');
    };

    // Check if 24 hours have passed since owner acceptance
    const is24HoursPassed = () => {
        if (!bookingData?.owner_acceptance_time) return false;
        const acceptanceTime = new Date(bookingData.owner_acceptance_time);
        const now = new Date();
        const hoursDiff = (now - acceptanceTime) / (1000 * 60 * 60);
        return hoursDiff >= 24;
    };

    // Check if owner can confirm now (either user confirmed or 24 hours passed)
    const canOwnerConfirmNow = () => {
        return bookingData?.renter_confirmed || is24HoursPassed();
    };

    if (!bookingData) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">No booking data available.</p>
                <div className="mt-4 text-sm text-gray-500">
                    <p>Debug Info:</p>
                    <p>Location State: {JSON.stringify(location.state)}</p>
                    <p>Booking ID: {bookingId}</p>
                    <p>Loading: {loading ? 'Yes' : 'No'}</p>
                </div>
                <Button onClick={handleGoBack} className="mt-4">
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
                        <CheckCircleIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Confirm Delivery</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Enter the confirmation code to complete the delivery process
                    </p>
                </div>

                {/* Booking Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                        📋 Booking Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Booking ID:</span>
                            <span className="ml-2 font-medium">{bookingData.booking_id}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Item:</span>
                            <span className="ml-2 font-medium">{bookingData.rental_item_name || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                            <span className="ml-2 font-medium">${bookingData.payment_amount || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">User Confirmed:</span>
                            <span className={`ml-2 font-medium ${bookingData.renter_confirmed ? 'text-green-600' : 'text-yellow-600'}`}>
                                {bookingData.renter_confirmed ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Confirmation Code:</span>
                            <span className="ml-2 font-mono font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {bookingData.confirmation_code || 'Generated'}
                            </span>
                            {!bookingData.confirmation_code && (
                                <span className="ml-2 text-xs text-red-500">
                                    ⚠️ Code not found - click "Refresh Data" or "Test API Call"
                                </span>
                            )}
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Code Expires:</span>
                            <span className="ml-2 font-medium text-orange-600">
                                {bookingData.code_expiry ? new Date(bookingData.code_expiry).toLocaleString() : '24 hours'}
                            </span>
                        </div>
                    </div>


                </div>

                {/* Status Alert */}
                {!canOwnerConfirmNow() && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ClockIcon className="h-5 w-5 text-yellow-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                    Waiting for User Confirmation
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                    <p>
                                        ⏳ You must wait for the user to confirm delivery first before you can confirm.<br />
                                        🔐 The user needs to enter the confirmation code: <span className="font-mono font-bold">{bookingData.confirmation_code}</span><br />
                                        ⏰ Code expires in 24 hours from acceptance<br />
                                        🕐 Time since acceptance: {bookingData.owner_acceptance_time ?
                                            `${Math.floor((new Date() - new Date(bookingData.owner_acceptance_time)) / (1000 * 60 * 60))} hours` : 'Unknown'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 24-Hour Override Alert */}
                {!bookingData.renter_confirmed && is24HoursPassed() && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ClockIcon className="h-5 w-5 text-orange-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                    24-Hour Override Active
                                </h3>
                                <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                                    <p>
                                        ⏰ 24 hours have passed since you accepted the booking.<br />
                                        🔓 You can now confirm delivery even if the user hasn't confirmed.<br />
                                        ⚠️ This will complete the delivery and release payment to you.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirmation Form or Success State */}
                {isConfirmed ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
                        <div className="text-center">
                            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h4 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
                                ✅ Delivery Confirmed Successfully!
                            </h4>
                            <p className="text-green-700 dark:text-green-300">
                                You have successfully confirmed delivery with code: <span className="font-mono font-bold">{bookingData.confirmation_code}</span><br />
                                Payment will be processed automatically.
                            </p>
                        </div>
                    </div>
                ) : canOwnerConfirmNow() ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                            🔐 Enter Confirmation Code
                        </h4>

                        <form onSubmit={handleConfirmDelivery} className="space-y-4">
                            <div>
                                <label htmlFor="confirmationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Confirmation Code
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <KeyIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        id="confirmationCode"
                                        value={confirmationCode}
                                        onChange={(e) => setConfirmationCode(e.target.value)}
                                        placeholder="Enter 6-digit code"
                                        maxLength={6}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    {bookingData.renter_confirmed
                                        ? `Enter the 6-digit confirmation code: ${bookingData.confirmation_code}`
                                        : `24-hour override active. Enter the 6-digit confirmation code: ${bookingData.confirmation_code}`
                                    }
                                </p>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                loading={submitting}
                                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700"
                            >
                                <CheckCircleIcon className="h-5 w-5" />
                                <span>{submitting ? 'Confirming...' : 'Confirm Delivery'}</span>
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6 text-center">
                        <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Confirmation Form Locked
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                            The confirmation form will be unlocked once the user confirms delivery with the code.
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4">
                    {!isConfirmed && (
                        <Button
                            onClick={handleGoBack}
                            variant="secondary"
                            className="flex items-center space-x-2"
                        >
                            <span>Go Back</span>
                        </Button>
                    )}

                    <Button
                        onClick={fetchBookingData}
                        variant="secondary"
                        className="flex items-center space-x-2"
                        disabled={loading}
                    >
                        <span>{loading ? 'Refreshing...' : '🔄 Refresh Data'}</span>
                    </Button>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Important Notes
                            </h3>
                            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                <p>
                                    • You can only confirm delivery after the user has confirmed<br />
                                    • Both parties must confirm with the same code<br />
                                    • Payment is automatically released after both confirmations<br />
                                    • The confirmation code expires in 24 hours
                                </p>
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
};

export default OwnerDeliveryConfirmation;
