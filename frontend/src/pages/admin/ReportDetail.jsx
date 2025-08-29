import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const ReportDetail = () => {
    const { reportType } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addNotification } = useNotification();
    const { user, isAuthenticated } = useAuth();

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        // Check if user is authenticated and is admin
        if (!isAuthenticated) {
            addNotification('Please login to access reports', 'error');
            navigate('/login');
            return;
        }

        if (user?.role !== 'admin') {
            addNotification('Admin access required', 'error');
            navigate('/dashboard');
            return;
        }

        // Always use the data passed from Reports component
        if (location.state?.reportData) {
            setReportData(location.state.reportData);
            setLoading(false);
        } else {
            // If no data in state, redirect back to reports
            addNotification('No report data available', 'error');
            navigate('/admin/reports');
        }
    }, [reportType, location.state, isAuthenticated, user, navigate, addNotification]);

    // Remove fetchReportData function since we're using passed data



    const renderSystemOverview = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">System Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {reportData.system_stats && Object.entries(reportData.system_stats).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                                {key.replace(/_/g, ' ')}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {typeof value === 'number' ? value.toLocaleString() : value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {reportData.recent_bookings && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Bookings</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Renter</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Owner</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {reportData.recent_bookings.map((booking, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{booking.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{booking.renter}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{booking.owner}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{booking.rental_item}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${booking.amount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${booking.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{booking.created_at}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    const renderUserAnalytics = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Users by Role</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {reportData.users_by_role && Object.entries(reportData.users_by_role).map(([role, count]) => (
                        <div key={role} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">{role}</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">User Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {reportData.user_status && Object.entries(reportData.user_status).map(([status, count]) => (
                        <div key={status} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">{status}</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderBookingAnalytics = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Bookings by Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {reportData.bookings_by_status && Object.entries(reportData.bookings_by_status).map(([status, count]) => (
                        <div key={status} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">{status}</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Monthly Trends</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bookings</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {reportData.monthly_trends && reportData.monthly_trends.map((trend, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{trend.month}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{trend.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderEarningsSummary = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Earnings Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">Total Payment</div>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">${reportData.total_payment?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Service Fees</div>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">${reportData.total_service_fee?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                        <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Net Earnings</div>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">${reportData.net_earnings?.toFixed(2) || '0.00'}</div>
                    </div>
                </div>
            </div>

            {reportData.bookings && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Booking ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Renter</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Service Fee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Net Owner</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {reportData.bookings.slice(0, 10).map((booking, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{booking['Booking ID']}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{booking['Renter']}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${booking['Payment']}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${booking['Service Fee']}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${booking['Net Owner']}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${booking['Payment Status'] === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {booking['Payment Status']}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    const renderReportContent = () => {
        if (!reportData) return null;

        switch (reportType) {
            case 'system':
                return renderSystemOverview();
            case 'users':
                return renderUserAnalytics();
            case 'bookings':
                return renderBookingAnalytics();
            case 'earnings':
                return renderEarningsSummary();
            case 'completed':
                return (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Completed Bookings Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                                    <div className="text-sm font-medium text-green-600 dark:text-green-400">Total Completed</div>
                                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">{reportData.total || reportData.bookings?.length || 0}</div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Revenue</div>
                                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">${reportData.total_revenue?.toFixed(2) || '0.00'}</div>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                                    <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Average Amount</div>
                                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">${reportData.average_amount?.toFixed(2) || '0.00'}</div>
                                </div>
                            </div>
                        </div>

                        {reportData.bookings && reportData.bookings.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Completed Bookings</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Booking ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Renter</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Completed Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {reportData.bookings.slice(0, 10).map((booking, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                        {booking.id || booking['Booking ID'] || `#${index + 1}`}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                        {booking.renter || booking['Renter'] || 'Unknown'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                        {booking.rental_item || booking['Rental Item'] || 'Unknown'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                        ${booking.amount || booking['Payment'] || '0.00'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                        {booking.completed_at || booking['Created At'] || 'Unknown'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {(!reportData.bookings || reportData.bookings.length === 0) && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <div className="text-center py-8">
                                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Completed Bookings</h3>
                                    <p className="text-gray-500 dark:text-gray-400">There are no completed bookings to display at the moment.</p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'custom':
                return (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">System Overview</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Users</div>
                                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{reportData.system_stats?.total_users || 0}</div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                                    <div className="text-sm font-medium text-green-600 dark:text-green-400">Total Bookings</div>
                                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">{reportData.system_stats?.total_bookings || 0}</div>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                                    <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Revenue</div>
                                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">${reportData.system_stats?.total_revenue?.toFixed(2) || '0.00'}</div>
                                </div>
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                                    <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Active Items</div>
                                    <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{reportData.system_stats?.total_items || 0}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button
                                    onClick={() => navigate('/admin/reports/system')}
                                    variant="outline"
                                    size="lg"
                                    className="w-full"
                                >
                                    View System Overview
                                </Button>
                                <Button
                                    onClick={() => navigate('/admin/reports/users')}
                                    variant="outline"
                                    size="lg"
                                    className="w-full"
                                >
                                    View User Analytics
                                </Button>
                                <Button
                                    onClick={() => navigate('/admin/reports/bookings')}
                                    variant="outline"
                                    size="lg"
                                    className="w-full"
                                >
                                    View Booking Analytics
                                </Button>
                                <Button
                                    onClick={() => navigate('/admin/reports/earnings')}
                                    variant="outline"
                                    size="lg"
                                    className="w-full"
                                >
                                    View Earnings Summary
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <p className="text-gray-600 dark:text-gray-400">Report data not available</p>
                    </div>
                );
        }
    };

    // Check if user is authenticated and is admin
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-800">
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Authentication Required</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Please login to access the reports.</p>
                        <Button onClick={() => navigate('/login')} variant="primary">
                            Go to Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-800">
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Admin privileges required to view reports.</p>
                        <Button onClick={() => navigate('/dashboard')} variant="primary">
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="flex justify-center items-center min-h-[400px]">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Detailed analysis and insights
                            </p>
                        </div>


                        <Button
                            onClick={() => navigate('/admin/reports')}
                            variant="outline"
                            size="lg"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Reports
                        </Button>
                    </div>
                </div>
            </div>



            {/* Report Content */}
            {renderReportContent()}
        </div>
    );
};

export default ReportDetail;
