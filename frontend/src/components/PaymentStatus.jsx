import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

const PaymentStatus = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addNotification } = useNotification();
    const { user } = useAuth();

    const [paymentData, setPaymentData] = useState(null);
    const [deliveryData, setDeliveryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmationCode, setConfirmationCode] = useState('');
    const [submittingConfirmation, setSubmittingConfirmation] = useState(false);

    useEffect(() => {
        fetchPaymentStatus();
        fetchDeliveryStatus();
    }, [bookingId]);

    const fetchPaymentStatus = async () => {
        try {
            const response = await fetch(`/payment/${bookingId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPaymentData(data);
            } else {
                addNotification('Failed to fetch payment status.', 'error');
            }
        } catch (error) {
            console.error('Error fetching payment status:', error);
            addNotification('Network error. Please try again.', 'error');
        }
    };

    const fetchDeliveryStatus = async () => {
        try {
            const response = await fetch(`/rental-delivery/${bookingId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setDeliveryData(data);
            }
        } catch (error) {
            console.error('Error fetching delivery status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmationSubmit = async (e) => {
        e.preventDefault();

        if (!confirmationCode) {
            addNotification('Please enter the confirmation code.', 'error');
            return;
        }

        setSubmittingConfirmation(true);
        try {
            const response = await fetch(`/rental-delivery/${bookingId}/renter-confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    confirmation_code: confirmationCode
                })
            });

            const data = await response.json();

            if (response.ok) {
                addNotification('Delivery confirmation submitted successfully!', 'success');
                setConfirmationCode('');
                fetchDeliveryStatus(); // Refresh delivery status
            } else {
                addNotification(data.error || 'Failed to confirm delivery.', 'error');
            }
        } catch (error) {
            console.error('Error confirming delivery:', error);
            addNotification('Network error. Please try again.', 'error');
        } finally {
            setSubmittingConfirmation(false);
        }
    };

    const requestConfirmationCode = async () => {
        try {
            const response = await fetch(`/rental-delivery/${bookingId}/renter-confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({})
            });

            const data = await response.json();

            if (response.ok) {
                addNotification('Confirmation code sent to your email!', 'success');
            } else {
                addNotification(data.error || 'Failed to send confirmation code.', 'error');
            }
        } catch (error) {
            console.error('Error requesting confirmation code:', error);
            addNotification('Network error. Please try again.', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!paymentData) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Payment Not Found
                </h2>
                <button
                    onClick={() => navigate('/bookings')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
                >
                    Go Back to Bookings
                </button>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'HELD':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
            case 'Completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
            case 'Failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'HELD':
                return '🔒';
            case 'Completed':
                return '✅';
            case 'Failed':
                return '❌';
            default:
                return '⏳';
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Payment Status
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Track your payment and delivery confirmation
                </p>
            </div>

            {/* Payment Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        💳 Payment Information
                    </h2>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(paymentData.payment_status)}`}>
                        {getStatusIcon(paymentData.payment_status)} {paymentData.payment_status}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payment Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            Payment Details
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">Booking ID:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    #{paymentData.booking_id}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">Payment Method:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {paymentData.payment_method}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">Account Number:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {paymentData.payment_account}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">Payment Amount:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    ${paymentData.payment_amount?.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">Service Fee:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    ${paymentData.service_fee?.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-3 border-2 border-indigo-200 dark:border-indigo-700">
                                <span className="text-indigo-700 dark:text-indigo-300 text-lg font-semibold">Total Amount:</span>
                                <span className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">
                                    ${paymentData.total_amount?.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            Payment Timeline
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Payment Submitted</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {paymentData.created_at ? new Date(paymentData.created_at).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div className={`w-3 h-3 rounded-full mt-2 ${paymentData.payment_status === 'HELD' ? 'bg-yellow-500' : 'bg-gray-300'
                                    }`}></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Payment Held</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Waiting for delivery confirmation
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div className={`w-3 h-3 rounded-full mt-2 ${paymentData.payment_status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                                    }`}></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Payment Released</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {paymentData.released_at ? new Date(paymentData.released_at).toLocaleDateString() : 'Pending'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delivery Confirmation Section */}
            {user.role === 'renter' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        📦 Delivery Confirmation
                    </h2>

                    {!deliveryData || deliveryData.message === "Delivery not yet initiated." ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Ready to confirm delivery? Request a confirmation code to proceed.
                            </p>
                            <button
                                onClick={requestConfirmationCode}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium"
                            >
                                Request Confirmation Code
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Delivery Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Delivery Status
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full ${deliveryData.renter_confirmed ? 'bg-green-500' : 'bg-gray-300'
                                                }`}></div>
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                Renter Confirmed: {deliveryData.renter_confirmed ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full ${deliveryData.owner_confirmed ? 'bg-green-500' : 'bg-gray-300'
                                                }`}></div>
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                Owner Confirmed: {deliveryData.owner_confirmed ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Confirmation Form */}
                                {!deliveryData.renter_confirmed && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            Confirm Delivery
                                        </h3>
                                        <form onSubmit={handleConfirmationSubmit} className="space-y-3">
                                            <input
                                                type="text"
                                                value={confirmationCode}
                                                onChange={(e) => setConfirmationCode(e.target.value)}
                                                placeholder="Enter 6-digit confirmation code"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                maxLength="6"
                                            />
                                            <button
                                                type="submit"
                                                disabled={submittingConfirmation || !confirmationCode}
                                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                            >
                                                {submittingConfirmation ? 'Confirming...' : 'Confirm Delivery'}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>

                            {/* Important Notice */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                                            How Payment Release Works
                                        </h4>
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            Your payment will be automatically released to the owner once both you and the owner confirm the delivery.
                                            This ensures a safe and fair transaction for both parties.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
                <button
                    onClick={() => navigate('/bookings')}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    Back to Bookings
                </button>
                <button
                    onClick={() => navigate('/payments')}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                    View All Payments
                </button>
            </div>
        </div>
    );
};

export default PaymentStatus;
