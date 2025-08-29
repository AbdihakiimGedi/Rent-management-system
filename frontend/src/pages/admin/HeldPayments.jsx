import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../api/adminApi';

const HeldPayments = () => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { addNotification } = useNotification();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [heldPayments, setHeldPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});

    useEffect(() => {
        fetchHeldPayments();
    }, []);

    const fetchHeldPayments = async () => {
        try {
            setLoading(true);
            const response = await adminApi.getHeldPayments();
            setHeldPayments(response.data.held_payments || []);
        } catch (error) {
            console.error('Error fetching held payments:', error);
            addNotification('Error fetching held payments', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApprovePayment = async (bookingId) => {
        try {
            setProcessing(prev => ({ ...prev, [bookingId]: true }));

            const response = await adminApi.approveHeldPayment(bookingId, {
                admin_approved: true
            });

            addNotification('Payment approved and released successfully', 'success');

            // Log the revenue update
            if (response.data) {
                console.log(`[REVENUE] ✅ Payment #${bookingId} approved successfully`);
                console.log(`[REVENUE] 💰 Admin revenue: $${response.data.admin_revenue}`);
                console.log(`[REVENUE] 💰 Total amount: $${response.data.total_amount}`);
            }

            fetchHeldPayments(); // Refresh the list

            // Trigger a dashboard refresh event to update revenue stats
            window.dispatchEvent(new Event('dashboardRefresh'));

        } catch (error) {
            console.error('Error approving payment:', error);
            addNotification('Error approving payment', 'error');
        } finally {
            setProcessing(prev => ({ ...prev, [bookingId]: false }));
        }
    };

    const handleRejectPayment = async (bookingId) => {
        const rejectionReason = prompt('Enter rejection reason:');
        if (!rejectionReason) return;

        try {
            setProcessing(prev => ({ ...prev, [bookingId]: true }));

            const response = await adminApi.rejectHeldPayment(bookingId, {
                admin_approved: false,
                rejection_reason: rejectionReason
            });

            addNotification('Payment rejected and refunded successfully', 'success');

            // Log the rejection
            if (response.data) {
                console.log(`[REVENUE] ❌ Payment #${bookingId} rejected successfully`);
                console.log(`[REVENUE] 💸 Refunded amount: $${response.data.refunded_amount}`);
                console.log(`[REVENUE] 💸 Refunded service fee: $${response.data.refunded_service_fee}`);
            }

            fetchHeldPayments(); // Refresh the list

            // Trigger a dashboard refresh event to update revenue stats
            window.dispatchEvent(new Event('dashboardRefresh'));

        } catch (error) {
            console.error('Error rejecting payment:', error);
            addNotification('Error rejecting payment', 'error');
        } finally {
            setProcessing(prev => ({ ...prev, [bookingId]: false }));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Held Payments Management</h1>
                            <p className="text-lg text-gray-600 dark:text-gray-400">
                                Review and approve payments that are currently held in the system
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/admin')}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Held</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {heldPayments.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ready to Approve</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {heldPayments.filter(p => !processing[p.booking_id]).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {formatCurrency(heldPayments.reduce((sum, p) => sum + p.total_amount, 0))}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Held Payments List */}
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold">Held Payments</h2>
                    </div>

                    <div className="p-6">
                        {heldPayments.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No held payments</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    All payments have been processed.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {heldPayments.map((payment) => (
                                    <div key={payment.booking_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Payment Details */}
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3">Payment Details</h3>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Booking ID:</span>
                                                        <span className="font-medium">#{payment.booking_id}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                                                        <span className="font-medium">{formatCurrency(payment.payment_amount)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Service Fee:</span>
                                                        <span className="font-medium">{formatCurrency(payment.service_fee)}</span>
                                                    </div>
                                                    <div className="flex justify-between border-t pt-2">
                                                        <span className="font-semibold">Total:</span>
                                                        <span className="font-semibold text-lg">{formatCurrency(payment.total_amount)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* User Information */}
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3">User Information</h3>
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Renter:</span>
                                                        <p className="font-medium">{payment.renter.username}</p>
                                                        <p className="text-sm text-gray-500">{payment.renter.email}</p>
                                                    </div>
                                                    {payment.owner && (
                                                        <div>
                                                            <span className="text-gray-600 dark:text-gray-400">Owner:</span>
                                                            <p className="font-medium">{payment.owner.username}</p>
                                                            <p className="text-sm text-gray-500">{payment.owner.email}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3">Actions</h3>
                                                <div className="space-y-3">
                                                    <button
                                                        onClick={() => handleApprovePayment(payment.booking_id)}
                                                        disabled={processing[payment.booking_id]}
                                                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {processing[payment.booking_id] ? 'Processing...' : 'Approve & Release'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectPayment(payment.booking_id)}
                                                        disabled={processing[payment.booking_id]}
                                                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {processing[payment.booking_id] ? 'Processing...' : 'Reject & Refund'}
                                                    </button>
                                                </div>

                                                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <p>Held since: {formatDate(payment.payment_held_at)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Requirements Summary */}
                                        {payment.requirements_data && (
                                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Requirements Summary</h4>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {Object.keys(payment.requirements_data).length} requirements completed
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeldPayments;






