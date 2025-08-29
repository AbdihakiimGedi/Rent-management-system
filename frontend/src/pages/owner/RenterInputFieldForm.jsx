import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { ownerApi } from '../../api/ownerApi';
import Button from '../../components/Button';

const RenterInputFieldForm = () => {
    const { itemId, fieldId } = useParams();
    const { t } = useLanguage();
    const { addNotification } = useNotification();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        field_name: '',
        field_type: 'string',  // Changed from 'text' to match backend model
        required: true,
        options: []
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [newOption, setNewOption] = useState('');

    // Updated field types to match backend model exactly
    const fieldTypes = [
        { value: 'string', label: 'Text Input' },
        { value: 'number', label: 'Number Input' },
        { value: 'date', label: 'Date Picker' },
        { value: 'file', label: 'File Upload' },
        { value: 'selection', label: 'Selection/Dropdown' },
        { value: 'textarea', label: 'Text Area' },
        { value: 'contract', label: 'Contract (Text Area)' },
        { value: 'contract_accept', label: 'Contract with Accept/Reject' },
        { value: 'rental_period', label: 'Rental Period Selection' }
    ];

    useEffect(() => {
        if (fieldId) {
            fetchField();
        } else {
            setInitialLoading(false);
        }
    }, [fieldId]);

    const fetchField = async () => {
        try {
            const response = await ownerApi.getRenterInputFields(itemId);
            const field = response.data.renter_input_fields.find(f => f.id === parseInt(fieldId));
            if (field) {
                setFormData({
                    field_name: field.field_name,
                    field_type: field.field_type,
                    required: field.required,
                    options: field.options || []
                });
            }
        } catch (error) {
            addNotification('Error fetching field', 'error');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear options if field type is not selection, contract, contract_accept, or rental_period
        if (field === 'field_type' && value !== 'selection' && value !== 'contract' && value !== 'contract_accept' && value !== 'rental_period') {
            setFormData(prev => ({ ...prev, options: [] }));
        }

        // Set default options for contract_accept type
        if (field === 'field_type' && value === 'contract_accept') {
            setFormData(prev => ({ ...prev, options: ['Accept', 'Reject'] }));
        }

        // Set default options for contract type
        if (field === 'field_type' && value === 'contract') {
            setFormData(prev => ({ ...prev, options: ['I agree to the terms and conditions'] }));
        }

        // Set default options for rental_period type
        if (field === 'field_type' && value === 'rental_period') {
            setFormData(prev => ({ ...prev, options: ['Daily', 'Weekly', 'Monthly', 'Yearly'] }));
        }
    };

    const addOption = () => {
        if (newOption.trim() && !formData.options.includes(newOption.trim())) {
            const updatedOptions = [...formData.options, newOption.trim()];
            console.log('🚀 RenterInputFieldForm: Adding option:', newOption.trim());
            console.log('🚀 RenterInputFieldForm: Updated options:', updatedOptions);
            setFormData(prev => ({
                ...prev,
                options: updatedOptions
            }));
            setNewOption('');
        }
    };

    const removeOption = (index) => {
        setFormData(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        console.log('🚀 RenterInputFieldForm: Submitting form data:', formData);

        try {
            if (fieldId) {
                await ownerApi.updateRenterInputField(itemId, parseInt(fieldId), formData);
                addNotification('Field updated successfully!', 'success');
            } else {
                await ownerApi.createRenterInputField(itemId, formData);
                addNotification('Field created successfully!', 'success');
            }
            navigate(`/owner/rental-items/${itemId}`);
        } catch (error) {
            console.error('🚀 RenterInputFieldForm: Error submitting form:', error);
            addNotification('Error saving field', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {fieldId ? 'Edit Renter Input Field' : 'Create Renter Input Field'}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Define what information renters need to provide when booking this item
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Field Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Field Name *
                        </label>
                        <input
                            type="text"
                            name="field_name"
                            value={formData.field_name}
                            onChange={(e) => handleChange('field_name', e.target.value)}
                            required
                            maxLength={255}  // Added maxLength to match backend model
                            placeholder="e.g., Driver License, Insurance Info, Special Requirements"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    {/* Field Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Field Type *
                        </label>
                        <select
                            name="field_type"
                            value={formData.field_type}
                            onChange={(e) => handleChange('field_type', e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            {fieldTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Required Field */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="required"
                            name="required"
                            checked={formData.required}
                            onChange={(e) => handleChange('required', e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="required" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            This field is required
                        </label>
                    </div>

                    {/* Options for Selection Type, Contract, and Contract Accept Type */}
                    {(formData.field_type === 'selection' || formData.field_type === 'contract' || formData.field_type === 'contract_accept') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {formData.field_type === 'contract_accept' ? 'Contract Options' :
                                    formData.field_type === 'contract' ? 'Contract Agreement Text' :
                                        'Selection Options'} *
                            </label>
                            {formData.field_type === 'contract_accept' && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    This field will allow renters to accept or reject the contract terms.
                                </p>
                            )}
                            {formData.field_type === 'contract' && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    This field will display contract text that renters must agree to. Write your rental terms, conditions, and policies here.
                                </p>
                            )}
                            <div className="space-y-3">
                                {formData.field_type === 'contract' ? (
                                    // Textarea for contract terms
                                    <div className="space-y-2">
                                        <textarea
                                            value={newOption}
                                            onChange={(e) => setNewOption(e.target.value)}
                                            placeholder="Enter your rental contract terms, conditions, and policies here. Be specific about rules, fees, and requirements."
                                            rows={6}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        />
                                        <Button
                                            type="button"
                                            onClick={addOption}
                                            variant="secondary"
                                            size="sm"
                                            disabled={!newOption.trim()}
                                        >
                                            Set Contract Terms
                                        </Button>
                                    </div>
                                ) : (
                                    // Text input for other field types
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={newOption}
                                            onChange={(e) => setNewOption(e.target.value)}
                                            placeholder={formData.field_type === 'contract_accept' ? "Add contract option" : "Add an option"}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                        <Button
                                            type="button"
                                            onClick={addOption}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            Add
                                        </Button>
                                    </div>
                                )}

                                {formData.options.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {formData.field_type === 'contract' ? 'Current contract terms:' :
                                                formData.field_type === 'contract_accept' ? 'Current contract options:' :
                                                    'Current options:'}
                                        </p>
                                        {formData.options.map((option, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                                {formData.field_type === 'contract' ? (
                                                    <div className="flex-1">
                                                        <div className="text-sm text-gray-900 dark:text-white font-medium mb-1">Contract Terms:</div>
                                                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{option}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-900 dark:text-white">{option}</span>
                                                )}
                                                <Button
                                                    type="button"
                                                    onClick={() => removeOption(index)}
                                                    variant="danger"
                                                    size="sm"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-6">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate(`/owner/rental-items/${itemId}`)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                        >
                            {loading ? 'Saving...' : (fieldId ? 'Update Field' : 'Create Field')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RenterInputFieldForm;

