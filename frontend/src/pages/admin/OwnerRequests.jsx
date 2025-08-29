import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { adminApi } from '../../api/adminApi';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const OwnerRequests = () => {
    const { t } = useLanguage();
    const { addNotification } = useNotification();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchOwnerRequests();
    }, []);

    const fetchOwnerRequests = async () => {
        try {
            setLoading(true);
            const response = await adminApi.getPendingOwnerRequests();

            // Extract the actual data from Axios response
            const responseData = response.data || response;

            if (responseData && responseData.pending_requests) {
                setRequests(responseData.pending_requests);
            } else {
                setRequests([]);
            }
        } catch (error) {
            console.error('Error fetching owner requests:', error);
            addNotification('Error fetching owner requests', 'error');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredRequests = () => {
        if (statusFilter === 'all') {
            return requests;
        }
        return requests.filter(request => request.status === statusFilter);
    };

    const handleApprove = async (requestId) => {
        try {
            setActionLoading(true);
            await adminApi.updateOwnerRequest(requestId, { status: 'Approved' });
            addNotification('Owner request approved successfully', 'success');
            fetchOwnerRequests();
            setShowModal(false);
            setSelectedRequest(null);
        } catch (error) {
            console.error('Error approving request:', error);
            addNotification('Error approving request', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (requestId) => {
        if (!rejectionReason.trim()) {
            addNotification('Please provide a rejection reason', 'error');
            return;
        }

        try {
            setActionLoading(true);
            await adminApi.updateOwnerRequest(requestId, {
                status: 'Rejected',
                rejection_reason: rejectionReason.trim()
            });
            addNotification('Owner request rejected successfully', 'success');
            fetchOwnerRequests();
            setShowModal(false);
            setSelectedRequest(null);
            setRejectionReason('');
        } catch (error) {
            console.error('Error rejecting request:', error);
            addNotification('Error rejecting request', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const openModal = (request) => {
        setSelectedRequest(request);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedRequest(null);
        setRejectionReason('');
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'Approved': 'bg-green-100 text-green-800 border-green-200',
            'Rejected': 'bg-red-100 text-red-800 border-red-200'
        };

        return (
            <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                {status}
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Owner Requests</h1>
                            <p className="text-gray-600">Review and manage user requests to become owners</p>
                            {requests.length > 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Found {getFilteredRequests().length} request{getFilteredRequests().length !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                        <div className="flex space-x-3 mt-4 sm:mt-0">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                            <Button
                                onClick={fetchOwnerRequests}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {getFilteredRequests().length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {statusFilter === 'all' ? 'No Owner Requests' : `No ${statusFilter} Requests`}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {statusFilter === 'all'
                                    ? 'There are no owner requests in the system yet.'
                                    : `There are no ${statusFilter.toLowerCase()} owner requests at the moment.`
                                }
                            </p>
                            {statusFilter !== 'all' && (
                                <Button
                                    onClick={() => setStatusFilter('all')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    View All Requests
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Submitted
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Requirements
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {getFilteredRequests().map((request) => (
                                        <tr key={request.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {request.full_name || request.username || 'Unknown User'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        @{request.username}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {request.email}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {request.phone_number || 'No phone'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(request.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(request.submitted_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Button
                                                    onClick={() => openModal(request)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1"
                                                >
                                                    View Details
                                                </Button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {request.status === 'Pending' && (
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            onClick={() => handleApprove(request.id)}
                                                            disabled={actionLoading}
                                                            className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1"
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            onClick={() => openModal(request)}
                                                            className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1"
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for viewing request details and taking action */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Owner Request Details
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mb-6">
                                {/* Request Summary */}
                                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Request Summary
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">{selectedRequest.id}</div>
                                            <div className="text-sm text-blue-700">Request ID</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {selectedRequest.requirements_data ? Object.keys(selectedRequest.requirements_data).length : 0}
                                            </div>
                                            <div className="text-sm text-green-700">Fields Completed</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {new Date(selectedRequest.submitted_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-sm text-purple-700">Submitted Date</div>
                                        </div>
                                    </div>
                                </div>

                                {/* User Profile Information */}
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        User Profile Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Username</label>
                                            <p className="text-sm text-gray-900 font-medium">{selectedRequest.username || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                            <p className="text-sm text-gray-900">{selectedRequest.email || 'No email'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                            <p className="text-sm text-gray-900">{selectedRequest.full_name || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                            <p className="text-sm text-gray-900">{selectedRequest.phone_number || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Address</label>
                                            <p className="text-sm text-gray-900">{selectedRequest.address || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Birthdate</label>
                                            <p className="text-sm text-gray-900">
                                                {selectedRequest.birthdate ? new Date(selectedRequest.birthdate).toLocaleDateString() : 'Not provided'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Request Information */}
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Request Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Request ID</label>
                                            <p className="text-sm text-gray-900 font-mono">#{selectedRequest.id}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Status</label>
                                            <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Submitted Date</label>
                                            <p className="text-sm text-gray-900">
                                                {new Date(selectedRequest.submitted_at).toLocaleString()}
                                            </p>
                                        </div>
                                        {selectedRequest.approved_at && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Approved Date</label>
                                                <p className="text-sm text-gray-900">
                                                    {new Date(selectedRequest.approved_at).toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                        {selectedRequest.rejection_reason && (
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                                                <p className="text-sm text-gray-900 bg-red-50 p-3 rounded-lg border border-red-200">
                                                    {selectedRequest.rejection_reason}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Dynamic Requirements Data */}
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        Submitted Requirements & Answers
                                    </h4>
                                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                                        {selectedRequest.requirements_data && Object.keys(selectedRequest.requirements_data).length > 0 ? (
                                            <div className="space-y-4">
                                                {Object.entries(selectedRequest.requirements_data).map(([key, value]) => (
                                                    <div key={key} className="bg-white p-4 rounded-lg border border-gray-200">
                                                        <div className="font-semibold text-gray-800 text-sm mb-2 border-b border-gray-200 pb-2">
                                                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </div>
                                                        <div className="text-gray-900">
                                                            {value === null || value === undefined ? (
                                                                <span className="text-gray-500 italic">Not provided</span>
                                                            ) : typeof value === 'object' && value !== null ? (
                                                                <div>
                                                                    {Array.isArray(value) ? (
                                                                        <div className="space-y-1">
                                                                            {value.map((item, index) => (
                                                                                <div key={index} className="text-sm bg-gray-100 px-2 py-1 rounded">
                                                                                    {String(item)}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <pre className="text-xs bg-gray-100 p-3 rounded border overflow-x-auto">
                                                                            {JSON.stringify(value, null, 2)}
                                                                        </pre>
                                                                    )}
                                                                </div>
                                                            ) : typeof value === 'boolean' ? (
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${value ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                                                                    }`}>
                                                                    {value ? '✅ Accepted' : '❌ Not Accepted'}
                                                                </span>
                                                            ) : typeof value === 'string' && value.trim() === '' ? (
                                                                <span className="text-gray-500 italic">Empty</span>
                                                            ) : (
                                                                <div className="text-sm bg-blue-50 p-3 rounded border border-blue-200">
                                                                    {String(value)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="text-gray-400 mb-2">
                                                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <p className="text-gray-500">No requirements data available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedRequest.status === 'Pending' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Rejection Reason (if rejecting)
                                            </label>
                                            <textarea
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Provide a reason for rejection..."
                                            />
                                        </div>

                                        <div className="flex justify-end space-x-3">
                                            <Button
                                                onClick={closeModal}
                                                className="bg-gray-500 hover:bg-gray-600 text-white"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => handleApprove(selectedRequest.id)}
                                                disabled={actionLoading}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                onClick={() => handleReject(selectedRequest.id)}
                                                disabled={actionLoading || !rejectionReason.trim()}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {selectedRequest.status !== 'Pending' && (
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={closeModal}
                                            className="bg-gray-500 hover:bg-gray-600 text-white"
                                        >
                                            Close
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerRequests;
