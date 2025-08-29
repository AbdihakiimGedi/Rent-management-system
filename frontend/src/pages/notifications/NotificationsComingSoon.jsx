import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';

const NotificationsComingSoon = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    {/* Coming Soon Icon */}
                    <div className="text-purple-500 mb-6">
                        <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5v-5zM4.5 19.5a2.5 2.5 0 01-2.5-2.5V9a2.5 2.5 0 012.5-2.5h1.5a2.5 2.5 0 012.5-2.5h7a2.5 2.5 0 012.5 2.5v1.5a2.5 2.5 0 002.5 2.5h1.5a2.5 2.5 0 012.5 2.5v7a2.5 2.5 0 01-2.5 2.5h-1.5a2.5 2.5 0 01-2.5-2.5v-1.5a2.5 2.5 0 00-2.5-2.5h-7a2.5 2.5 0 00-2.5 2.5v1.5a2.5 2.5 0 01-2.5 2.5h-1.5z" />
                        </svg>
                    </div>

                    {/* Main Content */}
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                        Notifications Center
                    </h1>

                    <div className="text-6xl font-bold text-purple-600 mb-6">
                        Coming Soon
                    </div>

                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        We're building a smart notification system to keep you updated on all important activities.
                        Stay informed about bookings, payments, and system updates in real-time.
                    </p>

                    {/* Features Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                            <div className="text-purple-500 mb-3">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5a2.5 2.5 0 01-2.5-2.5V9a2.5 2.5 0 012.5-2.5h1.5a2.5 2.5 0 012.5-2.5h7a2.5 2.5 0 012.5 2.5v1.5a2.5 2.5 0 002.5 2.5h1.5a2.5 2.5 0 012.5 2.5v7a2.5 2.5 0 01-2.5 2.5h-1.5a2.5 2.5 0 01-2.5-2.5v-1.5a2.5 2.5 0 00-2.5-2.5h-7a2.5 2.5 0 00-2.5 2.5v1.5a2.5 2.5 0 01-2.5 2.5h-1.5z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-purple-800 mb-2">Real-time Alerts</h3>
                            <p className="text-purple-700 text-sm">Instant notifications for all activities</p>
                        </div>

                        <div className="bg-pink-50 rounded-lg p-6 border border-pink-200">
                            <div className="text-pink-500 mb-3">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-pink-800 mb-2">Smart Filtering</h3>
                            <p className="text-pink-700 text-sm">Organize notifications by type and priority</p>
                        </div>

                        <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
                            <div className="text-indigo-500 mb-3">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-indigo-800 mb-2">Scheduled Updates</h3>
                            <p className="text-indigo-700 text-sm">Get updates at your preferred times</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Development Progress</span>
                            <span>60%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-purple-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: '60%' }}></div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            onClick={() => navigate(-1)}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3"
                        >
                            Go Back
                        </Button>

                        <Button
                            onClick={() => navigate('/dashboard')}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
                        >
                            Back to Dashboard
                        </Button>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <p className="text-gray-500 text-sm">
                            Expected Release: <span className="font-semibold text-purple-600">Q2 2025</span>
                        </p>
                        <p className="text-gray-400 text-xs mt-2">
                            Stay tuned for updates and early access notifications
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationsComingSoon;



