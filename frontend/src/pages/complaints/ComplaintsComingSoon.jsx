import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';

const ComplaintsComingSoon = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    {/* Coming Soon Icon */}
                    <div className="text-blue-500 mb-6">
                        <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    {/* Main Content */}
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                        Complaints System
                    </h1>

                    <div className="text-6xl font-bold text-blue-600 mb-6">
                        Coming Soon
                    </div>

                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        We're working hard to bring you a powerful complaints management system.
                        Soon you'll be able to submit, track, and resolve issues with ease.
                    </p>

                    {/* Features Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                            <div className="text-blue-500 mb-3">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-blue-800 mb-2">Submit Complaints</h3>
                            <p className="text-blue-700 text-sm">Easy form to report issues and concerns</p>
                        </div>

                        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                            <div className="text-green-500 mb-3">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-green-800 mb-2">Track Status</h3>
                            <p className="text-green-700 text-sm">Monitor your complaint progress in real-time</p>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                            <div className="text-purple-500 mb-3">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-purple-800 mb-2">Admin Support</h3>
                            <p className="text-purple-700 text-sm">Get help from our support team</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Development Progress</span>
                            <span>75%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: '75%' }}></div>
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
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                        >
                            Back to Dashboard
                        </Button>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <p className="text-gray-500 text-sm">
                            Expected Release: <span className="font-semibold text-blue-600">Q1 2025</span>
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

export default ComplaintsComingSoon;



