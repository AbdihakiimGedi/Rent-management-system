import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../api/adminApi';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const Reports = () => {
    const navigate = useNavigate();
    const { addNotification } = useNotification();
    const { user, isAuthenticated } = useAuth();

    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState({
        systemOverview: null,
        userAnalytics: null,
        bookingAnalytics: null,
        earnings: null,
        completedBookings: null
    });

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

        fetchAllReports();
    }, [isAuthenticated, user, navigate, addNotification]);

    const fetchAllReports = async () => {
        try {
            setLoading(true);

            // Fetch all reports in parallel
            const [
                systemOverviewRes,
                userAnalyticsRes,
                bookingAnalyticsRes,
                earningsRes,
                completedBookingsRes
            ] = await Promise.all([
                adminApi.getSystemOverview(),
                adminApi.getUserAnalytics(),
                adminApi.getBookingAnalytics(),
                adminApi.getEarningsSummary({}),
                adminApi.getCompletedBookings({})
            ]);

            const reportsData = {
                systemOverview: systemOverviewRes.data || systemOverviewRes,
                userAnalytics: userAnalyticsRes.data || userAnalyticsRes,
                bookingAnalytics: bookingAnalyticsRes.data || bookingAnalyticsRes,
                earnings: earningsRes.data || earningsRes,
                completedBookings: completedBookingsRes.data || completedBookingsRes
            };

            setReports(reportsData);

        } catch (error) {
            console.error('Error fetching reports:', error);
            addNotification('Error fetching reports', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewReport = (reportType, reportData) => {
        // Navigate to report detail page with data
        navigate(`/admin/reports/${reportType}`, {
            state: { reportData, reportType }
        });
    };

    const getReportKey = (reportType) => {
        switch (reportType) {
            case 'system': return 'systemOverview';
            case 'users': return 'userAnalytics';
            case 'bookings': return 'bookingAnalytics';
            case 'earnings': return 'earnings';
            case 'completed': return 'completedBookings';
            default: return 'systemOverview';
        }
    };

    const getReportCard = (title, description, data, reportType, icon, color) => {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-l-4" style={{ borderLeftColor: color }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
                            <span className="text-2xl">{icon}</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    {data && (
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {typeof data === 'number' ? data.toLocaleString() :
                                typeof data === 'string' ? data :
                                    Array.isArray(data) ? `${data.length} items` :
                                        typeof data === 'object' ? 'Data Available' : 'Data Available'}
                        </div>
                    )}
                </div>

                <div className="flex space-x-2">
                    <Button
                        onClick={() => {
                            const dataToPass = reports[getReportKey(reportType)];
                            handleViewReport(reportType, dataToPass);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Report
                    </Button>
                </div>
            </div>
        );
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        System Reports
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Comprehensive system analytics and reports for administrators
                    </p>
                </div>

                {/* Reports Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* System Overview */}
                    {getReportCard(
                        "System Overview",
                        "Complete system statistics and metrics",
                        reports.systemOverview?.system_stats?.total_users || 0,
                        "system",
                        "📊",
                        "#3B82F6"
                    )}

                    {/* User Analytics */}
                    {getReportCard(
                        "User Analytics",
                        "User statistics and role distribution",
                        reports.userAnalytics?.users_by_role?.total || 0,
                        "users",
                        "👥",
                        "#10B981"
                    )}

                    {/* Booking Analytics */}
                    {getReportCard(
                        "Booking Analytics",
                        "Booking trends and status analysis",
                        reports.bookingAnalytics?.bookings_by_status?.total || 0,
                        "bookings",
                        "📅",
                        "#F59E0B"
                    )}

                    {/* Earnings Summary */}
                    {getReportCard(
                        "Earnings Summary",
                        "Revenue and payment analytics",
                        reports.earnings?.total_payment || 0,
                        "earnings",
                        "💰",
                        "#8B5CF6"
                    )}

                    {/* Completed Bookings */}
                    {getReportCard(
                        "Completed Bookings",
                        "Successfully completed rental transactions",
                        reports.completedBookings?.total || reports.completedBookings?.bookings?.length || 0,
                        "completed",
                        "✅",
                        "#06B6D4"
                    )}

                    {/* Custom Reports */}
                    {getReportCard(
                        "Custom Reports",
                        "Generate custom reports with filters",
                        reports.systemOverview?.system_stats?.total_bookings || reports.bookingAnalytics?.bookings_by_status?.total || "Available",
                        "custom",
                        "🔧",
                        "#EF4444"
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                    <div className="flex flex-wrap gap-4">
                        <Button
                            onClick={() => navigate('/admin/dashboard')}
                            variant="outline"
                            size="lg"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;







