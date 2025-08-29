import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { ownerApi } from '../../api/ownerApi';

const RentalItemForm = () => {
    const { addNotification } = useNotification();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();

    // State
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categoryRequirements, setCategoryRequirements] = useState([]);
    const [formData, setFormData] = useState({
        category_id: '',
        dynamic_data: {}
    });
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [uploadingFields, setUploadingFields] = useState(new Set());
    const [deleting, setDeleting] = useState(false);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            const response = await ownerApi.getCategories();
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            addNotification('Error fetching categories', 'error');
        }
    }, [addNotification]);

    // Handle category selection
    const handleCategoryChange = useCallback(async (categoryId) => {
        setSelectedCategory(categoryId);

        if (categoryId) {
            const category = categories.find(cat => cat.id === parseInt(categoryId));
            if (category && category.requirements) {
                setCategoryRequirements(category.requirements);

                // Initialize dynamic_data with empty values
                const initialData = {};
                category.requirements.forEach(req => {
                    if (req.field_type === 'file') {
                        initialData[req.field_name] = []; // Initialize file fields as empty arrays
                    } else {
                        initialData[req.field_name] = '';
                    }
                });

                setFormData(prev => ({
                    ...prev,
                    category_id: categoryId,
                    dynamic_data: initialData
                }));
            } else {
                setCategoryRequirements([]);
            }
        } else {
            setCategoryRequirements([]);
            setFormData(prev => ({ ...prev, category_id: '', dynamic_data: {} }));
        }
    }, [categories]);

    // Fetch existing rental item for editing
    const fetchRentalItem = useCallback(async () => {
        try {
            const response = await ownerApi.getRentalItem(id);
            const item = response.data;

            // Set the form data with existing values
            const initialFormData = {
                category_id: item.category_id,
                dynamic_data: item.dynamic_data || {}
            };

            setFormData(initialFormData);
            setSelectedCategory(item.category_id);

        } catch (error) {
            console.error('Error fetching rental item:', error);
            addNotification('Error fetching rental item', 'error');
        }
    }, [id, addNotification]);

    // Handle form field changes
    const handleFieldChange = useCallback((fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            dynamic_data: {
                ...prev.dynamic_data,
                [fieldName]: value
            }
        }));
    }, []);

    // Handle file uploads
    const handleFileUpload = useCallback(async (fieldName, files) => {
        if (!files || files.length === 0) return;

        // Get the field requirement to check limits
        const fieldRequirement = categoryRequirements.find(req => req.field_name === fieldName);
        const maxFiles = fieldRequirement?.max_images || 1;

        // Check if we're already at the limit
        const currentFiles = formData.dynamic_data[fieldName] || [];
        if (currentFiles.length >= maxFiles) {
            addNotification(`Maximum ${maxFiles} file(s) allowed for ${fieldName}`, 'warning');
            return;
        }

        // Check if adding these files would exceed the limit
        if (currentFiles.length + files.length > maxFiles) {
            addNotification(`Cannot upload ${files.length} files. Maximum ${maxFiles} files allowed for ${fieldName}`, 'warning');
            return;
        }

        setUploadingFields(prev => new Set([...prev, fieldName]));

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const response = await ownerApi.uploadImage(file, fieldName);
                if (response.data.success) {
                    return response.data.file_path;
                } else {
                    throw new Error(response.data.error || 'Upload failed');
                }
            });

            const uploadedPaths = await Promise.all(uploadPromises);

            // Update form data with new files
            setFormData(prev => {
                const currentFiles = prev.dynamic_data[fieldName] || [];
                const newFiles = [...currentFiles, ...uploadedPaths];

                return {
                    ...prev,
                    dynamic_data: {
                        ...prev.dynamic_data,
                        [fieldName]: newFiles
                    }
                };
            });

            addNotification(`✅ ${uploadedPaths.length} file(s) uploaded successfully!`, 'success');
        } catch (error) {
            console.error('Error uploading files:', error);
            addNotification(`❌ Error uploading files: ${error.message}`, 'error');
        } finally {
            setUploadingFields(prev => {
                const newSet = new Set(prev);
                newSet.delete(fieldName);
                return newSet;
            });
        }
    }, [addNotification, categoryRequirements, formData.dynamic_data]);

    // Remove file from field
    const handleRemoveFile = useCallback((fieldName, fileIndex) => {
        if (!window.confirm('Are you sure you want to remove this file? This action cannot be undone.')) {
            return;
        }

        setFormData(prev => {
            const currentFiles = prev.dynamic_data[fieldName] || [];
            const newFiles = currentFiles.filter((_, index) => index !== fileIndex);

            return {
                ...prev,
                dynamic_data: {
                    ...prev.dynamic_data,
                    [fieldName]: newFiles
                }
            };
        });

        addNotification('File removed successfully', 'success');
    }, [addNotification]);

    // Handle delete item
    const handleDelete = useCallback(async () => {
        if (!window.confirm('Are you sure you want to delete this rental item? This action cannot be undone.')) {
            return;
        }

        setDeleting(true);
        try {
            await ownerApi.deleteRentalItem(id);
            addNotification('Rental item deleted successfully!', 'success');
            navigate('/owner/rental-items');
        } catch (error) {
            console.error('Error deleting rental item:', error);
            addNotification('Error deleting rental item', 'error');
        } finally {
            setDeleting(false);
        }
    }, [id, addNotification, navigate]);

    // Handle form submission
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!formData.category_id) {
            addNotification('Please select a category', 'error');
            return;
        }

        // Check required fields
        const missingRequired = categoryRequirements
            .filter(req => req.required)
            .filter(req => {
                const value = formData.dynamic_data[req.field_name];
                if (req.field_type === 'file') {
                    return !Array.isArray(value) || value.length === 0;
                }
                return !value || value.toString().trim() === '';
            });

        if (missingRequired.length > 0) {
            addNotification(`Please fill in required fields: ${missingRequired.map(r => r.field_name).join(', ')}`, 'error');
            return;
        }

        setLoading(true);

        try {
            // Prepare data for submission
            const submitData = {
                category_id: formData.category_id,
                dynamic_data: formData.dynamic_data
            };

            if (isEditing) {
                await ownerApi.updateRentalItem(id, submitData);
                addNotification('Rental item updated successfully!', 'success');
            } else {
                await ownerApi.createRentalItem(submitData);
                addNotification('Rental item created successfully!', 'success');
            }

            navigate('/owner/rental-items');
        } catch (error) {
            console.error('Error saving rental item:', error);
            addNotification(`Error ${isEditing ? 'updating' : 'creating'} rental item`, 'error');
        } finally {
            setLoading(false);
        }
    }, [formData, categoryRequirements, isEditing, id, addNotification, navigate]);

    // Render form field based on type
    const renderField = useCallback((requirement) => {
        const { field_name, field_type, required, options, max_images, placeholder } = requirement;
        const value = formData.dynamic_data[field_name] || '';
        const isUploading = uploadingFields.has(field_name);

        switch (field_type) {
            case 'string':
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleFieldChange(field_name, e.target.value)}
                        required={required}
                        placeholder={placeholder || `Enter ${field_name.replace(/_/g, ' ')}`}
                        className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 text-base"
                    />
                );

            case 'number':
                return (
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => handleFieldChange(field_name, e.target.value)}
                        required={required}
                        placeholder={placeholder || `Enter ${field_name.replace(/_/g, ' ')}`}
                        className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 text-base"
                    />
                );

            case 'date':
                return (
                    <input
                        type="date"
                        value={value}
                        onChange={(e) => handleFieldChange(field_name, e.target.value)}
                        required={required}
                        className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 text-base"
                    />
                );

            case 'selection':
                return (
                    <div className="relative">
                        <select
                            value={value}
                            onChange={(e) => handleFieldChange(field_name, e.target.value)}
                            required={required}
                            className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 appearance-none cursor-pointer text-base"
                        >
                            <option value="">Select {field_name.replace(/_/g, ' ')}</option>
                            {options?.map((option, index) => (
                                <option key={index} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                );

            case 'file':
                const currentFiles = Array.isArray(value) ? value : [];
                const isImageField = field_name.toLowerCase().includes('image') || field_name.toLowerCase().includes('photo');
                const acceptTypes = isImageField ? 'image/*' : '.pdf,.doc,.docx,.txt,.zip,.rar';
                const maxFiles = max_images || 1;
                const canUploadMore = currentFiles.length < maxFiles;

                return (
                    <div className="space-y-4">
                        {/* File Upload Input */}
                        <div className="relative">
                            <input
                                type="file"
                                accept={acceptTypes}
                                multiple={maxFiles > 1}
                                onChange={(e) => {
                                    const files = Array.from(e.target.files);
                                    if (files.length === 0) return;

                                    // Check if we can upload these files
                                    if (currentFiles.length + files.length > maxFiles) {
                                        addNotification(`Cannot upload ${files.length} files. Maximum ${maxFiles} files allowed for ${field_name}`, 'warning');
                                        e.target.value = ''; // Clear input
                                        return;
                                    }

                                    handleFileUpload(field_name, files);
                                    e.target.value = ''; // Clear input after processing
                                }}
                                disabled={isUploading || !canUploadMore}
                                className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-base file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 file:cursor-pointer"
                            />
                        </div>

                        {/* Upload Status */}
                        {isUploading && (
                            <div className="flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span className="text-blue-700 dark:text-blue-300 text-sm">Uploading files...</span>
                            </div>
                        )}

                        {/* File Limit Info */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                {currentFiles.length} of {maxFiles} file(s) uploaded
                            </span>
                            {!canUploadMore ? (
                                <span className="text-sm text-amber-600 dark:text-amber-400 font-medium bg-amber-100 dark:bg-amber-900/20 px-2 py-1 rounded-full">
                                    Maximum reached
                                </span>
                            ) : (
                                <span className="text-sm text-green-600 dark:text-green-400 font-medium bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
                                    Can add {maxFiles - currentFiles.length} more
                                </span>
                            )}
                        </div>

                        {/* Individual Image Update - Only show when editing and there are existing files */}
                        {isEditing && currentFiles.length > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                                <h4 className="text-base font-semibold text-blue-800 dark:text-blue-200 mb-3">
                                    Update Individual Images
                                </h4>
                                <div className="space-y-3">
                                    {currentFiles.map((filePath, index) => {
                                        const isImage = field_name.toLowerCase().includes('image') || field_name.toLowerCase().includes('photo');
                                        const fileName = filePath.split('\\').pop() || filePath.split('/').pop();

                                        return (
                                            <div key={index} className="bg-white/80 dark:bg-gray-700/80 rounded-xl p-3 border border-white/50 dark:border-gray-600/50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-3">
                                                        {isImage && (
                                                            <img
                                                                src={`/uploads/${filePath.replace(/\\/g, '/')}`}
                                                                alt={fileName}
                                                                className="w-12 h-12 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {fileName}
                                                            </span>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                Click below to replace this image
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <a
                                                            href={`/uploads/${filePath.replace(/\\/g, '/')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200"
                                                        >
                                                            View
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveFile(field_name, index)}
                                                            className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors duration-200"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Individual Image Update Input */}
                                                <div className="mt-2">
                                                    <input
                                                        type="file"
                                                        accept={acceptTypes}
                                                        multiple={false}
                                                        onChange={async (e) => {
                                                            const files = Array.from(e.target.files);
                                                            if (files.length === 0) return;

                                                            if (files.length > 1) {
                                                                addNotification('Please select only one image to replace this specific image', 'warning');
                                                                e.target.value = '';
                                                                return;
                                                            }

                                                            if (window.confirm(`Replace "${fileName}" with "${files[0].name}"?`)) {
                                                                try {
                                                                    // Set uploading state
                                                                    setUploadingFields(prev => new Set([...prev, field_name]));

                                                                    // Upload new file
                                                                    const response = await ownerApi.uploadImage(files[0], field_name);
                                                                    if (response.data.success) {
                                                                        const newFilePath = response.data.file_path;

                                                                        // Update form data - replace only this specific image
                                                                        setFormData(prev => {
                                                                            const currentFiles = [...(prev.dynamic_data[field_name] || [])];
                                                                            currentFiles[index] = newFilePath; // Replace only this index

                                                                            return {
                                                                                ...prev,
                                                                                dynamic_data: {
                                                                                    ...prev.dynamic_data,
                                                                                    [field_name]: currentFiles
                                                                                }
                                                                            };
                                                                        });

                                                                        addNotification(`✅ Successfully replaced "${fileName}" with "${files[0].name}"!`, 'success');
                                                                    } else {
                                                                        throw new Error(response.data.error || 'Upload failed');
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Error updating individual image:', error);
                                                                    addNotification(`❌ Error updating image: ${error.message}`, 'error');
                                                                } finally {
                                                                    setUploadingFields(prev => {
                                                                        const newSet = new Set(prev);
                                                                        newSet.delete(field_name);
                                                                        return newSet;
                                                                    });
                                                                }
                                                            }
                                                            e.target.value = '';
                                                        }}
                                                        disabled={isUploading}
                                                        className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-500 file:text-white hover:file:bg-blue-600 file:cursor-pointer"
                                                    />
                                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 text-center">
                                                        Replace this specific image
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Show uploaded files - Only show when NOT editing to avoid duplication */}
                        {!isEditing && currentFiles.length > 0 && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4">
                                <h4 className="text-base font-semibold text-green-800 dark:text-green-200 mb-3">
                                    Uploaded Files ({currentFiles.length})
                                </h4>
                                <div className="space-y-2">
                                    {currentFiles.map((filePath, index) => {
                                        const isImage = field_name.toLowerCase().includes('image') || field_name.toLowerCase().includes('photo');
                                        const fileName = filePath.split('\\').pop() || filePath.split('/').pop();

                                        return (
                                            <div key={index} className="flex items-center justify-between p-2 bg-white/80 dark:bg-gray-700/80 rounded-lg border border-white/50 dark:border-gray-600/50">
                                                <div className="flex items-center space-x-3">
                                                    {isImage && (
                                                        <img
                                                            src={`/uploads/${filePath.replace(/\\/g, '/')}`}
                                                            alt={fileName}
                                                            className="w-10 h-10 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                    )}
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {fileName}
                                                    </span>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <a
                                                        href={`/uploads/${filePath.replace(/\\/g, '/')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors duration-200"
                                                    >
                                                        View
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveFile(field_name, index)}
                                                        className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 transition-colors duration-200"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleFieldChange(field_name, e.target.value)}
                        required={required}
                        placeholder={placeholder || `Enter ${field_name.replace(/_/g, ' ')}`}
                        className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 text-base"
                    />
                );
        }
    }, [formData.dynamic_data, uploadingFields, handleFieldChange, handleFileUpload, handleRemoveFile, addNotification, isEditing]);

    // Initialize
    useEffect(() => {
        fetchCategories();
        if (id) {
            setIsEditing(true);
            fetchRentalItem();
        }
    }, [id]); // Only depend on id to prevent infinite loops

    // Handle category requirements when categories are loaded
    useEffect(() => {
        if (categories.length > 0 && isEditing && selectedCategory) {
            const category = categories.find(cat => cat.id === parseInt(selectedCategory));
            if (category && category.requirements) {
                setCategoryRequirements(category.requirements);
            }
        }
    }, [categories, isEditing, selectedCategory]);

    if (!user || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400">Please log in to continue.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/owner/rental-items')}
                                className="group p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                            >
                                <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent dark:from-white dark:via-indigo-200 dark:to-purple-200">
                                    {isEditing ? 'Edit Rental Item' : 'Add New Rental Item'}
                                </h1>
                                <p className="text-base text-gray-600 dark:text-gray-300 mt-2">
                                    {isEditing ? 'Update your rental item information' : 'Select a category and fill in the required information'}
                                </p>
                            </div>
                        </div>

                        {/* Delete Button - Only show when editing */}
                        {isEditing && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-600 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                            >
                                {deleting ? (
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Deleting...
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete Item
                                    </div>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Form Container */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 dark:border-gray-600/40 p-6">
                    {/* Edit Mode Notice */}
                    {isEditing && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-base font-semibold text-blue-800 dark:text-blue-200">
                                        Editing Mode
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                        <p>• <strong>Cannot change:</strong> Category (contact admin if needed)</p>
                                        <p>• <strong>Can update:</strong> All item details and individual images</p>
                                        <p>• <strong>Images:</strong> Update individual images or remove them one by one</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Category Selection */}
                        <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-xl p-4">
                            <label className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
                                Category Selection <span className="text-red-500">*</span>
                            </label>
                            {categories.length === 0 ? (
                                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-700/50 rounded-xl">
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mr-2">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                        <span className="text-amber-700 dark:text-amber-300 text-sm font-medium">
                                            No categories available. Please contact an admin to create categories first.
                                        </span>
                                    </div>
                                </div>
                            ) : isEditing ? (
                                <div className="space-y-2">
                                    <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200/50 dark:border-indigo-700/50 rounded-xl text-indigo-900 dark:text-indigo-200 font-medium">
                                        {categories.find(cat => cat.id === parseInt(selectedCategory))?.name || 'Unknown Category'}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                                        Category cannot be changed after creation. Contact an admin if you need to change the category.
                                    </p>
                                </div>
                            ) : (
                                <div className="relative">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 appearance-none cursor-pointer text-base"
                                    >
                                        <option value="">Select a category for your rental item</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Category Requirements */}
                        {categoryRequirements.length > 0 && (
                            <div className="bg-gradient-to-r from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-700/90 border border-white/60 dark:border-gray-600/60 rounded-2xl p-6">
                                <div className="flex items-center mb-4">
                                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mr-3">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        Item Details
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {categoryRequirements.map((requirement) => (
                                        <div key={requirement.id || requirement.field_name} className="space-y-2">
                                            <label className="block text-base font-semibold text-gray-900 dark:text-white">
                                                {requirement.field_name.replace(/_/g, ' ')} {requirement.required && <span className="text-red-500">*</span>}
                                            </label>
                                            <div className="bg-white/70 dark:bg-gray-700/70 rounded-xl p-3 border border-gray-200/50 dark:border-gray-600/50">
                                                {renderField(requirement)}
                                            </div>
                                            {requirement.placeholder && requirement.field_type !== 'selection' && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                                                    💡 {requirement.placeholder}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-4 pt-6 border-t border-gray-200/50 dark:border-gray-600/50">
                            {/* Edit Summary - Only show when editing */}
                            {isEditing && (
                                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/50 rounded-xl">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-base font-semibold text-green-800 dark:text-green-200">
                                                Ready to Update
                                            </h3>
                                            <div className="mt-2 text-sm text-green-700 dark:text-green-300 space-y-1">
                                                <p>• Item details and field values will be updated</p>
                                                <p>• Individual image changes will be applied (updates/removals)</p>
                                                <p>• Category will remain unchanged</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate('/owner/rental-items')}
                                    className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-600 dark:hover:to-purple-700 hover:text-indigo-700 dark:hover:text-white transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            {isEditing ? 'Updating...' : 'Creating...'}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                {isEditing ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                )}
                                            </svg>
                                            {isEditing ? 'Update Item' : 'Create Item'}
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RentalItemForm;

