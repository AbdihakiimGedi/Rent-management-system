import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { ownerApi } from '../api/ownerApi';
import { paymentApi } from '../api/paymentApi';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';

// Utility function to safely render any value
const safeRender = (value, fallback = 'N/A') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'object') return fallback;
    return fallback;
};

// Utility function specifically for JSX rendering
const safeJSXValue = (value, fallback = 'N/A') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'object') {
        // Try to extract meaningful information from objects
        if (value.name) return value.name;
        if (value.title) return value.title;
        if (value.id !== undefined) return String(value.id);
        if (value.toString) return value.toString();
        return fallback;
    }
    return fallback;
};

const OwnerDashboard = () => {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const navigate = useNavigate();

    const [dashboardData, setDashboardData] = useState({
        totalBookings: 0,
        totalRevenue: 0,
        totalItems: 0,
        heldPayments: 0,
        recentBookings: [],
        rentalItems: [],
        payments: [],
        acceptedBookings: [],
        categoryStats: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddItem, setShowAddItem] = useState(false);
    const [categories, setCategories] = useState([]);
    const [ownerPayments, setOwnerPayments] = useState([]);
    const [ownerPaymentsLoading, setOwnerPaymentsLoading] = useState(false);
    const [ownerPaymentsError, setOwnerPaymentsError] = useState(null);

    // Owner items table pagination state
    const [ownerItems, setOwnerItems] = useState([]);
    const [ownerItemsAll, setOwnerItemsAll] = useState([]);
    const [ownerItemsLoading, setOwnerItemsLoading] = useState(false);
    const [ownerItemsError, setOwnerItemsError] = useState(null);
    const [itemsPage, setItemsPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [itemsTotalPages, setItemsTotalPages] = useState(1);

    // Show/Hide states for tables
    const [showRecentBookings, setShowRecentBookings] = useState(true);
    const [showRentalItems, setShowRentalItems] = useState(true);
    const [showPayments, setShowPayments] = useState(true);
    const [showAcceptedBookings, setShowAcceptedBookings] = useState(true);
    const [showCategoryStats, setShowCategoryStats] = useState(true);

    // Fetch dashboard data with proper error handling
    const fetchDashboardData = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);


            const response = await ownerApi.getDashboardData();


            if (response.data) {


                // Validate the data structure before setting it
                try {
                    // Check if any property is an object that shouldn't be
                    const validatedData = { ...response.data };

                    // Ensure arrays are actually arrays
                    if (!Array.isArray(validatedData.recentBookings)) {

                        validatedData.recentBookings = [];
                    }
                    if (!Array.isArray(validatedData.rentalItems)) {

                        validatedData.rentalItems = [];
                    }
                    if (!Array.isArray(validatedData.payments)) {

                        validatedData.payments = [];
                    }
                    if (!Array.isArray(validatedData.acceptedBookings)) {

                        validatedData.acceptedBookings = [];
                    }
                    if (!Array.isArray(validatedData.categoryStats)) {

                        validatedData.categoryStats = [];
                    }

                    setDashboardData(validatedData);
                } catch (validationError) {

                    setError('Invalid data structure received from server');
                }
            } else {

                setError('No data received from server');
            }
        } catch (error) {

            setError('Failed to fetch dashboard data. Please try again.');
            addNotification('Error fetching dashboard data', 'error');

            // Set fallback data for demo purposes
            setDashboardData({
                totalBookings: 0,
                totalRevenue: 0,
                totalItems: 0,
                heldPayments: 0,
                recentBookings: [],
                rentalItems: [],
                payments: [],
                acceptedBookings: [],
                categoryStats: []
            });
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    // Fetch categories with error handling
    const fetchCategories = useCallback(async () => {
        try {

            const response = await ownerApi.getCategories();


            if (response.data && response.data.categories) {

                setCategories(response.data.categories);
            } else {

                // Set fallback categories for demo
                setCategories([
                    { id: 1, name: 'Electronics', icon: '📱' },
                    { id: 2, name: 'Tools', icon: '🔧' },
                    { id: 3, name: 'Sports', icon: '⚽' },
                    { id: 4, name: 'Party', icon: '🎉' }
                ]);
            }
        } catch (error) {

            addNotification('Error fetching categories', 'error');

            // Set fallback categories for demo
            setCategories([
                { id: 1, name: 'Electronics', icon: '📱' },
                { id: 2, name: 'Tools', icon: '🔧' },
                { id: 3, name: 'Sports', icon: '⚽' },
                { id: 4, name: 'Party', icon: '🎉' }
            ]);
        }
    }, [addNotification]);

    // Fetch paginated owner items for the table
    const fetchOwnerItems = useCallback(async (page) => {
        try {
            setOwnerItemsError(null);
            setOwnerItemsLoading(true);

            // Fetch ALL owner items, then paginate client-side for exact match with backend
            const response = await ownerApi.getRentalItems();

            let items = [];
            let totalPages = 1;

            if (response && response.data) {
                if (Array.isArray(response.data.rental_items)) {
                    items = response.data.rental_items;
                } else if (Array.isArray(response.data.items)) {
                    items = response.data.items;
                } else if (Array.isArray(response.data.data)) {
                    items = response.data.data;
                } else if (Array.isArray(response.data)) {
                    items = response.data;
                }
            }

            // Sanitize items minimally
            const sanitized = items.filter((item) => item && typeof item === 'object');
            const sortedAsc = sanitized.slice().sort((a, b) => {
                const aid = typeof a.id === 'number' ? a.id : parseInt(a.id, 10) || 0;
                const bid = typeof b.id === 'number' ? b.id : parseInt(b.id, 10) || 0;
                return aid - bid;
            });
            setOwnerItemsAll(sortedAsc);
            const effectiveTotalPages = Math.max(1, Math.ceil(sortedAsc.length / itemsPerPage));
            setItemsTotalPages(effectiveTotalPages);
            const currentPage = page || itemsPage;
            const startIdx = (currentPage - 1) * itemsPerPage;
            const endIdx = startIdx + itemsPerPage;
            setOwnerItems(sortedAsc.slice(startIdx, endIdx));
        } catch (e) {
            setOwnerItemsError('Failed to load items');
            setOwnerItems([]);
        } finally {
            setOwnerItemsLoading(false);
        }
    }, [itemsPerPage, itemsPage]);

    // Fetch payment history for current user (owner)
    const fetchOwnerPayments = useCallback(async () => {
        try {
            setOwnerPaymentsError(null);
            setOwnerPaymentsLoading(true);
            const response = await paymentApi.getMyPayments();
            let payments = [];
            if (response && response.data) {
                if (Array.isArray(response.data.payments)) {
                    payments = response.data.payments;
                } else if (Array.isArray(response.data)) {
                    payments = response.data;
                }
            }
            const sanitized = payments.filter(p => p && typeof p === 'object');
            // Sort ascending by booking_id
            sanitized.sort((a, b) => {
                const aid = typeof a.booking_id === 'number' ? a.booking_id : parseInt(a.booking_id, 10) || 0;
                const bid = typeof b.booking_id === 'number' ? b.booking_id : parseInt(b.booking_id, 10) || 0;
                return aid - bid;
            });
            setOwnerPayments(sanitized);
        } catch (e) {
            setOwnerPaymentsError('Failed to load payments');
            setOwnerPayments([]);
        } finally {
            setOwnerPaymentsLoading(false);
        }
    }, []);

    // Handle booking acceptance
    const handleAcceptBooking = async (bookingId) => {
        try {

            await ownerApi.acceptBooking(bookingId);

            addNotification('Booking accepted successfully', 'success');
            fetchDashboardData();
        } catch (error) {

            addNotification('Error accepting booking', 'error');
        }
    };

    // Handle booking rejection
    const handleRejectBooking = async (bookingId, reason) => {
        if (!reason || reason.trim() === '') {
            addNotification('Please provide a reason for rejection', 'error');
            return;
        }

        try {

            await ownerApi.rejectBooking(bookingId, reason);

            addNotification('Booking rejected successfully', 'success');
            fetchDashboardData();
        } catch (error) {

            addNotification('Error rejecting booking', 'error');
        }
    };

    // Handle delivery confirmation
    const handleConfirmDelivery = async (bookingId) => {
        try {

            await ownerApi.confirmDelivery(bookingId);

            addNotification('Delivery confirmed successfully', 'success');
            fetchDashboardData();
        } catch (error) {

            addNotification('Error confirming delivery', 'error');
        }
    };

    // Handle category selection for new item
    const handleCategorySelect = (categoryId) => {
        navigate('/owner/items/add', { state: { categoryId } });
    };

    // Refresh data manually
    const handleRefresh = () => {

        setLoading(true);
        fetchDashboardData();
    };

    // Initialize data on component mount
    useEffect(() => {
        fetchDashboardData();
        fetchCategories();
        fetchOwnerItems(1);
        fetchOwnerPayments();
        // Intentionally empty deps to avoid refetch loops; the fetchers are stable enough for initial load
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Refetch when page changes
    useEffect(() => {
        // Re-slice client-side when page changes
        const startIdx = (itemsPage - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        setOwnerItems(ownerItemsAll.slice(startIdx, endIdx));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemsPage, ownerItemsAll]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Dashboard Error</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Safety check - prevent rendering if dashboardData is corrupted
    if (!dashboardData || typeof dashboardData !== 'object') {

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Dashboard Error</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Dashboard data is corrupted. Please refresh the page.</p>
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Refresh Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Additional safety check - ensure all required properties exist and are safe
    const safeData = {
        totalBookings: safeRender(dashboardData.totalBookings, 0),
        totalRevenue: safeRender(dashboardData.totalRevenue, 0),
        totalItems: safeRender(dashboardData.totalItems, 0),
        heldPayments: safeRender(dashboardData.heldPayments, 0),
        recentBookings: Array.isArray(dashboardData.recentBookings) ? dashboardData.recentBookings.filter(booking =>
            booking && typeof booking === 'object' &&
            typeof booking.id !== 'object' &&
            typeof booking.status !== 'object' &&
            typeof booking.created_at !== 'object'
        ) : [],
        rentalItems: Array.isArray(dashboardData.rentalItems) ? dashboardData.rentalItems.filter(item =>
            item && typeof item === 'object' &&
            typeof item.id !== 'object' &&
            typeof item.name !== 'object'
        ) : [],
        payments: Array.isArray(dashboardData.payments) ? dashboardData.payments.filter(payment =>
            payment && typeof payment === 'object' &&
            typeof payment.id !== 'object' &&
            typeof payment.status !== 'object'
        ) : [],
        acceptedBookings: Array.isArray(dashboardData.acceptedBookings) ? dashboardData.acceptedBookings.filter(booking =>
            booking && typeof booking === 'object' &&
            typeof booking.id !== 'object' &&
            typeof booking.status !== 'object' &&
            typeof booking.created_at !== 'object'
        ) : [],
        categoryStats: Array.isArray(dashboardData.categoryStats) ? dashboardData.categoryStats.filter(stat =>
            stat && typeof stat === 'object' &&
            typeof stat.category_id !== 'object' &&
            typeof stat.category_name !== 'object'
        ) : [],
        stats: dashboardData.stats && typeof dashboardData.stats === 'object' ? dashboardData.stats : {},
        revenueBreakdown: dashboardData.revenueBreakdown && typeof dashboardData.revenueBreakdown === 'object' ? dashboardData.revenueBreakdown : null
    };



    // Additional validation - ensure safeData is properly structured
    if (!safeData || typeof safeData !== 'object') {

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Dashboard Error</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Safe data is corrupted. Please refresh the page.</p>
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Refresh Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Check if any recent bookings contain objects that shouldn't be rendered
    if (safeData.recentBookings.length > 0) {

    }

    try {
        // Final safety check - ensure no objects are being rendered
        const renderSafeValue = (value, fallback = '') => {
            if (value === null || value === undefined) return fallback;
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
            if (Array.isArray(value)) return value.length;

            return fallback;
        };

        // Additional safety function for booking objects
        const safeBooking = (booking) => {
            if (!booking || typeof booking !== 'object') return null;

            // Normalize potential name sources
            let rentalItemName = '';
            if (booking.rental_item && typeof booking.rental_item === 'object') {
                rentalItemName = booking.rental_item.name || booking.rental_item.title || '';
                // Attempt to parse dynamic_data for name keys
                let dd = booking.rental_item.dynamic_data;
                if (!rentalItemName && dd) {
                    if (typeof dd === 'string') { try { dd = JSON.parse(dd); } catch { dd = null; } }
                    if (dd && typeof dd === 'object') {
                        rentalItemName = dd['Item Name'] || dd['name'] || dd['item_name'] || dd['title'] || '';
                    }
                }
            }
            if (!rentalItemName) {
                rentalItemName = booking.rental_item_name || '';
            }
            if (!rentalItemName && typeof booking.rental_item === 'string') {
                rentalItemName = booking.rental_item;
            }
            if (!rentalItemName) rentalItemName = 'Unknown Item';

            // Renter name normalization
            let renterName = '';
            if (booking.renter && typeof booking.renter === 'object') {
                renterName = booking.renter.name || booking.renter.username || '';
                if (!renterName && typeof booking.renter.email === 'string') {
                    renterName = booking.renter.email.split('@')[0];
                }
            }
            if (!renterName) renterName = booking.renter_username || '';
            if (!renterName) renterName = 'Unknown';

            // IDs
            const normalizedId = (typeof booking.id === 'string' || typeof booking.id === 'number') ? booking.id : (booking.booking_id || 'unknown');
            const rentalItemId = booking.rental_item?.id ?? booking.rental_item_id ?? 'unknown';

            // Amounts
            const totalAmount = (typeof booking.total_amount === 'number') ? booking.total_amount : (typeof booking.payment_amount === 'number' ? booking.payment_amount : 0);
            const serviceFee = (typeof booking.service_fee === 'number') ? booking.service_fee : (
                typeof booking.payment?.service_fee === 'number' ? booking.payment.service_fee : 0
            );

            // Image
            let imageUrl = booking.rental_item?.image_url || '/placeholder-item.jpg';
            if (booking.rental_item && typeof booking.rental_item.dynamic_data === 'string') {
                try {
                    const ddParsed = JSON.parse(booking.rental_item.dynamic_data);
                    imageUrl = ddParsed['Image URL'] || imageUrl;
                } catch { }
            }

            return {
                id: normalizedId,
                status: typeof booking.status === 'string' ? booking.status : 'Unknown',
                created_at: typeof booking.created_at === 'string' ? booking.created_at : (booking.created_at ? String(booking.created_at) : new Date().toISOString()),
                total_amount: totalAmount,
                service_fee: serviceFee,
                payment_status: typeof booking.payment_status === 'string' ? booking.payment_status : (booking.payment && typeof booking.payment.status === 'string' ? booking.payment.status : 'Unknown'),
                rental_item: {
                    name: rentalItemName,
                    image_url: imageUrl,
                    id: rentalItemId
                },
                renter: {
                    name: renterName,
                    email: (booking.renter && typeof booking.renter.email === 'string') ? booking.renter.email : 'N/A'
                }
            };
        };

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    Welcome back, {(user && (user.name || user.full_name || user.username || (typeof user.email === 'string' ? user.email.split('@')[0] : null))) || 'Owner'}! 👋
                                </h1>
                                <p className="mt-2 text-gray-600 dark:text-gray-400">
                                    Here's what's happening with your rental business today
                                </p>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 flex items-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>



                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Bookings */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Bookings</p>
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{safeJSXValue(safeData.totalBookings, 0)}</p>
                                    {safeData.stats && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {safeJSXValue(safeData.stats.pendingBookings, 0)} pending • {safeJSXValue(safeData.stats.completedBookings, 0)} completed
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Total Revenue */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(safeJSXValue(safeData.totalRevenue, 0))}</p>
                                    {safeData.stats && safeJSXValue(safeData.stats.completedBookings, 0) > 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Avg: {formatCurrency(safeJSXValue(safeData.totalRevenue, 0) / safeJSXValue(safeData.stats.completedBookings, 0))}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Total Items */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Items</p>
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{safeJSXValue(safeData.totalItems, 0)}</p>
                                    {safeData.stats && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {safeJSXValue(safeData.stats.availableItems, 0)} available • {safeJSXValue(safeData.stats.unavailableItems, 0)} unavailable
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Held Payments */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Held Payments</p>
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(safeJSXValue(safeData.heldPayments, 0))}</p>
                                    {safeJSXValue(safeData.totalBookings, 0) > 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {parseFloat((safeJSXValue(safeData.heldPayments, 0) / safeJSXValue(safeData.totalBookings, 0) * 100)).toFixed(1)}% of total
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Stats Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Pending Bookings */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                    <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Bookings</p>
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{safeData.stats?.pendingBookings || 0}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Awaiting approval</p>
                                </div>
                            </div>
                        </div>

                        {/* Accepted Bookings */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Accepted Bookings</p>
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{safeJSXValue(safeData.stats?.acceptedBookings, 0)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Ready for delivery</p>
                                </div>
                            </div>
                        </div>

                        {/* Completed Bookings */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Bookings</p>
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{safeJSXValue(safeData.stats?.completedBookings, 0)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Successfully finished</p>
                                </div>
                            </div>
                        </div>

                        {/* Available Items */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                                    <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-400">Available Items</p>
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{safeJSXValue(safeData.stats?.availableItems, 0)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Ready to rent</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Insights Section - Hidden */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8" style={{ display: 'none' }}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">💰 Revenue Insights</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Revenue Breakdown */}
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg">
                                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Revenue Breakdown</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-700 dark:text-blue-200">Total Revenue:</span>
                                        <span className="font-semibold text-blue-900 dark:text-blue-100">
                                            {formatCurrency(safeJSXValue(safeData.totalRevenue, 0))}
                                        </span>
                                    </div>
                                    {safeData.revenueBreakdown && (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-blue-700 dark:text-blue-200">Completed Payments:</span>
                                                <span className="font-semibold text-green-600 dark:text-green-400">
                                                    {formatCurrency(safeJSXValue(safeData.revenueBreakdown.completedPayments, 0))}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-blue-700 dark:text-blue-200">Pending Payments:</span>
                                                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                                                    {formatCurrency(safeJSXValue(safeData.revenueBreakdown.pendingPayments, 0))}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-blue-700 dark:text-blue-200">Held Payments:</span>
                                                <span className="font-semibold text-orange-600 dark:text-orange-400">
                                                    {formatCurrency(safeJSXValue(safeData.revenueBreakdown.heldPayments, 0))}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-blue-700 dark:text-blue-200">Failed Payments:</span>
                                                <span className="font-semibold text-red-600 dark:text-red-400">
                                                    {formatCurrency(safeJSXValue(safeData.revenueBreakdown.failedPayments, 0))}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-700">
                                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Potential:</span>
                                        <span className="font-bold text-lg text-blue-900 dark:text-blue-100">
                                            {formatCurrency(safeJSXValue(safeData.totalRevenue, 0) + safeJSXValue(safeData.heldPayments, 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Metrics */}
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-lg">
                                <h4 className="font-medium text-green-900 dark:text-green-100 mb-3">Performance Metrics</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-green-700 dark:text-green-200">Conversion Rate:</span>
                                        <span className="font-semibold text-green-900 dark:text-green-100">
                                            {safeJSXValue(safeData.totalBookings, 0) > 0
                                                ? `${Math.round((safeJSXValue(safeData.stats?.completedBookings, 0) / safeJSXValue(safeData.totalBookings, 0) * 100))}%`
                                                : '0%'
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-green-700 dark:text-green-200">Avg Revenue per Item:</span>
                                        <span className="font-semibold text-green-900 dark:text-green-100">
                                            {safeJSXValue(safeData.totalItems, 0) > 0
                                                ? formatCurrency(safeJSXValue(safeData.totalRevenue, 0) / safeJSXValue(safeData.totalItems, 0))
                                                : '$0.00'
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-green-700 dark:text-green-200">Items Utilization:</span>
                                        <span className="font-semibold text-green-900 dark:text-green-100">
                                            {safeJSXValue(safeData.totalItems, 0) > 0
                                                ? `${Math.round((safeJSXValue(safeData.stats?.availableItems, 0) / safeJSXValue(safeData.totalItems, 0) * 100))}%`
                                                : '0%'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Summary Statistics Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Business Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Revenue Analysis */}
                            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {safeJSXValue(safeData.totalRevenue, 0) > 0 ? formatCurrency(safeJSXValue(safeData.totalRevenue, 0)) : '$0.00'}
                                </div>
                                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Revenue</div>
                                {safeJSXValue(safeData.stats?.completedBookings, 0) > 0 && (
                                    <div className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                                        {safeJSXValue(safeData.stats.completedBookings, 0)} completed bookings
                                    </div>
                                )}
                            </div>

                            {/* Booking Success Rate */}
                            <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {safeJSXValue(safeData.totalBookings, 0) > 0
                                        ? `${Math.round((safeJSXValue(safeData.stats?.completedBookings, 0) / safeJSXValue(safeData.totalBookings, 0) * 100))}%`
                                        : '0%'
                                    }
                                </div>
                                <div className="text-sm text-green-600 dark:text-green-400 font-medium">Success Rate</div>
                                <div className="text-xs text-green-500 dark:text-green-300 mt-1">
                                    {safeJSXValue(safeData.stats?.completedBookings, 0)} of {safeJSXValue(safeData.totalBookings, 0)} bookings
                                </div>
                            </div>

                            {/* Item Utilization */}
                            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {safeJSXValue(safeData.totalItems, 0) > 0
                                        ? `${Math.round((safeJSXValue(safeData.stats?.availableItems, 0) / safeJSXValue(safeData.totalItems, 0) * 100))}%`
                                        : '0%'
                                    }
                                </div>
                                <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Item Utilization</div>
                                <div className="text-xs text-purple-500 dark:text-purple-300 mt-1">
                                    {safeJSXValue(safeData.stats?.availableItems, 0)} of {safeJSXValue(safeData.totalItems, 0)} items available
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category Performance Section */}
                    {safeData.categoryStats && safeData.categoryStats.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📈 Category Performance</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {safeData.categoryStats.map((category) => (
                                    <div key={category.category_id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                {typeof category.category_name === 'string' ? category.category_name : 'Unknown Category'}
                                            </h4>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {category.total_items} items
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-300">Bookings:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{category.total_bookings}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-300">Revenue:</span>
                                                <span className="font-medium text-green-600 dark:text-green-400">
                                                    {formatCurrency(category.total_revenue)}
                                                </span>
                                            </div>
                                            {category.total_bookings > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-300">Avg per booking:</span>
                                                    <span className="font-medium text-blue-600 dark:text-blue-400">
                                                        {formatCurrency(category.total_revenue / category.total_bookings)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Revenue Insights Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">💰 Revenue Insights</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Revenue Breakdown */}
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg">
                                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Revenue Breakdown</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-700 dark:text-blue-200">Total Revenue:</span>
                                        <span className="font-semibold text-blue-900 dark:text-blue-100">
                                            {formatCurrency(safeJSXValue(safeData.totalRevenue, 0))}
                                        </span>
                                    </div>
                                    {safeData.revenueBreakdown && (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-blue-700 dark:text-blue-200">Completed Payments:</span>
                                                <span className="font-semibold text-green-600 dark:text-green-400">
                                                    {formatCurrency(safeJSXValue(safeData.revenueBreakdown.completedPayments, 0))}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-blue-700 dark:text-blue-200">Pending Payments:</span>
                                                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                                                    {formatCurrency(safeJSXValue(safeData.revenueBreakdown.pendingPayments, 0))}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-blue-700 dark:text-blue-200">Held Payments:</span>
                                                <span className="font-semibold text-orange-600 dark:text-orange-400">
                                                    {formatCurrency(safeJSXValue(safeData.revenueBreakdown.heldPayments, 0))}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-blue-700 dark:text-blue-200">Failed Payments:</span>
                                                <span className="font-semibold text-red-600 dark:text-red-400">
                                                    {formatCurrency(safeJSXValue(safeData.revenueBreakdown.failedPayments, 0))}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-700">
                                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Potential:</span>
                                        <span className="font-bold text-lg text-blue-900 dark:text-blue-100">
                                            {formatCurrency(safeData.totalRevenue + safeData.heldPayments)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Metrics */}
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-lg">
                                <h4 className="font-medium text-green-900 dark:text-green-100 mb-3">Performance Metrics</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-green-700 dark:text-green-200">Conversion Rate:</span>
                                        <span className="font-semibold text-green-900 dark:text-green-100">
                                            {safeData.totalBookings > 0
                                                ? `${Math.round((safeData.stats?.completedBookings || 0) / safeData.totalBookings * 100)}%`
                                                : '0%'
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-green-700 dark:text-green-200">Avg Revenue per Item:</span>
                                        <span className="font-semibold text-green-900 dark:text-green-100">
                                            {safeData.totalItems > 0
                                                ? formatCurrency(safeData.totalRevenue / safeData.totalItems)
                                                : '$0.00'
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-green-700 dark:text-green-200">Items Utilization:</span>
                                        <span className="font-semibold text-green-900 dark:text-green-100">
                                            {safeData.totalItems > 0
                                                ? `${Math.round((safeData.stats?.availableItems || 0) / safeData.totalItems * 100)}%`
                                                : '0%'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Status Overview */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📋 Quick Status Overview</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg border border-yellow-200 dark:border-yellow-700">
                                <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                                    {safeJSXValue(safeData.stats?.pendingBookings, 0)}
                                </div>
                                <div className="text-xs text-yellow-600 dark:text-yellow-400">Pending</div>
                            </div>
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
                                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                    {safeJSXValue(safeData.stats?.acceptedBookings, 0)}
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-400">Accepted</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
                                <div className="text-lg font-bold text-green-700 dark:text-green-300">
                                    {safeJSXValue(safeData.stats?.completedBookings, 0)}
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400">Completed</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                                    {safeJSXValue(safeData.stats?.availableItems, 0)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Available</div>
                            </div>
                        </div>
                    </div>

                    {/* Add Item Category Selection */}
                    {showAddItem && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Select Category for New Item</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => handleCategorySelect(category.id)}
                                        className="p-4 text-center bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors"
                                    >
                                        <div className="text-2xl mb-2">{category.icon || '📦'}</div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{category.name}</div>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowAddItem(false)}
                                className="mt-4 px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* Recent Bookings */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Bookings</h3>
                                <button
                                    onClick={() => setShowRecentBookings(!showRecentBookings)}
                                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
                                >
                                    {showRecentBookings ? '👁️ Hide' : '👁️ Show'}
                                </button>
                            </div>
                        </div>
                        {showRecentBookings && (
                            <div className="p-6 overflow-x-auto">
                                {safeData.recentBookings && safeData.recentBookings.length > 0 ? (
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Booking ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Renter</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Service Fee</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {safeData.recentBookings.map((booking) => {
                                                const b = safeBooking(booking);
                                                if (!b) return null;
                                                return (
                                                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">#{b.id}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{b.rental_item.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{b.renter.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(b.total_amount)}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(b.service_fee)}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(b.created_at)}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => navigate(`/owner/bookings/${b.id}`, { state: { bookingData: b } })}
                                                                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                                                >
                                                                    View
                                                                </button>
                                                                {(String(b.payment_status).toUpperCase() === 'HELD' || /pending/i.test(String(b.status))) && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => navigate(`/owner/bookings/${b.id}/accept`)}
                                                                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                                                        >
                                                                            Accept
                                                                        </button>
                                                                        <button
                                                                            onClick={() => navigate(`/owner/bookings/${b.id}/reject`)}
                                                                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                        No recent bookings found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>



                    {/* Payment History */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment History</h3>
                                <button
                                    onClick={() => setShowPayments(!showPayments)}
                                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
                                >
                                    {showPayments ? '👁️ Hide' : '👁️ Show'}
                                </button>
                            </div>
                        </div>
                        {showPayments && (
                            <div className="p-6 overflow-x-auto">
                                {ownerPaymentsLoading ? (
                                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading payments...</div>
                                ) : ownerPaymentsError ? (
                                    <div className="text-center text-red-500 dark:text-red-400 py-8">{ownerPaymentsError}</div>
                                ) : ownerPayments && ownerPayments.length > 0 ? (
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Booking</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Service Fee</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {ownerPayments.map((p) => (
                                                <tr key={p.booking_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">#{p.booking_id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{p.rental_item_name || 'Unknown Item'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(p.payment_amount || 0)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(p.service_fee || 0)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(p.payment_status)}`}>
                                                            {p.payment_status || 'Unknown'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(p.created_at)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <button
                                                            onClick={() => navigate(`/payments/${p.booking_id}`, { state: { paymentData: p } })}
                                                            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                        No payment history found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>



                    {/* Category Statistics */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Category Performance</h3>
                                <button
                                    onClick={() => setShowCategoryStats(!showCategoryStats)}
                                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
                                >
                                    {showCategoryStats ? '👁️ Hide' : '👁️ Show'}
                                </button>
                            </div>
                        </div>
                        {showCategoryStats && (
                            <div className="p-6">
                                {safeData.categoryStats && safeData.categoryStats.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {safeData.categoryStats.map((stat) => {
                                            // Safety check for category stat object
                                            if (!stat || typeof stat !== 'object') {

                                                return null;
                                            }

                                            return (
                                                <div key={stat.category_id} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.total_items || 0}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {typeof stat.category_name === 'string' ? stat.category_name : 'Unknown Category'}
                                                    </div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                        {stat.total_bookings || 0} bookings • {formatCurrency(stat.total_revenue || 0)} revenue
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                        No category statistics available
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    } catch (error) {

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Dashboard Error</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">An error occurred while rendering the dashboard.</p>
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Refresh Dashboard
                    </button>
                </div>
            </div>
        );
    }
};

export default OwnerDashboard;
