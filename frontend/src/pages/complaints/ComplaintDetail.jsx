import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { complaintApi } from '../../api/complaintApi';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const ComplaintDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addNotification } = useNotification();
    const { t } = useLanguage();

    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchComplaint();
    }, [id]);

    const fetchComplaint = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await complaintApi.getComplaint(id);
            setComplaint(response.complaint);
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                if (status === 401) {
                    addNotification('Authentication failed. Please log in again.', 'error');
                    navigate('/login');
                } else if (status === 403) {
                    setError('You are not authorized to view this complaint.');
                } else if (status === 404) {
                    setError('Complaint not found.');
                } else if (status >= 500) {
                    setError('Server error. Please try again later.');
                } else {
                    setError('Error fetching complaint. Please try again.');
                }
            } else if (error.request) {
                setError('No response from server. Please check your internet connection.');
            } else {
                setError('Error fetching complaint. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'Resolved': 'bg-green-100 text-green-800 border-green-200',
            'Rejected': 'bg-red-100 text-red-800 border-red-200'
        };

        return (
            <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                {status}
            </span>
        );
    };

    const getTypeBadge = (type) => {
        const typeClasses = {
            'Owner': 'bg-blue-100 text-blue-800 border-blue-200',
            'Renter': 'bg-purple-100 text-purple-800 border-purple-200',
            'Other': 'bg-gray-100 text-gray-800 border-gray-200'
        };

        return (
            <span className={`px-3 py-1 text-sm font-medium rounded-full border ${typeClasses[type] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                {type}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="text-red-500 mb-4">
                            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="flex gap-4 justify-center">
                            <Button
                                onClick={() => navigate('/complaints')}
                                className="bg-gray-500 hover:bg-gray-600 text-white"
                            >
                                Back to Complaints
                            </Button>
                            <Button
                                onClick={fetchComplaint}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Complaint Not Found</h2>
                        <p className="text-gray-600 mb-6">The complaint you're looking for doesn't exist or has been removed.</p>
                        <Button
                            onClick={() => navigate('/complaints')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Back to Complaints
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Complaint Details</h1>
                            <p className="text-gray-600">View detailed information about this complaint</p>
                        </div>
                        <div className="flex gap-3 mt-4 sm:mt-0">
                            <Button
                                onClick={() => navigate('/complaints')}
                                className="bg-gray-500 hover:bg-gray-600 text-white"
                            >
                                Back to Complaints
                            </Button>
                            {complaint.status === 'Pending' && (
                                <Button
                                    onClick={() => navigate(`/complaints/${id}/edit`)}
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                >
                                    Edit Complaint
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Complaint Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Status and Type */}
                            <div className="flex flex-wrap gap-3 items-center">
                                <span className="text-sm text-gray-500">#{complaint.id}</span>
                                {getTypeBadge(complaint.complaint_type)}
                                {getStatusBadge(complaint.status)}
                            </div>

                            {/* Description */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Complaint Description</h3>
                                <p className="text-gray-700 leading-relaxed">{complaint.description}</p>
                            </div>

                            {/* Admin Notes */}
                            {complaint.admin_notes && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-blue-800 mb-3">Admin Notes</h3>
                                    <p className="text-blue-700 leading-relaxed">{complaint.admin_notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Booking Information */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Information</h3>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Booking ID:</span>
                                        <p className="text-gray-800">#{complaint.booking_id}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Rental Item:</span>
                                        <p className="text-gray-800">{complaint.booking?.rental_item_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Booking Status:</span>
                                        <p className="text-gray-800">{complaint.booking?.status || 'N/A'}</p>
                                    </div>
                                    {complaint.booking?.total_amount && (
                                        <div>
                                            <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                                            <p className="text-gray-800">${complaint.booking.total_amount}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* People Involved */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">People Involved</h3>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Complainant:</span>
                                        <p className="text-gray-800">{complaint.complainant?.username || 'N/A'}</p>
                                        <p className="text-sm text-gray-500">{complaint.complainant?.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Defendant:</span>
                                        <p className="text-gray-800">{complaint.defendant?.username || 'N/A'}</p>
                                        <p className="text-sm text-gray-500">{complaint.defendant?.email || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Timeline</h3>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Created:</span>
                                        <p className="text-gray-800">{new Date(complaint.created_at).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                                        <p className="text-gray-800">{new Date(complaint.updated_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplaintDetail;




