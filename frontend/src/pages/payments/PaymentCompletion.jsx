import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { bookingApi } from '../../api/bookingApi';

const PaymentCompletion = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { addNotification } = useNotification();
    const { user } = useAuth();

    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentAccount, setPaymentAccount] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [bookingData, setBookingData] = useState(null);

    useEffect(() => {
        console.log('🚀 PaymentCompletion: useEffect triggered');
        console.log('🚀 PaymentCompletion: location.state:', location.state);
        console.log('🚀 PaymentCompletion: user:', user);
        console.log('🚀 PaymentCompletion: token exists:', !!localStorage.getItem('token'));

        // Check token validity
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    const currentTime = Math.floor(Date.now() / 1000);
                    console.log('🚀 PaymentCompletion: Token payload:', payload);
                    console.log('🚀 PaymentCompletion: Token expires at:', payload.exp);
                    console.log('🚀 PaymentCompletion: Current time:', currentTime);
                    console.log('🚀 PaymentCompletion: Token valid:', payload.exp > currentTime);
                }
            } catch (error) {
                console.error('🚀 PaymentCompletion: Error parsing token:', error);
            }
        }

        if (location.state?.bookingData) {
            console.log('🚀 PaymentCompletion: Setting booking data:', location.state.bookingData);
            setBookingData(location.state.bookingData);
        } else {
            // Redirect if no booking data
            console.log('🚀 PaymentCompletion: No booking data, redirecting to rental');
            addNotification('No booking data found. Please start over.', 'error');
            navigate('/rental');
        }
    }, [location.state, navigate, addNotification, user]);

    const handlePaymentMethodChange = (method) => {
        setPaymentMethod(method);
        setPaymentAccount(''); // Reset account when method changes
    };

    const validateForm = () => {
        if (!paymentMethod) return false;
        if (!paymentAccount) return false;

        // Validate account format based on payment method
        if (paymentMethod === 'EVC_PLUS') {
            if (!/^\d{9,10}$/.test(paymentAccount)) return false;
        } else if (paymentMethod === 'BANK') {
            if (!/^\d{10,}$/.test(paymentAccount)) return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('🚀 PaymentCompletion: handleSubmit triggered');
        console.log('🚀 PaymentCompletion: Current user:', user);
        console.log('🚀 PaymentCompletion: Token exists:', !!localStorage.getItem('token'));
        console.log('🚀 PaymentCompletion: Booking data:', bookingData);

        if (!validateForm()) {
            addNotification('Please fill in all payment details correctly.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            console.log('🚀 PaymentCompletion: About to call completeBookingPayment');
            console.log('🚀 PaymentCompletion: Booking ID:', bookingData.booking_id);
            console.log('🚀 PaymentCompletion: Payment data:', {
                payment_method: paymentMethod,
                payment_account: paymentAccount
            });

            const response = await bookingApi.completeBookingPayment(bookingData.booking_id, {
                payment_method: paymentMethod,
                payment_account: paymentAccount
            });

            addNotification('Payment submitted successfully! Your payment is now held until owner acceptance.', 'success');
            addNotification('✅ New booking added to "My Bookings"! Check your dashboard to see it.', 'success');

            // Trigger dashboard refresh to show new booking
            window.dispatchEvent(new Event('refreshUserDashboard'));

            // Navigate to owner waiting page
            navigate('/owner-waiting', {
                state: {
                    bookingData: {
                        ...bookingData,
                        service_fee: response.data.service_fee,
                        total_amount: response.data.total_amount
                    }
                }
            });

        } catch (error) {
            console.error('🚀 PaymentCompletion: Error completing payment:', error);
            console.error('🚀 PaymentCompletion: Error response:', error.response);
            console.error('🚀 PaymentCompletion: Error status:', error.response?.status);
            console.error('🚀 PaymentCompletion: Error data:', error.response?.data);

            if (error.response?.data?.error) {
                addNotification(error.response.data.error, 'error');
            } else if (error.response?.status === 401) {
                console.error('🚀 PaymentCompletion: 401 Unauthorized - Authentication failed');
                addNotification('Authentication failed. Please log in again.', 'error');
                // Don't redirect here, let the API client handle it
            } else {
                addNotification('Error completing payment. Please try again.', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (!bookingData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const totalAmount = bookingData.payment_amount + (bookingData.payment_amount * 0.05); // 5% service fee

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Final step to complete your booking
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Payment Form */}
                    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
                        <h2 className="text-xl font-semibold mb-6">Payment Details</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Payment Method *
                                </label>
                                <div className="space-y-3">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="EVC_PLUS"
                                            checked={paymentMethod === 'EVC_PLUS'}
                                            onChange={() => handlePaymentMethodChange('EVC_PLUS')}
                                            className="mr-3"
                                        />
                                        <span>EVC+ (Mobile Money)</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="BANK"
                                            checked={paymentMethod === 'BANK'}
                                            onChange={() => handlePaymentMethodChange('BANK')}
                                            className="mr-3"
                                        />
                                        <span>Bank Transfer</span>
                                    </label>
                                </div>
                            </div>

                            {/* Payment Account */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {paymentMethod === 'EVC_PLUS' ? 'EVC+ Number' :
                                        paymentMethod === 'BANK' ? 'Bank Account Number' : 'Account Number'} *
                                </label>
                                <input
                                    type="text"
                                    value={paymentAccount}
                                    onChange={(e) => setPaymentAccount(e.target.value)}
                                    placeholder={paymentMethod === 'EVC_PLUS' ? 'Enter 9-10 digit EVC+ number' :
                                        paymentMethod === 'BANK' ? 'Enter bank account number' : 'Enter account number'}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                />
                                {paymentMethod && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        {paymentMethod === 'EVC_PLUS'
                                            ? 'Enter your 9-10 digit EVC+ mobile money number'
                                            : 'Enter your bank account number (minimum 10 digits)'}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting || !validateForm()}
                                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${submitting || !validateForm()
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    }`}
                            >
                                {submitting ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Processing...
                                    </div>
                                ) : (
                                    'Complete Payment & Book Now'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Booking Summary */}
                    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
                        <h2 className="text-xl font-semibold mb-6">Booking Summary</h2>

                        <div className="space-y-4">
                            {/* Item Details */}
                            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                <h3 className="font-medium text-lg mb-2">{bookingData.item_name}</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Daily Rate: ${bookingData.daily_rate}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Rental Period: {bookingData.rental_period}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Duration: {bookingData.rental_days} days
                                </p>
                            </div>

                            {/* Pricing Breakdown */}
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Rental Cost:</span>
                                    <span>${bookingData.total_price}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Service Fee (5%):</span>
                                    <span>${(bookingData.payment_amount * 0.05).toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>Total Amount:</span>
                                        <span>${totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Requirements Summary */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h4 className="font-medium mb-2">Requirements Completed:</h4>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {bookingData.requirements_summary} fields filled
                                </p>
                            </div>

                            {/* Important Notice */}
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                            Important Notice
                                        </h3>
                                        <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                            <p>
                                                Your payment will be held in the system until admin approval.
                                                Once approved, your booking will be confirmed and the item will be reserved for you.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Back Button */}
                        <button
                            onClick={handleBack}
                            className="w-full mt-6 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Back to Requirements
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentCompletion;

