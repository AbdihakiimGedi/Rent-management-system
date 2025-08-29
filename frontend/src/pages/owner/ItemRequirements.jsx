import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { ownerApi } from '../../api/ownerApi';
import Button from '../../components/Button';

// SVG Icons
const PlusIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const PencilIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const ItemRequirements = () => {
    const { id } = useParams();
    const { t } = useLanguage();
    const { addNotification } = useNotification();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [rentalItem, setRentalItem] = useState(null);
    const [requirements, setRequirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingRequirement, setEditingRequirement] = useState(null);
    const [formData, setFormData] = useState({
        field_name: '',
        field_type: 'string',
        required: false,
        options: '',
        description: ''
    });

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [itemResponse, requirementsResponse] = await Promise.all([
                ownerApi.getRentalItem(id),
                ownerApi.getRenterInputFields(id)
            ]);

            setRentalItem(itemResponse.data);
            setRequirements(requirementsResponse.data.renter_fields || []);
        } catch (error) {
            addNotification('Error fetching data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const submitData = {
                ...formData,
                options: formData.options ? formData.options.split(',').map(opt => opt.trim()) : []
            };

            if (editingRequirement) {
                await ownerApi.updateRenterInputField(id, editingRequirement.id, submitData);
                addNotification('Requirement updated successfully!', 'success');
            } else {
                await ownerApi.createRenterInputField(id, submitData);
                addNotification('Requirement added successfully!', 'success');
            }

            resetForm();
            fetchData();
        } catch (error) {
            addNotification('Error saving requirement', 'error');
        }
    };

    const handleDelete = async (requirementId) => {
        if (!window.confirm('Are you sure you want to delete this requirement?')) {
            return;
        }

        try {
            await ownerApi.deleteRenterInputField(id, requirementId);
            addNotification('Requirement deleted successfully!', 'success');
            fetchData();
        } catch (error) {
            addNotification('Error deleting requirement', 'error');
        }
    };

    const handleEdit = (requirement) => {
        setEditingRequirement(requirement);
        setFormData({
            field_name: requirement.field_name || '',
            field_type: requirement.field_type || 'string',
            required: requirement.required || false,
            options: requirement.options ? requirement.options.join(', ') : '',
            description: requirement.description || ''
        });
        setShowAddForm(true);
    };

    const resetForm = () => {
        setFormData({
            field_name: '',
            field_type: 'string',
            required: false,
            options: '',
            description: ''
        });
        setEditingRequirement(null);
        setShowAddForm(false);
    };

    const getFieldTypeLabel = (type) => {
        const types = {
            string: 'Text Input',
            number: 'Number Input',
            date: 'Date Picker',
            file: 'File Upload',
            selection: 'Dropdown Selection',
            textarea: 'Text Area'
        };
        return types[type] || type;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!rentalItem) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Rental item not found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center space-x-3">
                            <Button
                                onClick={() => navigate('/dashboard')}
                                variant="secondary"
                                className="px-3 py-2"
                            >
                                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Item Requirements</h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    Define what information renters need to provide for: {rentalItem.dynamic_data?.name || 'This item'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowAddForm(true)}
                        variant="primary"
                        className="px-4 py-2"
                    >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Requirement
                    </Button>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {editingRequirement ? 'Edit Requirement' : 'Add New Requirement'}
                        </h3>
                        <button
                            onClick={resetForm}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Field Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Field Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.field_name}
                                    onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                                    required
                                    placeholder="e.g., Driver License, ID Number"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            {/* Field Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Field Type *
                                </label>
                                <select
                                    value={formData.field_type}
                                    onChange={(e) => setFormData({ ...formData, field_type: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="string">Text Input</option>
                                    <option value="number">Number Input</option>
                                    <option value="date">Date Picker</option>
                                    <option value="file">File Upload</option>
                                    <option value="selection">Dropdown Selection</option>
                                    <option value="textarea">Text Area</option>
                                </select>
                            </div>
                        </div>

                        {/* Options (for selection type) */}
                        {formData.field_type === 'selection' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Options *
                                </label>
                                <input
                                    type="text"
                                    value={formData.options}
                                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                                    required
                                    placeholder="Option 1, Option 2, Option 3 (comma separated)"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Separate multiple options with commas
                                </p>
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                placeholder="Explain what this field is for..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        {/* Required Checkbox */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="required"
                                checked={formData.required}
                                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="required" className="ml-2 block text-sm font-medium text-gray-900 dark:text-white">
                                This field is required for renters
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={resetForm}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                            >
                                {editingRequirement ? 'Update Requirement' : 'Add Requirement'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Requirements List */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Renter Requirements</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        These fields will be shown to renters when they want to book this item
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Field Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Required
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {requirements.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No requirements defined yet. Add your first requirement above.
                                    </td>
                                </tr>
                            ) : (
                                requirements.map((requirement) => (
                                    <tr key={requirement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {requirement.field_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                                {getFieldTypeLabel(requirement.field_type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${requirement.required
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                                                }`}>
                                                {requirement.required ? 'Required' : 'Optional'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                                                {requirement.description || 'No description'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <Button
                                                    onClick={() => handleEdit(requirement)}
                                                    variant="secondary"
                                                    size="sm"
                                                    className="px-2 py-1 text-xs"
                                                >
                                                    <PencilIcon className="w-3 h-3 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    onClick={() => handleDelete(requirement.id)}
                                                    variant="danger"
                                                    size="sm"
                                                    className="px-2 py-1 text-xs"
                                                >
                                                    <TrashIcon className="w-3 h-3 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ItemRequirements;
