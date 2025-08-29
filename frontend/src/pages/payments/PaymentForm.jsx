import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { paymentApi } from '../../api/paymentApi';
import { adminApi } from '../../api/adminApi';
import Button from '../../components/Button';

const PaymentForm = () => {
    const { id } = useParams();
    const { t } = useLanguage();
    const { addNotification } = useNotification();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        amount: '',
        currency: 'USD',
        method: 'credit_card',
        status: 'pending',
        description: '',
        bookingId: '',
        userId: '',
        ownerId: '',
        transactionId: '',
        notes: ''
    });

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [users, setUsers] = useState([]);
    const [owners, setOwners] = useState([]);

    useEffect(() => {
        if (isEditing) {
            fetchPayment();
        }
        fetchFormData();
    }, [id]);

    const fetchPayment = async () => {
        try {
            setInitialLoading(true);
            const response = await adminApi.getPayment(id);
            const payment = response.data;

            setFormData({
                amount: payment.amount || '',
                currency: payment.currency || 'USD',
                method: payment.method || 'credit_card',
                status: payment.status || 'pending',
                description: payment.description || '',
                bookingId: payment.bookingId || '',
                userId: payment.userId || '',
                ownerId: payment.ownerId || '',
                transactionId: payment.transactionId || '',
                notes: payment.notes || ''
            });
        } catch (error) {
            addNotification('Error fetching payment details', 'error');
            navigate('/payments');
        } finally {
            setInitialLoading(false);
        }
    };

    const fetchFormData = async () => {
        try {
            // Fetch bookings, users, and owners for dropdowns
            // This would typically come from admin API endpoints
            // For now, we'll use placeholder data
            setBookings([
                { id: '1', title: 'Sample Booking 1' },
                { id: '2', title: 'Sample Booking 2' }
            ]);
            setUsers([
                { id: '1', name: 'John Doe', email: 'john@example.com' },
                { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
            ]);
            setOwners([
                { id: '1', name: 'Owner 1', email: 'owner1@example.com' },
                { id: '2', name: 'Owner 2', email: 'owner2@example.com' }
            ]);
        } catch (error) {
            addNotification('Error fetching form data', 'error');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.amount || !formData.bookingId || !formData.userId || !formData.ownerId) {
            addNotification('Please fill in all required fields', 'error');
            return;
        }

        setLoading(true);
        try {
            if (isEditing) {
                await adminApi.updatePayment(id, formData);
                addNotification('Payment updated successfully', 'success');
            } else {
                await paymentApi.createPayment(formData);
                addNotification('Payment created successfully', 'success');
            }
            navigate('/payments');
        } catch (error) {
            addNotification(
                isEditing ? 'Error updating payment' : 'Error creating payment',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/payments');
    };

    if (initialLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {isEditing ? 'Edit Payment' : 'Create New Payment'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {isEditing ? 'Update payment information' : 'Add a new payment record'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Amount *
                            </label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        {/* Currency */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Currency
                            </label>
                            <select
                                name="currency"
                                value={formData.currency}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="JPY">JPY</option>
                                <option value="CAD">CAD</option>
                            </select>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Payment Method
                            </label>
                            <select
                                name="method"
                                value={formData.method}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="credit_card">Credit Card</option>
                                <option value="debit_card">Debit Card</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="paypal">PayPal</option>
                                <option value="cash">Cash</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>

                        {/* Booking ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Booking ID *
                            </label>
                            <select
                                name="bookingId"
                                value={formData.bookingId}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                required
                            >
                                <option value="">Select a booking</option>
                                {bookings.map(booking => (
                                    <option key={booking.id} value={booking.id}>
                                        {booking.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* User ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                User ID *
                            </label>
                            <select
                                name="userId"
                                value={formData.userId}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                required
                            >
                                <option value="">Select a user</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Owner ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Owner ID *
                            </label>
                            <select
                                name="ownerId"
                                value={formData.ownerId}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                required
                            >
                                <option value="">Select an owner</option>
                                {owners.map(owner => (
                                    <option key={owner.id} value={owner.id}>
                                        {owner.name} ({owner.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Transaction ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Transaction ID
                            </label>
                            <input
                                type="text"
                                name="transactionId"
                                value={formData.transactionId}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Optional transaction ID"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Payment description"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Additional notes about the payment"
                        />
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            type="button"
                            onClick={handleCancel}
                            variant="secondary"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            loading={loading}
                        >
                            {isEditing ? 'Update Payment' : 'Create Payment'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentForm;



