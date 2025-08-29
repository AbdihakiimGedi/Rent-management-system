import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import DarkModeToggle from '../components/DarkModeToggle';

const LandingPage = () => {
    const { t } = useLanguage();
    const { isDarkMode } = useTheme();

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
            <div className="bg-white dark:bg-gray-900">
                {/* Header */}
                <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Logo */}
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                    {t('rentalManagement')}
                                </span>
                            </div>

                            {/* Right side controls */}
                            <div className="flex items-center space-x-4">
                                <LanguageSwitcher />
                                <DarkModeToggle />
                                <Link
                                    to="/login"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                >
                                    {t('login')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                        <div className="text-center">
                            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                                {t('rentalManagement')}
                            </h1>
                            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                                Streamline your rental business with our comprehensive management system.
                                Manage bookings, track payments, handle complaints, and generate detailed reports all in one place.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                >
                                    {t('register')}
                                </Link>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                >
                                    {t('login')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="py-24 bg-white dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                Powerful Features for Every Need
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300">
                                Everything you need to manage your rental business efficiently
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {t('bookings')}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Manage all your rental bookings with an intuitive calendar interface and automated notifications.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {t('payments')}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Track payments, generate invoices, and manage financial records with comprehensive reporting.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {t('complaints')}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Handle customer complaints efficiently with a structured workflow and resolution tracking.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {t('reports')}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Generate detailed reports and analytics to make informed business decisions.
                                </p>
                            </div>

                            {/* Feature 5 */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/20 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5a2.5 2.5 0 01-2.5-2.5V9a2.5 2.5 0 012.5-2.5h1.5a2.5 2.5 0 012.5-2.5h7a2.5 2.5 0 012.5 2.5v1.5a2.5 2.5 0 002.5 2.5h1.5a2.5 2.5 0 012.5 2.5v7a2.5 2.5 0 01-2.5 2.5h-1.5a2.5 2.5 0 01-2.5-2.5v-1.5a2.5 2.5 0 00-2.5-2.5h-7a2.5 2.5 0 00-2.5 2.5v1.5a2.5 2.5 0 01-2.5 2.5h-1.5z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {t('notifications')}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Stay updated with real-time notifications for bookings, payments, and important events.
                                </p>
                            </div>

                            {/* Feature 6 */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Secure & Reliable
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Enterprise-grade security with role-based access control and data encryption.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-indigo-600 dark:bg-indigo-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-white mb-4">
                                Ready to Get Started?
                            </h2>
                            <p className="text-xl text-indigo-100 mb-8">
                                Join thousands of rental businesses already using our platform
                            </p>
                            <Link
                                to="/register"
                                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors duration-200"
                            >
                                {t('register')} Now
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="bg-gray-900 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Rental Management</h3>
                                <p className="text-gray-400">
                                    Streamline your rental business with our comprehensive management system.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                    Features
                                </h4>
                                <ul className="space-y-2">
                                    <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Bookings</a></li>
                                    <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Payments</a></li>
                                    <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Reports</a></li>
                                    <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Analytics</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                    Support
                                </h4>
                                <ul className="space-y-2">
                                    <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Help Center</a></li>
                                    <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact Us</a></li>
                                    <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Documentation</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                    Company
                                </h4>
                                <ul className="space-y-2">
                                    <li><a href="#" className="text-gray-300 hover:text-white transition-colors">About</a></li>
                                    <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Privacy</a></li>
                                    <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Terms</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
                            <p>&copy; 2024 Rental Management System. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;



