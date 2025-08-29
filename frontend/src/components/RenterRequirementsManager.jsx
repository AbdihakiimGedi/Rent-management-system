import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { ownerApi } from '../api/ownerApi';

const RenterRequirementsManager = ({ itemId, onUpdate }) => {
    const { addNotification } = useNotification();
    const navigate = useNavigate();

    const [renterFields, setRenterFields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    // Debug logging
    console.log('RenterRequirementsManager rendered with itemId:', itemId, 'renterFields:', renterFields, 'Component ID:', Math.random());
    console.log('renterFields length:', renterFields.length);
    console.log('renterFields IDs:', renterFields.map(f => f.id));
    console.log('renterFields names:', renterFields.map(f => f.field_name));

    useEffect(() => {
        console.log('useEffect triggered for itemId:', itemId);
        fetchRenterFields();
    }, [itemId]);

    // Prevent unnecessary re-renders
    const memoizedRenterFields = React.useMemo(() => {
        console.log('Memoizing renter fields:', renterFields);
        return renterFields;
    }, [renterFields]);

    const fetchRenterFields = async () => {
        try {
            setLoading(true);
            const response = await ownerApi.getRenterInputFields(itemId);
            const fields = response.data.renter_input_fields || [];

            // Remove duplicates by ID
            const uniqueFields = fields.filter((field, index, self) =>
                index === self.findIndex(f => f.id === field.id)
            );

            console.log('Original fields:', fields);
            console.log('Unique fields:', uniqueFields);

            setRenterFields(uniqueFields);
        } catch (error) {
            console.error('Error fetching renter fields:', error);
            setRenterFields([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteField = async (fieldId) => {
        if (!window.confirm('Are you sure you want to delete this requirement?')) {
            return;
        }

        try {
            await ownerApi.deleteRenterInputField(itemId, fieldId);
            addNotification('Requirement deleted successfully', 'success');
            fetchRenterFields();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error deleting field:', error);
            addNotification('Error deleting requirement', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading requirements...</span>
            </div>
        );
    }

    // Always render the component so users can add requirements

    return (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-gray-600/40 p-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Renter Requirements
                    </h2>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transform hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                    {showAddForm ? 'Hide Form' : 'Add Requirement'}
                </button>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
                Define what information renters need to provide when they want to rent this item.
            </p>

            {/* Current Renter Requirements */}
            {memoizedRenterFields.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Current Requirements ({memoizedRenterFields.length})
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                            <thead className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Field Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Required
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Options
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {memoizedRenterFields.map((field, index) => (
                                    <tr key={`${field.id}-${index}-${itemId}`}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {field.field_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                                {field.field_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${field.required
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                                                }`}>
                                                {field.required ? 'Required' : 'Optional'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {field.options && field.options.length > 0 ? (
                                                    <span className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                                                        {field.options.join(', ')}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => navigate(`/owner/rental-items/${itemId}/renter-fields/${field.id}/edit`)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                                >
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteField(field.id)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                                >
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add New Requirement Form */}
            {showAddForm && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-700/50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-4">
                        Add New Requirement
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                        This will be shown to renters when they try to book this item.
                    </p>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => navigate(`/owner/rental-items/${itemId}/renter-fields/new`)}
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300"
                        >
                            Add Requirement
                        </button>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-all duration-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {memoizedRenterFields.length === 0 && !showAddForm && (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p className="text-amber-600 dark:text-amber-400 text-lg">No renter requirements defined yet</p>
                    <p className="text-amber-500 dark:text-amber-300 text-sm mt-1">
                        Add requirements to specify what information renters need to provide
                    </p>
                </div>
            )}
        </div>
    );
};

export default RenterRequirementsManager;
