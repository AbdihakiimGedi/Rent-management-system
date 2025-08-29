import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { ownerApi } from '../../api/ownerApi';

const BookingAcceptReject = ({ action }) => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addNotification } = useNotification();
    const { user } = useAuth();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        if (!bookingId) {
            addNotification('No booking ID provided', 'error');
            navigate('/owner/dashboard');
            return;
        }

        // Fetch booking details
        fetchBookingDetails();
    }, [bookingId, navigate, addNotification]);

    const fetchBookingDetails = async () => {
        try {
            setLoading(true);
            console.log('🔄 BookingAcceptReject: Fetching booking details for ID:', bookingId);

            // Use the new getBooking method to get the specific booking
            const response = await ownerApi.getBooking(bookingId);
            console.log('🔄 BookingAcceptReject: API response:', response);

            if (response.data && response.data.booking) {
                const currentBooking = response.data.booking;
                console.log('🔄 BookingAcceptReject: Found booking:', currentBooking);
                setBooking(currentBooking);
            } else {
                console.error('🔄 BookingAcceptReject: Invalid response format:', response.data);
                addNotification('Invalid booking data received', 'error');
                navigate('/owner/dashboard');
            }
        } catch (error) {
            console.error('🔄 BookingAcceptReject: Error fetching booking details:', error);
            console.error('🔄 BookingAcceptReject: Error response:', error.response);

            if (error.response?.status === 404) {
                addNotification('Booking not found or access denied', 'error');
            } else {
                addNotification('Error fetching booking details', 'error');
            }
            navigate('/owner/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        try {
            setLoading(true);
            const response = await ownerApi.acceptBooking(bookingId);
            addNotification('Booking accepted successfully! Confirmation code generated. Navigate to delivery confirmation to enter code.', 'success');

            // Force refresh owner dashboard to show new notifications
            window.dispatchEvent(new CustomEvent('refreshOwnerDashboard'));

            // Navigate to delivery confirmation page to enter the code
            navigate(`/owner/delivery-confirmation/${bookingId}`, {
                state: {
                    message: 'Booking accepted successfully! Enter the confirmation code to complete delivery.',
                    action: 'accepted',
                    bookingData: booking  // Pass the booking data
                }
            });
        } catch (error) {
            console.error('Error accepting booking:', error);
            addNotification(error.response?.data?.error || 'Error accepting booking', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            addNotification('Please provide a reason for rejection', 'error');
            return;
        }

        try {
            setLoading(true);
            const response = await ownerApi.rejectBooking(bookingId, rejectionReason);
            addNotification('Booking rejected successfully. Payment will be refunded to renter.', 'success');
            navigate('/owner/dashboard', {
                state: { message: 'Booking rejected successfully!' }
            });
        } catch (error) {
            console.error('Error rejecting booking:', error);
            addNotification(error.response?.data?.error || 'Error rejecting booking', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking not found</h2>
                    <button
                        onClick={() => navigate('/owner/dashboard')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {action === 'accept' ? 'Accept' : 'Reject'} Booking
                        </h1>
                        <p className="text-gray-600">
                            Booking #{booking.booking_id}
                        </p>
                    </div>

                    {/* Booking Details */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Booking Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">Item:</span>
                                <span className="ml-2 text-gray-900">{booking.rental_item_name}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Renter:</span>
                                <span className="ml-2 text-gray-900">{booking.renter_username}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Amount:</span>
                                <span className="ml-2 text-gray-900">${booking.payment_amount}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Status:</span>
                                <span className="ml-2 text-gray-900">{booking.owner_confirmation_status}</span>
                            </div>
                        </div>
                    </div>

                    {action === 'accept' ? (
                        <div className="text-center">
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to accept this booking?
                                A confirmation code will be sent to the renter.
                            </p>
                            <div className="flex space-x-4 justify-center">
                                <button
                                    onClick={handleAccept}
                                    disabled={loading}
                                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-green-400"
                                >
                                    {loading ? 'Accepting...' : '✅ Accept Booking'}
                                </button>
                                <button
                                    onClick={() => navigate('/owner/dashboard')}
                                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to reject this booking?
                                The payment will be refunded to the renter.
                            </p>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Rejection *
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Please provide a reason for rejecting this booking..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    rows="3"
                                    required
                                />
                            </div>
                            <div className="flex space-x-4 justify-center">
                                <button
                                    onClick={handleReject}
                                    disabled={loading || !rejectionReason.trim()}
                                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-red-400"
                                >
                                    {loading ? 'Rejecting...' : '❌ Reject Booking'}
                                </button>
                                <button
                                    onClick={() => navigate('/owner/dashboard')}
                                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingAcceptReject;
