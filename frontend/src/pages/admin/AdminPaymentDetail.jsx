import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { adminApi } from '../../api/adminApi';
import { paymentApi } from '../../api/paymentApi';

const AdminPaymentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addNotification } = useNotification();

    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloadingPDF, setDownloadingPDF] = useState(false);

    useEffect(() => {
        fetchPaymentDetails();
    }, [id]);

    const fetchPaymentDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Fetching payment details for ID:', id);

            // Use the new admin payment details endpoint
            try {
                console.log('🔍 Fetching payment details from admin endpoint...');
                const response = await adminApi.getPaymentDetails(id);
                const responseData = response.data || response;
                console.log('📊 Admin payment details response:', responseData);

                setPayment(responseData);
                return;

            } catch (adminError) {
                console.log('⚠️ Admin endpoint failed, trying fallback...', adminError);

                // Fallback: try to get from admin payments list
                const response = await adminApi.getPayments({ per_page: 1000 });
                const responseData = response.data || response;

                if (responseData.payments) {
                    const foundPayment = responseData.payments.find(p => p.booking_id == id);
                    if (foundPayment) {
                        // Create basic payment object with available data
                        const basicPayment = {
                            ...foundPayment,
                            renter: {
                                id: 'Unknown',
                                username: 'Unknown',
                                email: 'Unknown'
                            },
                            owner: {
                                id: 'Unknown',
                                username: foundPayment.owner_username || 'Unknown',
                                email: 'Unknown'
                            },
                            booking_id: foundPayment.booking_id || id
                        };
                        setPayment(basicPayment);
                        return;
                    }
                }

                // Final fallback: try direct payment status
                console.log('⚠️ Trying direct payment status...');
                const fallbackResponse = await paymentApi.getPaymentStatus(id);
                const fallbackData = fallbackResponse.data || fallbackResponse;
                setPayment(fallbackData);
            }

        } catch (error) {
            console.error('❌ Error fetching payment details:', error);
            setError('Failed to fetch payment details');
            addNotification('Error fetching payment details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToPayments = () => {
        navigate('/admin/payments');
    };

    const handleDownloadPDF = async () => {
        try {
            if (!payment || !payment.booking_id) {
                addNotification('Payment data not available for download', 'error');
                return;
            }

            setDownloadingPDF(true);
            addNotification('Generating PDF receipt...', 'info');

            // Get the authentication token
            const token = localStorage.getItem('token');
            if (!token) {
                addNotification('Authentication required for download', 'error');
                return;
            }

            // Make API call to download PDF
            const response = await fetch(`http://127.0.0.1:5000/receipt/${payment.booking_id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to download PDF');
            }

            // Check if response is PDF or JSON with base64 data
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/pdf')) {
                // Direct PDF download
                const pdfBlob = await response.blob();

                // Create download link
                const url = window.URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `admin_payment_receipt_${payment.booking_id}.pdf`;

                // Trigger download
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Clean up
                window.URL.revokeObjectURL(url);
            } else {
                // Fallback: JSON response with base64 PDF data
                const data = await response.json();

                if (data.pdf_data && data.filename) {
                    // Convert base64 to blob
                    const pdfBytes = atob(data.pdf_data);
                    const pdfArray = new Uint8Array(pdfBytes.length);
                    for (let i = 0; i < pdfBytes.length; i++) {
                        pdfArray[i] = pdfBytes.charCodeAt(i);
                    }

                    const pdfBlob = new Blob([pdfArray], { type: 'application/pdf' });

                    // Create download link
                    const url = window.URL.createObjectURL(pdfBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = data.filename;

                    // Trigger download
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Clean up
                    window.URL.revokeObjectURL(url);
                } else {
                    throw new Error('Invalid PDF data received from server');
                }
            }

            addNotification('PDF receipt downloaded successfully!', 'success');

        } catch (error) {
            console.error('Error downloading PDF:', error);
            addNotification(`Failed to download PDF: ${error.message}`, 'error');
        } finally {
            setDownloadingPDF(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'COMPLETED': 'bg-green-100 text-green-800',
            'HELD': 'bg-blue-100 text-blue-800',
            'FAILED': 'bg-red-100 text-red-800',
            'REFUNDED': 'bg-gray-100 text-gray-800'
        };

        return (
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    const getMethodBadge = (method) => {
        return (
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-indigo-100 text-indigo-800">
                {method}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                    <p className="text-red-600 dark:text-red-400 text-lg mb-4">{error}</p>
                    <div className="space-x-4">
                        <button
                            onClick={fetchPaymentDetails}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Retry
                        </button>
                        <button
                            onClick={handleBackToPayments}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                            Back to Payments
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!payment) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
                    <p className="text-yellow-600 dark:text-yellow-400 text-lg mb-4">Payment not found</p>
                    <button
                        onClick={handleBackToPayments}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                    >
                        Back to Payments
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Payment Details
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Payment ID: #{payment.booking_id}
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={downloadingPDF}
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            {downloadingPDF ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download Receipt
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleBackToPayments}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
                        >
                            ← Back to Payments
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Overview Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                            <div className="mt-1">
                                {getStatusBadge(payment.payment_status)}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Payment Method</label>
                            <div className="mt-1">
                                {getMethodBadge(payment.payment_method)}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Payment Account</label>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                {payment.payment_account || 'Not specified'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Created Date</label>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                {payment.created_at ? new Date(payment.created_at).toLocaleString() : 'Unknown'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Payment Amount</label>
                            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                                ${payment.payment_amount?.toFixed(2) || '0.00'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Service Fee</label>
                            <p className="mt-1 text-lg font-semibold text-blue-600 dark:text-blue-400">
                                ${payment.service_fee?.toFixed(2) || '0.00'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</label>
                            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                                ${payment.total_amount?.toFixed(2) || '0.00'}
                            </p>
                        </div>

                        {payment.payment_held_at && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Payment Held At</label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {new Date(payment.payment_held_at).toLocaleString()}
                                </p>
                            </div>
                        )}

                        {payment.payment_released_at && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Payment Released At</label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {new Date(payment.payment_released_at).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* User Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">User Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Renter Information */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Renter</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Username</label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {payment.renter?.username || 'Unknown'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {payment.renter?.email || 'Unknown'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">User ID</label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {payment.renter?.id || 'Unknown'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Owner Information */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Owner</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Username</label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {payment.owner?.username || 'Unknown'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {payment.owner?.email || 'Unknown'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Owner ID</label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {payment.owner?.id || 'Unknown'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Approval Information */}
            {(payment.admin_approved !== null || payment.admin_rejection_reason) && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Admin Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Admin Approval</label>
                            <div className="mt-1">
                                {payment.admin_approved ? (
                                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                                        ✅ Approved
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                                        ❌ Rejected
                                    </span>
                                )}
                            </div>
                        </div>

                        {payment.admin_approved_at && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Admin Action Date</label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {new Date(payment.admin_approved_at).toLocaleString()}
                                </p>
                            </div>
                        )}

                        {payment.admin_rejection_reason && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Rejection Reason</label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                                    {payment.admin_rejection_reason}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Additional Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Booking Status</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                            {payment.status || 'Unknown'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                            {payment.updated_at ? new Date(payment.updated_at).toLocaleString() : 'Unknown'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPaymentDetail;
