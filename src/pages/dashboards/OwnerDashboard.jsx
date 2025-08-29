import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { ownerApi } from '../../api/ownerApi';
import { formatCurrency, formatDate, getStatusColor } from '../../../utils/formatters';

// Utility function to safely render any value
const safeRender = (value, fallback = 'N/A') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'object') return fallback;
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
    }, [fetchDashboardData, fetchCategories]);

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
        recentBookings: Array.isArray(dashboardData.recentBookings) ? dashboardData.recentBookings : [],
        rentalItems: Array.isArray(dashboardData.rentalItems) ? dashboardData.rentalItems : [],
        payments: Array.isArray(dashboardData.payments) ? dashboardData.payments : [],
        acceptedBookings: Array.isArray(dashboardData.acceptedBookings) ? dashboardData.acceptedBookings : [],
        categoryStats: Array.isArray(dashboardData.categoryStats) ? dashboardData.categoryStats : [],
        stats: dashboardData.stats && typeof dashboardData.stats === 'object' ? dashboardData.stats : {},
        revenueBreakdown: dashboardData.revenueBreakdown && typeof dashboardData.revenueBreakdown === 'object' ? dashboardData.revenueBreakdown : null
    };



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
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{safeData.totalBookings}</p>
                                    {safeData.stats && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {safeData.stats.pendingBookings || 0} pending • {safeData.stats.completedBookings || 0} completed
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
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(safeData.totalRevenue)}</p>
                                    {safeData.stats && safeData.stats.completedBookings > 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Avg: {formatCurrency(safeData.totalRevenue / safeData.stats.completedBookings)}
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
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{safeData.totalItems}</p>
                                    {safeData.stats && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {safeData.stats.availableItems || 0} available • {safeData.stats.unavailableItems || 0} unavailable
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
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(safeData.heldPayments)}</p>
                                    {safeData.totalBookings > 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {parseFloat((safeData.heldPayments / safeData.totalBookings * 100)).toFixed(1)}% of total
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

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
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Renter</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {safeData.recentBookings && safeData.recentBookings.length > 0 ? (
                                                safeData.recentBookings.map((booking) => {
                                                    // Safety check - ensure booking is an object with required properties
                                                    if (!booking || typeof booking !== 'object') {

                                                        return null;
                                                    }

                                                    return (
                                                        <tr key={booking.id || Math.random()} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-10 w-10">
                                                                        <img className="h-10 w-10 rounded-full object-cover" src={booking.rental_item?.image_url || '/placeholder-item.jpg'} alt="Item" />
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                            {typeof booking.rental_item?.name === 'string' ? booking.rental_item.name : 'Unknown Item'}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500 dark:text-gray-400">ID: {booking.rental_item?.id || 'N/A'}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900 dark:text-white">
                                                                    {typeof booking.renter?.name === 'string' ? booking.renter.name : 'Unknown'}
                                                                </div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">{booking.renter?.email || 'N/A'}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                {formatDate(booking.created_at)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                                {formatCurrency(booking.total_amount || 0)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                                                    {typeof booking.status === 'string' ? booking.status : 'Unknown'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                {typeof booking.status === 'string' && booking.status === 'Pending' && (
                                                                    <div className="flex space-x-2">
                                                                        <button
                                                                            onClick={() => handleAcceptBooking(booking.id)}
                                                                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                                        >
                                                                            Accept
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                const reason = prompt('Please provide a reason for rejection:');
                                                                                if (reason) handleRejectBooking(booking.id, reason);
                                                                            }}
                                                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                        No recent bookings found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rental Items by Category */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Rental Items</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Manage your rental items and add new ones
                                    </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => setShowRentalItems(!showRentalItems)}
                                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
                                    >
                                        {showRentalItems ? '👁️ Hide' : '👁️ Show'}
                                    </button>
                                    <button
                                        onClick={() => navigate('/owner/items')}
                                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        View All Items
                                    </button>
                                </div>
                            </div>
                        </div>
                        {showRentalItems && (
                            <>
                                {showAddItem && (
                                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Select Category for New Item</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {categories.map((category) => (
                                                <button
                                                    key={category.id}
                                                    onClick={() => handleCategorySelect(category.id)}
                                                    className="p-3 text-center bg-white dark:bg-gray-600 rounded-lg border-2 border-gray-200 dark:border-gray-500 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors"
                                                >
                                                    <div className="text-lg mb-1">{category.icon || '📦'}</div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{category.name}</div>
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setShowAddItem(false)}
                                            className="mt-3 px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                <div className="p-6">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price/Day</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {safeData.rentalItems && safeData.rentalItems.length > 0 ? (
                                                    safeData.rentalItems.map((item) => (
                                                        <tr key={item.id || Math.random()} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-10 w-10">
                                                                        <img className="h-10 w-10 rounded-full object-cover" src={item.image_url || '/placeholder-item.jpg'} alt="Item" />
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                            {typeof item.name === 'string' ? item.name : 'Unknown Item'}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500 dark:text-gray-400">ID: {item.id || 'N/A'}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                                {item.category?.name || 'Unknown'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                                {formatCurrency(item.price_per_day || 0)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.availability_status === 'Available' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                                    item.availability_status === 'Rented' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                                                    }`}>
                                                                    {typeof item.availability_status === 'string' ? item.availability_status : 'Unknown'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                <button
                                                                    onClick={() => navigate(`/owner/items/${item.id}`)}
                                                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                                >
                                                                    View Details
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                            No rental items found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Payment History */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment History</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Track your earnings and payment status
                                    </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => setShowPayments(!showPayments)}
                                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
                                    >
                                        {showPayments ? '👁️ Hide' : '👁️ Show'}
                                    </button>
                                    <button
                                        onClick={() => navigate('/owner/payments')}
                                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        View All Payments
                                    </button>
                                </div>
                            </div>
                        </div>
                        {showPayments && (
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Booking</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Service Fee</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {safeData.payments && safeData.payments.length > 0 ? (
                                                safeData.payments.map((payment) => (
                                                    <tr key={payment.id || Math.random()} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">Booking #{payment.booking_id}</div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">{payment.rental_item?.name || 'Unknown Item'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                            {formatCurrency(payment.amount || 0)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                            {formatCurrency(payment.service_fee || 0)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                                payment.status === 'HELD' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                                    payment.status === 'PENDING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                                                }`}>
                                                                {typeof payment.status === 'string' ? payment.status : 'Unknown'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                            {formatDate(payment.created_at)}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                        No payment history found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Accepted Bookings - Confirm Delivery */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        📦 Accepted Bookings - Confirm Delivery
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        These bookings have been accepted and need delivery confirmation
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAcceptedBookings(!showAcceptedBookings)}
                                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
                                >
                                    {showAcceptedBookings ? '👁️ Hide' : '👁️ Show'}
                                </button>
                            </div>
                        </div>
                        {showAcceptedBookings && (
                            <div className="p-6">
                                <div className="space-y-4">
                                    {safeData.acceptedBookings && safeData.acceptedBookings.length > 0 ? (
                                        safeData.acceptedBookings.map((booking) => (
                                            <div key={booking.id || Math.random()} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <div className="flex items-center space-x-4">
                                                    <img
                                                        src={booking.rental_item?.image_url || '/placeholder-item.jpg'}
                                                        alt="Item"
                                                        className="h-12 w-12 rounded-lg object-cover"
                                                    />
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                                            {typeof booking.rental_item?.name === 'string' ? booking.rental_item.name : 'Unknown Item'}
                                                        </h4>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            Rented by {typeof booking.renter?.name === 'string' ? booking.renter.name : 'Unknown'} • {formatDate(booking.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleConfirmDelivery(booking.id)}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500"
                                                >
                                                    Confirm Delivery
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                            No accepted bookings waiting for delivery confirmation
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Category Statistics */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {safeData.categoryStats && safeData.categoryStats.length > 0 ? (
                                        safeData.categoryStats.map((stat) => (
                                            <div key={stat.category_id || Math.random()} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.total_items || 0}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.category_name || 'Unknown Category'}</div>
                                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                    {stat.total_bookings || 0} bookings • {formatCurrency(stat.total_revenue || 0)} revenue
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-3 text-center text-gray-500 dark:text-gray-400 py-8">
                                            No category statistics available
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>


                </div>
            </div>
        );
    } catch (error) {
        console.error('❌ Dashboard rendering error:', error);
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

