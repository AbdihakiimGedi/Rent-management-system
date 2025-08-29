import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { bookingApi } from '../../api/bookingApi';
import Button from '../../components/ui/Button';
import { CheckCircleIcon, XCircleIcon, ClockIcon, KeyIcon } from '@heroicons/react/24/outline';

const DeliveryConfirmation = () => {
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
        if (location.state?.bookingData) {
            setBookingData(location.state.bookingData);
            checkConfirmationStatus(location.state.bookingData);
        } else if (bookingId) {
            // Fetch booking data if not provided
            fetchBookingData();
        }
    }, [location.state, bookingId]);

    // Check if user has already confirmed delivery
    const checkConfirmationStatus = (booking) => {
        if (booking && booking.renter_confirmed) {
            setIsConfirmed(true);
        }
    };

    const fetchBookingData = async () => {
        try {
            setLoading(true);
            // Get the specific booking with full details including confirmation code
            const response = await bookingApi.getBooking(bookingId);

            if (response.data) {
                const currentBooking = response.data;
                setBookingData(currentBooking);
                checkConfirmationStatus(currentBooking);
            } else {
                addNotification('❌ Booking not found. Please check your bookings.', 'error');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error fetching booking:', error);
            addNotification('❌ Error loading booking data.', 'error');
            navigate('/dashboard');
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

            const response = await bookingApi.confirmDelivery(bookingId, confirmationCode);

            if (response.data.success) {
                addNotification('✅ Delivery confirmed successfully!', 'success');

                // Set confirmed state to disable form
                setIsConfirmed(true);

                // Update local booking data to reflect confirmation
                setBookingData(prev => ({
                    ...prev,
                    renter_confirmed: true
                }));

                // Navigate to success page or dashboard
                navigate('/dashboard', {
                    state: {
                        message: 'Delivery confirmed! Waiting for owner confirmation.',
                        type: 'delivery_confirmed'
                    }
                });
            } else {
                addNotification('❌ Confirmation failed. Please check the code and try again.', 'error');
            }
        } catch (error) {
            console.error('Error confirming delivery:', error);
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
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!bookingData) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Unable to load booking information. Please check your bookings.
                        </p>
                        <Button onClick={handleGoBack} variant="primary">
                            Go Back to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className={`text-3xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        Confirm Delivery
                    </h1>
                    <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Enter the confirmation code to complete your rental
                    </p>
                </div>

                {/* Confirmation Code Display */}
                {bookingData.confirmation_code ? (
                    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 mb-6 text-center shadow-md border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-center mb-4">
                            <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-green-600' : 'bg-green-100'} mr-3`}>
                                <KeyIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                Confirmation Code Available
                            </h2>
                        </div>
                        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 border border-dashed ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
                            <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Your confirmation code:</p>
                            <p className="text-2xl font-mono font-bold text-green-600 bg-white rounded px-4 py-2">
                                {bookingData.confirmation_code}
                            </p>
                            {bookingData.code_expiry && (
                                <p className={`text-sm mt-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Expires: {new Date(bookingData.code_expiry).toLocaleString()}
                                </p>
                            )}
                        </div>
                        <p className={`text-sm mt-3 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                            ✅ This code has been provided by the owner. Use it to confirm delivery.
                        </p>
                    </div>
                ) : (
                    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 mb-6 text-center shadow-md border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-center mb-4">
                            <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-yellow-600' : 'bg-yellow-100'} mr-3`}>
                                <ClockIcon className="h-6 w-6 text-yellow-600" />
                            </div>
                            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                Waiting for Confirmation Code
                            </h2>
                        </div>
                        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 border border-dashed ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
                            <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Status:</p>
                            <p className={`text-lg font-medium ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                ⏳ Owner has not provided confirmation code yet
                            </p>
                        </div>
                        <p className={`text-sm mt-3 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                            Please wait for the owner to generate and provide you with a confirmation code.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Confirmation Form */}
                    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-6`}>
                        <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Delivery Confirmation</h2>

                        {isConfirmed ? (
                            <div className="text-center py-6">
                                <div className="p-3 rounded-full bg-green-100 dark:bg-green-600 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                                    <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-white" />
                                </div>
                                <h3 className={`text-lg font-semibold text-green-600 mb-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Delivery Confirmed!</h3>
                                <p className={`text-base mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    You have successfully confirmed delivery of this item.
                                </p>
                                <Button onClick={handleGoBack} variant="primary">
                                    Return to Dashboard
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleConfirmDelivery} className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                                        Confirmation Code *
                                    </label>
                                    <div className="relative">
                                        <KeyIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={confirmationCode}
                                            onChange={(e) => setConfirmationCode(e.target.value)}
                                            placeholder="Enter the confirmation code"
                                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${theme === 'dark'
                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                                }`}
                                            disabled={submitting}
                                        />
                                    </div>
                                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Enter the confirmation code provided by the owner
                                    </p>
                                </div>

                                <div className="flex space-x-3 pt-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-1"
                                        disabled={submitting || !confirmationCode.trim()}
                                    >
                                        {submitting ? (
                                            <div className="flex items-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Confirming...
                                            </div>
                                        ) : (
                                            <div className="flex items-center">
                                                <CheckCircleIcon className="h-5 w-5 mr-2" />
                                                Confirm Delivery
                                            </div>
                                        )}
                                    </Button>

                                    <Button
                                        type="button"
                                        onClick={handleGoBack}
                                        variant="secondary"
                                        className="flex-1"
                                        disabled={submitting}
                                    >
                                        Go Back
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Booking Information */}
                    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-6`}>
                        <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Booking Details</h2>

                        <div className="space-y-4">
                            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                                <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Item Name
                                </label>
                                <p className={`text-base font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {bookingData.item_name || bookingData.rental_item_name || 'Unknown Item'}
                                </p>
                            </div>

                            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                                <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Booking ID
                                </label>
                                <p className={`text-base font-mono font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                    #{bookingData.booking_id || 'Unknown'}
                                </p>
                            </div>

                            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                                <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Rental Period
                                </label>
                                <p className={`text-base font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {bookingData.rental_period || 'Not specified'}
                                </p>
                            </div>

                            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                                <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Total Amount
                                </label>
                                <p className={`text-xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                    ${(bookingData.total_amount || bookingData.payment_amount || 0).toLocaleString()}
                                </p>
                            </div>

                            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                                <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Status
                                </label>
                                <div className="flex items-center space-x-2">
                                    <div className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                                        <ClockIcon className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <span className={`text-base font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
                                        Waiting for Confirmation
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
                            <h3 className={`text-base font-semibold mb-3 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
                                📋 How to Confirm Delivery
                            </h3>
                            <ol className={`space-y-2 text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
                                <li className="flex items-start">
                                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">1</span>
                                    <span>Wait for the owner to provide you with a confirmation code</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">2</span>
                                    <span>Enter the confirmation code in the form on the left</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">3</span>
                                    <span>Click "Confirm Delivery" to complete the process</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">4</span>
                                    <span>Your payment will be released once both parties confirm</span>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryConfirmation;
