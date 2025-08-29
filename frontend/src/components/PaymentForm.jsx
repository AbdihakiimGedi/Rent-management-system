import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

const PaymentForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addNotification } = useNotification();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        payment_method: '',
        payment_account: ''
    });
    const [loading, setLoading] = useState(false);
    const [bookingData, setBookingData] = useState(null);

    useEffect(() => {
        // Get booking data from location state
        if (location.state?.bookingData) {
            console.log('🚀 PaymentForm: Received booking data:', location.state.bookingData);
            setBookingData(location.state.bookingData);
        } else {
            // If no booking data, redirect back
            console.log('🚀 PaymentForm: No booking data found in location state');
            addNotification('No booking data found. Please complete your booking first.', 'error');
            navigate('/bookings');
        }
    }, [location.state, navigate, addNotification]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.payment_method) {
            addNotification('Please select a payment method.', 'error');
            return false;
        }
        if (!formData.payment_account) {
            addNotification('Please enter your account number.', 'error');
            return false;
        }

        // Validate account number based on payment method
        if (formData.payment_method === 'EVC_PLUS') {
            if (!/^\d{9,10}$/.test(formData.payment_account)) {
                addNotification('EVC+ number must be 9-10 digits.', 'error');
                return false;
            }
        } else if (formData.payment_method === 'BANK') {
            if (!/^\d{10,}$/.test(formData.payment_account)) {
                addNotification('Bank account number must be at least 10 digits.', 'error');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await fetch('/payment/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    booking_id: bookingData.booking_id,
                    payment_method: formData.payment_method,
                    payment_account: formData.payment_account
                })
            });

            const data = await response.json();

            if (response.ok) {
                addNotification('Payment submitted successfully! Your payment is now held until delivery confirmation.', 'success');

                // Show additional message about multiple rentals
                setTimeout(() => {
                    addNotification('💡 You can continue renting more items while waiting for delivery confirmation!', 'info');
                }, 1000);

                // Navigate to payment status page
                navigate(`/payments/${bookingData.booking_id}`, {
                    state: {
                        paymentSubmitted: true,
                        paymentData: data
                    }
                });
            } else {
                addNotification(data.error || 'Failed to submit payment.', 'error');
            }
        } catch (error) {
            console.error('Payment submission error:', error);
            addNotification('Network error. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!bookingData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Strong validation: Ensure all required booking data is present
    const requiredFields = ['booking_id', 'payment_amount', 'item_name', 'daily_rate', 'total_price'];
    const missingFields = requiredFields.filter(field => !bookingData[field]);

    if (missingFields.length > 0) {
        console.error('🚀 PaymentForm: Missing required fields:', missingFields);
        console.error('🚀 PaymentForm: Available data:', bookingData);

        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Incomplete Booking Data
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Missing required information: {missingFields.join(', ')}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Please complete your booking first to proceed to payment.
                    </p>
                    <button
                        onClick={() => navigate('/bookings')}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Go to Bookings
                    </button>
                </div>
            </div>
        );
    }

    // Additional validation: Ensure payment amount is valid
    if (bookingData.payment_amount <= 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Invalid Payment Amount
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Payment amount must be greater than $0. Please check your booking details.
                    </p>
                    <button
                        onClick={() => navigate('/bookings')}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Go to Bookings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Complete Your Payment
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Submit your payment details to complete your rental booking
                </p>
            </div>

            {/* Booking Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    📋 Complete Booking Summary
                </h2>
                <div className="space-y-4">
                    {/* Item Details */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            🏠 Rental Item Details
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">Item Name:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {bookingData.item_name || 'Unnamed Item'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">Daily Rate:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    ${(bookingData.daily_rate || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Rental Details */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                            📅 Rental Details
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-blue-700 dark:text-blue-300 font-medium">Rental Period:</span>
                                <span className="font-semibold text-blue-900 dark:text-blue-100">
                                    {bookingData.rental_period || 'Not specified'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-blue-700 dark:text-blue-300 font-medium">Total Days:</span>
                                <span className="font-semibold text-blue-900 dark:text-blue-100">
                                    {bookingData.rental_days || 0} days
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-blue-700 dark:text-blue-300 font-medium">Requirements Filled:</span>
                                <span className="font-semibold text-blue-900 dark:text-blue-100">
                                    {bookingData.requirements_summary || 0} fields
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
                            💰 Payment Summary
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-green-700 dark:text-green-300 font-medium">Base Amount:</span>
                                <span className="font-semibold text-green-900 dark:text-green-100">
                                    ${(bookingData.total_price || bookingData.payment_amount || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-green-700 dark:text-green-300 font-medium">Service Fee (5%):</span>
                                <span className="font-semibold text-green-900 dark:text-green-100">
                                    ${((bookingData.payment_amount || 0) * 0.05).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 bg-green-100 dark:bg-green-800 rounded-lg px-3 border-2 border-green-200 dark:border-green-600">
                                <span className="text-green-800 dark:text-green-200 text-lg font-semibold">Final Total:</span>
                                <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                                    ${((bookingData.payment_amount || 0) * 1.05).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Booking ID */}
                    <div className="flex justify-between items-center py-3 bg-gray-100 dark:bg-gray-700 rounded-lg px-4">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Booking ID:</span>
                        <span className="font-semibold text-gray-900 dark:text-white text-lg">
                            #{bookingData.booking_id}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payment Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    💳 Payment Details
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Payment Method <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="payment_method"
                            value={formData.payment_method}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">Select Payment Method</option>
                            <option value="EVC_PLUS">EVC+ (Mobile Money)</option>
                            <option value="BANK">Bank Transfer</option>
                        </select>
                        {formData.payment_method === 'EVC_PLUS' && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Enter your 9-10 digit EVC+ number
                            </p>
                        )}
                        {formData.payment_method === 'BANK' && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Enter your bank account number (minimum 10 digits)
                            </p>
                        )}
                    </div>

                    {/* Account Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="payment_account"
                            value={formData.payment_account}
                            onChange={handleInputChange}
                            required
                            placeholder={formData.payment_method === 'EVC_PLUS' ? 'Enter EVC+ number' : 'Enter bank account number'}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    {/* Important Notice */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                                    Payment Security Notice
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Your payment will be held securely until both you and the owner confirm the rental delivery.
                                    This ensures a safe and fair transaction for both parties.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center">
                        {/* Left side - Rent Another Item */}
                        <button
                            type="button"
                            onClick={() => navigate('/browse')}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center"
                        >
                            🏠 Rent Another Item
                        </button>

                        {/* Right side - Cancel & Submit */}
                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={() => navigate('/bookings')}
                                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Payment'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentForm;
