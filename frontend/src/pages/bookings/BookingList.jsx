import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { bookingApi } from '../../api/bookingApi';
import { ownerApi } from '../../api/ownerApi';
import { adminApi } from '../../api/adminApi';
import { formatCurrency, formatDate, getStatusColor } from '../../../utils/formatters';
import Button from '../../components/ui/Button';

const BookingList = () => {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        date: '',
        search: '',
        page: 1
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });

    // Fetch bookings based on user role and filters
    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let response;
            if (user.role === 'admin') {
                response = await adminApi.getBookings(filters);
            } else if (user.role === 'owner') {
                // Use owner-specific endpoint
                response = await ownerApi.getBookings(filters);
            } else {
                response = await bookingApi.getMyBookings(filters);
            }

            if (response.data) {
                const data = response.data;
                setBookings(data.bookings || data || []);

                // Update pagination if available
                if (data.pagination) {
                    setPagination(prev => ({
                        ...prev,
                        currentPage: data.pagination.current_page || 1,
                        totalPages: data.pagination.total_pages || 1,
                        totalItems: data.pagination.total_items || 0
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setError('Failed to fetch bookings. Please try again.');
            addNotification('Error fetching bookings', 'error');
        } finally {
            setLoading(false);
        }
    }, [user.role, filters, addNotification]);

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 1 // Reset to first page when filters change
        }));
    };

    // Handle search
    const handleSearch = (searchTerm) => {
        handleFilterChange('search', searchTerm);
    };

    // Handle pagination
    const handlePageChange = (page) => {
        setFilters(prev => ({ ...prev, page }));
    };

    // Handle booking status update
    const handleStatusUpdate = async (bookingId, newStatus) => {
        if (!window.confirm(`Are you sure you want to change the status to "${newStatus}"?`)) {
            return;
        }

        try {
            if (user.role === 'admin') {
                await adminApi.updateBookingStatus(bookingId, { status: newStatus });
            } else if (user.role === 'owner') {
                await ownerApi.updateBookingStatus(bookingId, { status: newStatus });
            }

            addNotification(`Booking status updated to ${newStatus}`, 'success');
            fetchBookings(); // Refresh the list
        } catch (error) {
            console.error('Error updating booking status:', error);
            addNotification('Error updating booking status', 'error');
        }
    };

    // Handle booking actions based on status
    const handleBookingAction = async (booking, action) => {
        try {
            switch (action) {
                case 'accept':
                    await ownerApi.acceptBooking(booking.id);
                    addNotification('Booking accepted successfully', 'success');
                    break;
                case 'reject':
                    const reason = prompt('Please provide a reason for rejection:');
                    if (reason) {
                        await ownerApi.rejectBooking(booking.id, reason);
                        addNotification('Booking rejected successfully', 'success');
                    }
                    break;
                case 'confirm-delivery':
                    await ownerApi.confirmDelivery(booking.id);
                    addNotification('Delivery confirmed successfully', 'success');
                    break;
                default:
                    return;
            }
            fetchBookings(); // Refresh the list
        } catch (error) {
            console.error(`Error performing ${action} action:`, error);
            addNotification(`Error performing ${action} action`, 'error');
        }
    };

    // Navigate to booking detail
    const handleViewDetails = (booking) => {
        const id = booking.id ?? booking.booking_id;
        // Ensure numeric param
        const param = typeof id === 'number' ? id : parseInt(id, 10);
        navigate(`/bookings/${param}`, { state: { bookingData: booking } });
    };

    // Initialize data
    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading bookings...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Bookings</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    <Button onClick={fetchBookings} variant="primary">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {user.role === 'owner' ? 'My Bookings' : 'Bookings'}
                            </h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                Manage and track all your rental bookings
                            </p>
                        </div>
                        {user.role === 'user' && (
                            <Button onClick={() => navigate('/bookings/new')} variant="primary">
                                New Booking
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Search
                            </label>
                            <input
                                type="text"
                                placeholder="Search bookings..."
                                value={filters.search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                                <option value="delivered">Delivered</option>
                                <option value="returned">Returned</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Date
                            </label>
                            <input
                                type="date"
                                value={filters.date}
                                onChange={(e) => handleFilterChange('date', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        {/* Refresh Button */}
                        <div className="flex items-end">
                            <Button onClick={fetchBookings} variant="secondary" className="w-full">
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bookings List */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Bookings ({pagination.totalItems})
                        </h3>
                    </div>

                    <div className="p-6 overflow-x-auto">
                        {bookings.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Booking ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Renter</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Service Fee</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Method</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Account</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {bookings
                                        .slice()
                                        .sort((a, b) => {
                                            const aid = typeof (a.id ?? a.booking_id) === 'number' ? (a.id ?? a.booking_id) : parseInt(a.id ?? a.booking_id, 10) || 0;
                                            const bid = typeof (b.id ?? b.booking_id) === 'number' ? (b.id ?? b.booking_id) : parseInt(b.id ?? b.booking_id, 10) || 0;
                                            return aid - bid;
                                        })
                                        .map((bk) => {
                                            const id = bk.id ?? bk.booking_id;
                                            let itemName = bk.rental_item_name || bk.rental_item?.name || 'Unknown Item';
                                            if (itemName === 'Unknown Item' && typeof bk.rental_item?.dynamic_data === 'string') {
                                                try { const dd = JSON.parse(bk.rental_item.dynamic_data); itemName = dd['Item Name'] || dd['name'] || itemName; } catch { }
                                            }
                                            const renterName = bk.renter?.name || bk.renter_username || 'Unknown';
                                            const price = bk.payment_amount ?? 0;
                                            const serviceFee = bk.service_fee ?? 0;
                                            const total = (bk.total_amount != null) ? bk.total_amount : (Number(price) + Number(serviceFee));
                                            // Prefer backend fields; if missing, attempt to derive from requirements_data
                                            let method = (bk.payment_method && String(bk.payment_method).trim()) ? bk.payment_method : '';
                                            let account = (bk.payment_account && String(bk.payment_account).trim()) ? bk.payment_account : '';
                                            if ((!method || !account) && bk.requirements_data) {
                                                try {
                                                    const rd = typeof bk.requirements_data === 'string' ? JSON.parse(bk.requirements_data) : bk.requirements_data;
                                                    if (rd && typeof rd === 'object') {
                                                        method = method || rd['payment_method'] || rd['Payment Method'] || rd['method'] || '';
                                                        account = account || rd['payment_account'] || rd['Payment Account'] || rd['account'] || '';
                                                    }
                                                } catch { }
                                            }
                                            if (!method) method = 'Not specified';
                                            if (!account) account = 'Not specified';
                                            const paymentStatus = bk.payment_status || 'PENDING';
                                            const dateStr = formatDate(bk.created_at);

                                            return (
                                                <tr key={id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">#{id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{itemName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{renterName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(price)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(serviceFee)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(total)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{method}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{account}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(paymentStatus)}`}>
                                                            {paymentStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{dateStr}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <Button
                                                            onClick={() => handleViewDetails(bk)}
                                                            variant="secondary"
                                                            size="sm"
                                                        >
                                                            View
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                                <div className="text-6xl mb-4">📋</div>
                                <h3 className="text-lg font-medium mb-2">No bookings found</h3>
                                <p className="text-sm">
                                    {filters.search || filters.status || filters.date
                                        ? 'Try adjusting your filters'
                                        : 'Get started by creating your first booking'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing page {pagination.currentPage} of {pagination.totalPages}
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage <= 1}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage >= pagination.totalPages}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingList;
