import React, { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { ownerApi } from '../../api/ownerApi';

const BookingActionCard = ({ booking, onActionComplete }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const { showNotification } = useNotification();

    const handleAccept = async () => {
        setIsLoading(true);
        try {
            const response = await ownerApi.acceptBooking(booking.booking_id);
            showNotification('success', response.message);
            onActionComplete && onActionComplete();
        } catch (error) {
            showNotification('error', error.response?.data?.error || 'Failed to accept booking');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            showNotification('error', 'Please provide a reason for rejection');
            return;
        }

        setIsLoading(true);
        try {
            const response = await ownerApi.rejectBooking(booking.booking_id, rejectionReason);
            showNotification('success', response.message);
            setRejectionReason('');
            setShowRejectForm(false);
            onActionComplete && onActionComplete();
        } catch (error) {
            showNotification('error', error.response?.data?.error || 'Failed to reject booking');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            'Payment_Held': 'bg-yellow-100 text-yellow-800',
            'Owner_Accepted': 'bg-blue-100 text-blue-800',
            'Owner_Rejected': 'bg-red-100 text-red-800',
            'Confirmed': 'bg-green-100 text-green-800',
            'Delivered': 'bg-purple-100 text-purple-800'
        };

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    const getPaymentStatusBadge = (status) => {
        const statusColors = {
            'HELD': 'bg-yellow-100 text-yellow-800',
            'COMPLETED': 'bg-green-100 text-green-800',
            'FAILED': 'bg-red-100 text-red-800',
            'PENDING': 'bg-gray-100 text-gray-800'
        };

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-4">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Booking #{booking.booking_id}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Created: {formatDate(booking.created_at)}
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    {getStatusBadge(booking.status)}
                    {getPaymentStatusBadge(booking.payment_status)}
                </div>
            </div>

            {/* Item Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Item Information</h4>
                    <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Name:</span> {booking.rental_item_name || 'Unknown Item'}</p>
                        <p><span className="font-medium">Category:</span> {booking.category_name || 'Unknown'}</p>
                        <p><span className="font-medium">Rental Period:</span> {booking.rental_period || 'N/A'}</p>
                        <p><span className="font-medium">Start Date:</span> {formatDate(booking.start_date)}</p>
                        <p><span className="font-medium">End Date:</span> {formatDate(booking.end_date)}</p>
                    </div>
                </div>

                <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Renter Information</h4>
                    <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Name:</span> {booking.renter_username || 'Unknown'}</p>
                        <p><span className="font-medium">Email:</span> {booking.renter_email || 'N/A'}</p>
                    </div>

                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 mt-4">Financial Details</h4>
                    <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Payment Amount:</span> ${booking.payment_amount || 0}</p>
                        <p><span className="font-medium">Service Fee:</span> ${booking.service_fee || 0}</p>
                        <p><span className="font-medium">Total:</span> ${(booking.payment_amount || 0) + (booking.service_fee || 0)}</p>
                    </div>
                </div>
            </div>

            {/* Requirements Data */}
            {booking.requirements_data && Object.keys(booking.requirements_data).length > 0 && (
                <div className="mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Renter Requirements</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {Object.entries(booking.requirements_data).map(([key, value]) => (
                                <div key={key}>
                                    <span className="font-medium">{key}:</span> {String(value)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {booking.owner_confirmation_status === 'PENDING' && (
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleAccept}
                        disabled={isLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                        {isLoading ? 'Processing...' : '✅ Accept Booking'}
                    </button>

                    <button
                        onClick={() => setShowRejectForm(!showRejectForm)}
                        disabled={isLoading}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                        {isLoading ? 'Processing...' : '❌ Reject Booking'}
                    </button>
                </div>
            )}

            {/* Rejection Form */}
            {showRejectForm && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Rejection Reason</h4>
                    <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a reason for rejecting this booking..."
                        className="w-full p-2 border border-red-300 dark:border-red-700 rounded-md text-sm resize-none"
                        rows="3"
                    />
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={handleReject}
                            disabled={isLoading || !rejectionReason.trim()}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            {isLoading ? 'Processing...' : 'Confirm Rejection'}
                        </button>
                        <button
                            onClick={() => {
                                setShowRejectForm(false);
                                setRejectionReason('');
                            }}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Status Messages */}
            {booking.owner_confirmation_status === 'ACCEPTED' && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-blue-900 dark:text-blue-100 text-sm">
                        ✅ This booking has been accepted. A confirmation code has been sent to both parties.
                        The renter must confirm delivery within 24 hours, or you can confirm alone after that period.
                    </p>
                </div>
            )}

            {booking.owner_confirmation_status === 'REJECTED' && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-red-900 dark:text-red-100 text-sm">
                        ❌ This booking has been rejected. The renter will be refunded minus the service fee.
                    </p>
                </div>
            )}
        </div>
    );
};

export default BookingActionCard;









