import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { adminApi } from '../../api/adminApi';
import Button from '../../components/Button';

const OwnerRequirements = () => {
    const { t } = useLanguage();
    const { addNotification } = useNotification();

    const [requirements, setRequirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRequirement, setEditingRequirement] = useState(null);
    const [formData, setFormData] = useState({
        label: '',
        field_name: '',
        input_type: 'text',
        is_required: true,
        placeholder: '',
        help_text: '',
        options: [],
        validation_rules: {},
        order_index: 0
    });

    useEffect(() => {
        fetchRequirements();
    }, []);

    const fetchRequirements = async () => {
        try {
            setLoading(true);
            const response = await adminApi.getOwnerRequirements();
            setRequirements(response.data.requirements || []);

            // Show message if table doesn't exist yet
            if (response.data.message) {
                addNotification(response.data.message, 'info');
            }
        } catch (error) {
            console.error('Error fetching requirements:', error);
            const errorMessage = error.response?.data?.error || 'Error fetching owner requirements';
            addNotification(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        let processedValue = value;

        // Auto-format field_name to snake_case
        if (name === 'field_name') {
            processedValue = value
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '_') // Replace invalid chars with underscore
                .replace(/_+/g, '_') // Replace multiple underscores with single
                .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : processedValue
        }));
    };

    const handleOptionsChange = (e) => {
        const options = e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt);
        setFormData(prev => ({
            ...prev,
            options
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.label || !formData.field_name || !formData.input_type) {
            addNotification('Please fill in all required fields', 'error');
            return;
        }

        // Validate field name format
        const fieldNameRegex = /^[a-z][a-z0-9_]*$/;
        if (!fieldNameRegex.test(formData.field_name)) {
            addNotification('Field name must start with lowercase letter and contain only lowercase letters, numbers, and underscores', 'error');
            return;
        }

        // Check for field name conflicts (excluding current editing requirement)
        const conflictingRequirement = requirements.find(req =>
            req.field_name === formData.field_name &&
            (!editingRequirement || req.id !== editingRequirement.id)
        );

        if (conflictingRequirement) {
            addNotification(`Field name "${formData.field_name}" already exists. Please choose a different name.`, 'error');
            return;
        }

        try {
            if (editingRequirement) {
                await adminApi.updateOwnerRequirement(editingRequirement.id, formData);
                addNotification('Requirement updated successfully', 'success');
            } else {
                await adminApi.createOwnerRequirement(formData);
                addNotification('Requirement created successfully', 'success');
            }

            setShowForm(false);
            setEditingRequirement(null);
            resetForm();
            fetchRequirements();
        } catch (error) {
            console.error('Error saving requirement:', error);
            const errorMessage = error.response?.data?.error ||
                (editingRequirement ? 'Error updating requirement' : 'Error creating requirement');
            addNotification(errorMessage, 'error');
        }
    };

    const handleEdit = (requirement) => {
        setEditingRequirement(requirement);
        setFormData({
            label: requirement.label,
            field_name: requirement.field_name,
            input_type: requirement.input_type,
            is_required: requirement.is_required,
            placeholder: requirement.placeholder || '',
            help_text: requirement.help_text || '',
            options: requirement.options || [],
            validation_rules: requirement.validation_rules || {},
            order_index: requirement.order_index
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this requirement?')) {
            return;
        }

        try {
            await adminApi.deleteOwnerRequirement(id);
            addNotification('Requirement deleted successfully', 'success');
            fetchRequirements();
        } catch (error) {
            console.error('Error deleting requirement:', error);
            const errorMessage = error.response?.data?.error || 'Error deleting requirement';
            addNotification(errorMessage, 'error');
        }
    };

    const handleReorder = async (fromIndex, toIndex) => {
        const newRequirements = [...requirements];
        const [movedItem] = newRequirements.splice(fromIndex, 1);
        newRequirements.splice(toIndex, 0, movedItem);

        // Update order_index for all items
        const reorderData = newRequirements.map((req, index) => ({
            id: req.id,
            order_index: index
        }));

        try {
            await adminApi.reorderOwnerRequirements({ requirements: reorderData });
            setRequirements(newRequirements);
            addNotification('Requirements reordered successfully', 'success');
        } catch (error) {
            console.error('Error reordering requirements:', error);
            const errorMessage = error.response?.data?.error || 'Error reordering requirements';
            addNotification(errorMessage, 'error');
            fetchRequirements(); // Revert on error
        }
    };

    const resetForm = () => {
        setFormData({
            label: '',
            field_name: '',
            input_type: 'text',
            is_required: true,
            placeholder: '',
            help_text: '',
            options: [],
            validation_rules: {},
            order_index: 0
        });
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingRequirement(null);
        resetForm();
    };

    const getInputTypeLabel = (type) => {
        const typeLabels = {
            text: 'Text Input',
            textarea: 'Text Area',
            number: 'Number Input',
            dropdown: 'Dropdown Select',
            file: 'File Upload',
            date: 'Date Picker',
            email: 'Email Input',
            phone: 'Phone Input',
            contract: 'Contract Acceptance'
        };
        return typeLabels[type] || type;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-6 shadow-lg">
                        <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Loading Requirements
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Setting up your dynamic form configuration...
                    </p>
                    <div className="mt-6 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            Owner Application Requirements
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Design and manage the dynamic form fields that owners must complete when applying for privileges
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Fields</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{requirements.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center">
                                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Fields</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{requirements.filter(r => r.is_active).length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Required Fields</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{requirements.filter(r => r.is_required).length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Field Types</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{new Set(requirements.map(r => r.input_type)).size}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Form Field Management</h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    Configure the dynamic fields for owner applications
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowForm(true)}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add New Field
                            </Button>
                        </div>
                    </div>

                    {showForm && (
                        <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {editingRequirement ? 'Edit Field Configuration' : 'Create New Form Field'}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Configure the field properties and validation rules
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Field Label *
                                        </label>
                                        <input
                                            type="text"
                                            name="label"
                                            value={formData.label}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400"
                                            placeholder="e.g., Business Plan"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Human-readable name displayed to users
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Field Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="field_name"
                                            value={formData.field_name}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400"
                                            placeholder="e.g., business_plan"
                                            pattern="[a-z][a-z0-9_]*"
                                            title="Must start with lowercase letter, can contain lowercase letters, numbers, and underscores"
                                            required
                                        />
                                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                            <p>• Unique identifier (snake_case format)</p>
                                            <p>• Must start with lowercase letter</p>
                                            <p>• Can contain: a-z, 0-9, underscore (_)</p>
                                            <p>• Examples: business_plan, national_id, contract_terms</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Input Type *
                                        </label>
                                        <select
                                            name="input_type"
                                            value={formData.input_type}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400"
                                        >
                                            <option value="text">📝 Text Input</option>
                                            <option value="textarea">📄 Text Area</option>
                                            <option value="number">🔢 Number Input</option>
                                            <option value="dropdown">📋 Dropdown Select</option>
                                            <option value="file">📎 File Upload</option>
                                            <option value="date">📅 Date Picker</option>
                                            <option value="email">📧 Email Input</option>
                                            <option value="phone">📞 Phone Input</option>
                                            <option value="contract">📜 Contract Acceptance</option>
                                        </select>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Type of input field to display
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Order Index
                                        </label>
                                        <input
                                            type="number"
                                            name="order_index"
                                            value={formData.order_index}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400"
                                            min="0"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Position in the form (0 = first)
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Placeholder Text
                                        </label>
                                        <input
                                            type="text"
                                            name="placeholder"
                                            value={formData.placeholder}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400"
                                            placeholder="Optional placeholder text"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Hint text shown in the input field
                                        </p>
                                    </div>

                                    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                        <input
                                            type="checkbox"
                                            name="is_required"
                                            checked={formData.is_required}
                                            onChange={handleInputChange}
                                            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all duration-200"
                                        />
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Required Field
                                        </label>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Users must fill this field to submit
                                        </span>
                                    </div>
                                </div>

                                {formData.input_type === 'dropdown' && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Dropdown Options *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.options.join(', ')}
                                                onChange={handleOptionsChange}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400"
                                                placeholder="Option 1, Option 2, Option 3"
                                            />
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Separate multiple options with commas
                                        </p>
                                    </div>
                                )}

                                {formData.input_type === 'contract' && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Contract Terms & Conditions *
                                        </label>
                                        <textarea
                                            name="help_text"
                                            value={formData.help_text}
                                            onChange={handleInputChange}
                                            rows="10"
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 resize-none"
                                            placeholder="Write your own contract terms and conditions here. Users will see this text and must check 'I accept' to proceed..."
                                        />
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                            <div className="flex items-start">
                                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="text-sm text-blue-800 dark:text-blue-200">
                                                    <p className="font-medium mb-1">Contract Field Behavior:</p>
                                                    <ul className="text-xs space-y-1">
                                                        <li>• Users will see your contract terms in a scrollable box</li>
                                                        <li>• They must check "I accept" checkbox to proceed</li>
                                                        <li>• Contract acceptance is stored as true/false</li>
                                                        <li>• Admin can review acceptance status in Owner Requests</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Help Text
                                    </label>
                                    <textarea
                                        name="help_text"
                                        value={formData.help_text}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 resize-none"
                                        placeholder="Provide helpful guidance for users filling out this field..."
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Optional text to help users understand what to enter
                                    </p>
                                </div>

                                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                    <Button
                                        type="button"
                                        onClick={cancelForm}
                                        variant="secondary"
                                        className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {editingRequirement ? 'Update Field' : 'Create Field'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="px-8 py-6">
                        {requirements.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-6">
                                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    No Requirements Defined Yet
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
                                    Start building your dynamic form by adding the first requirement field.
                                    This will define what owners need to fill out when applying.
                                </p>
                                <p className="text-sm text-gray-400 dark:text-gray-500">
                                    💡 If you're seeing this message after running the app for the first time,
                                    you may need to run the database migration first.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {requirements.map((requirement, index) => (
                                    <div
                                        key={requirement.id}
                                        className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 transform hover:-translate-y-1"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-6 flex-1">
                                                {/* Order and Reorder Controls */}
                                                <div className="flex flex-col items-center space-y-2">
                                                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-sm font-bold">
                                                        {requirement.order_index + 1}
                                                    </div>
                                                    <div className="flex flex-col space-y-1">
                                                        <button
                                                            onClick={() => index > 0 && handleReorder(index, index - 1)}
                                                            disabled={index === 0}
                                                            className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
                                                            title="Move Up"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => index < requirements.length - 1 && handleReorder(index, index + 1)}
                                                            disabled={index === requirements.length - 1}
                                                            className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
                                                            title="Move Down"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Field Information */}
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-center space-x-3">
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                            {requirement.label}
                                                        </h3>
                                                        {requirement.is_required && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                                Required
                                                            </span>
                                                        )}
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                            {getInputTypeLabel(requirement.input_type)}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            <span className="font-medium">Field:</span> <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">{requirement.field_name}</code>
                                                        </p>

                                                        {requirement.placeholder && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                <span className="font-medium">Placeholder:</span> "{requirement.placeholder}"
                                                            </p>
                                                        )}

                                                        {requirement.help_text && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                <span className="font-medium">Help:</span> {requirement.help_text}
                                                            </p>
                                                        )}

                                                        {requirement.input_type === 'dropdown' && requirement.options && requirement.options.length > 0 && (
                                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                <span className="font-medium">Options:</span>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {requirement.options.map((option, optIndex) => (
                                                                        <span key={optIndex} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                                            {option}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <Button
                                                    onClick={() => handleEdit(requirement)}
                                                    variant="secondary"
                                                    size="sm"
                                                    className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </Button>
                                                <Button
                                                    onClick={() => handleDelete(requirement.id)}
                                                    variant="danger"
                                                    size="sm"
                                                    className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerRequirements;
