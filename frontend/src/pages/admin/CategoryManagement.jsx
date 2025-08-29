import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { adminApi } from '../../api/adminApi';

const CategoryManagement = () => {
  const { user, token, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

  // Requirement form state
  const [requirementForm, setRequirementForm] = useState({
    field_name: '',
    field_type: 'string',
    required: true,
    options: []
  });

  const fieldTypes = [
    { value: 'string', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'file', label: 'File' },
    { value: 'selection', label: 'Selection' }
  ];

  useEffect(() => {
    // Check authentication and role
    if (!isAuthenticated || !token) {
      showNotification('Please log in to access this page', 'error');
      return;
    }

    if (user?.role !== 'admin') {
      showNotification('Access denied. Admin privileges required.', 'error');
      return;
    }

    fetchCategories();
  }, [isAuthenticated, token, user?.role]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log('Fetching categories with token:', token);
      const response = await adminApi.getCategories();
      console.log('Categories response:', response);
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      if (error.response?.status === 401) {
        showNotification('Authentication failed. Please log in again.', 'error');
      } else if (error.response?.status === 403) {
        showNotification('Access denied. Admin privileges required.', 'error');
      } else if (error.response?.status >= 500) {
        showNotification('Server error. Please try again later.', 'error');
      } else {
        showNotification('Failed to fetch categories. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const response = await adminApi.updateCategory(editingCategory.id, categoryForm);
        console.log('Update category response:', response);

        // Update the category in the local state
        setCategories(prevCategories =>
          prevCategories.map(cat =>
            cat.id === editingCategory.id
              ? response.data.category
              : cat
          )
        );

        showNotification('Category updated successfully', 'success');
      } else {
        const response = await adminApi.createCategory(categoryForm);
        console.log('Create category response:', response);

        // Add the new category to the local state
        setCategories(prevCategories => [...prevCategories, response.data.category]);

        showNotification('Category created successfully', 'success');
      }

      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
    } catch (error) {
      console.error('Error saving category:', error);
      if (error.response?.status === 401) {
        showNotification('Authentication failed. Please log in again.', 'error');
      } else if (error.response?.status === 403) {
        showNotification('Access denied. Admin privileges required.', 'error');
      } else if (error.response?.status >= 500) {
        showNotification('Server error. Please try again later.', 'error');
      } else {
        const errorMessage = error.response?.data?.error || error.response?.data?.errors || 'Operation failed. Please try again.';
        showNotification(errorMessage, 'error');
      }
    }
  };

  const handleRequirementSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRequirement) {
        const response = await adminApi.updateCategoryRequirement(
          selectedCategory.id,
          editingRequirement.id,
          requirementForm
        );
        console.log('Update requirement response:', response);

        // Update the requirement in the local state
        setCategories(prevCategories =>
          prevCategories.map(cat => {
            if (cat.id === selectedCategory.id) {
              return {
                ...cat,
                requirements: cat.requirements.map(req =>
                  req.id === editingRequirement.id
                    ? response.data.requirement
                    : req
                )
              };
            }
            return cat;
          })
        );

        showNotification('Requirement updated successfully', 'success');
      } else {
        const response = await adminApi.addCategoryRequirement(selectedCategory.id, requirementForm);
        console.log('Add requirement response:', response);

        // Add the new requirement to the local state
        setCategories(prevCategories =>
          prevCategories.map(cat => {
            if (cat.id === selectedCategory.id) {
              return {
                ...cat,
                requirements: [...cat.requirements, response.data.requirement]
              };
            }
            return cat;
          })
        );

        showNotification('Requirement added successfully', 'success');
      }

      setShowRequirementForm(false);
      setEditingRequirement(null);
      setRequirementForm({
        field_name: '',
        field_type: 'string',
        required: true,
        options: []
      });
    } catch (error) {
      console.error('Error saving requirement:', error);
      if (error.response?.status === 401) {
        showNotification('Authentication failed. Please log in again.', 'error');
      } else if (error.response?.status === 403) {
        showNotification('Access denied. Admin privileges required.', 'error');
      } else if (error.response?.status >= 500) {
        showNotification('Server error. Please try again later.', 'error');
      } else {
        const errorMessage = error.response?.data?.error || error.response?.data?.errors || 'Operation failed. Please try again.';
        showNotification(errorMessage, 'error');
      }
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This will also delete all associated requirements.')) {
      try {
        const response = await adminApi.deleteCategory(categoryId);
        console.log('Delete category response:', response);

        // Remove the category from the local state
        setCategories(prevCategories =>
          prevCategories.filter(cat => cat.id !== categoryId)
        );

        showNotification('Category deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting category:', error);
        if (error.response?.status === 401) {
          showNotification('Authentication failed. Please log in again.', 'error');
        } else if (error.response?.status === 403) {
          showNotification('Access denied. Admin privileges required.', 'error');
        } else if (error.response?.status >= 500) {
          showNotification('Server error. Please try again later.', 'error');
        } else {
          showNotification('Failed to delete category. Please try again.', 'error');
        }
      }
    }
  };

  const handleDeleteRequirement = async (categoryId, reqId) => {
    if (window.confirm('Are you sure you want to delete this requirement?')) {
      try {
        const response = await adminApi.deleteCategoryRequirement(categoryId, reqId);
        console.log('Delete requirement response:', response);

        // Remove the requirement from the local state
        setCategories(prevCategories =>
          prevCategories.map(cat => {
            if (cat.id === categoryId) {
              return {
                ...cat,
                requirements: cat.requirements.filter(req => req.id !== reqId)
              };
            }
            return cat;
          })
        );

        showNotification('Requirement deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting requirement:', error);
        if (error.response?.status === 401) {
          showNotification('Authentication failed. Please log in again.', 'error');
        } else if (error.response?.status === 403) {
          showNotification('Access denied. Admin privileges required.', 'error');
        } else if (error.response?.status >= 500) {
          showNotification('Server error. Please try again later.', 'error');
        } else {
          showNotification('Failed to delete requirement. Please try again.', 'error');
        }
      }
    }
  };

  const openCategoryForm = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || ''
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
    }
    setShowCategoryForm(true);
  };

  const openRequirementForm = (category, requirement = null) => {
    setSelectedCategory(category);
    if (requirement) {
      setEditingRequirement(requirement);
      setRequirementForm({
        field_name: requirement.field_name,
        field_type: requirement.field_type,
        required: requirement.required,
        options: requirement.options || []
      });
    } else {
      setEditingRequirement(null);
      setRequirementForm({
        field_name: '',
        field_type: 'string',
        required: true,
        options: []
      });
    }
    setShowRequirementForm(true);
  };

  const addOption = () => {
    setRequirementForm(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index) => {
    setRequirementForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index, value) => {
    setRequirementForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  // Check authentication and role
  if (!isAuthenticated || !token) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Please log in to access this page.</p>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Category Management
          </h1>
          <button
            onClick={() => openCategoryForm()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Category
          </button>
        </div>

        {/* Categories List */}
        <div className="grid gap-6">
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No categories found. Create your first category to get started.</p>
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openCategoryForm(category)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Requirements Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Requirements ({category.requirements.length})
                    </h4>
                    <button
                      onClick={() => openRequirementForm(category)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Add Requirement
                    </button>
                  </div>

                  {category.requirements.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      No requirements defined for this category.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {category.requirements.map((req) => (
                        <div key={req.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {req.field_name}
                            </span>
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${req.required
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                              }`}>
                              {req.required ? 'Required' : 'Optional'}
                            </span>
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full">
                              {req.field_type}
                            </span>
                            {req.field_type === 'selection' && req.options && req.options.length > 0 && (
                              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Options: {req.options.join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openRequirementForm(category, req)}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRequirement(category.id, req.id)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Category Form Modal */}
        {showCategoryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    maxLength={100}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    maxLength={255}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCategoryForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Requirement Form Modal */}
        {showRequirementForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingRequirement ? 'Edit Requirement' : 'Add Requirement'}
              </h2>
              <form onSubmit={handleRequirementSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Field Name *
                  </label>
                  <input
                    type="text"
                    value={requirementForm.field_name}
                    onChange={(e) => setRequirementForm(prev => ({ ...prev, field_name: e.target.value }))}
                    required
                    maxLength={100}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Field Type *
                  </label>
                  <select
                    value={requirementForm.field_type}
                    onChange={(e) => setRequirementForm(prev => ({ ...prev, field_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {fieldTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="required"
                    checked={requirementForm.required}
                    onChange={(e) => setRequirementForm(prev => ({ ...prev, required: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="required" className="text-sm text-gray-700 dark:text-gray-300">
                    Required field
                  </label>
                </div>

                {requirementForm.field_type === 'selection' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Options *
                    </label>
                    {requirementForm.options.map((option, index) => (
                      <div key={index} className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          required
                          maxLength={100}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Option value"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addOption}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Add Option
                    </button>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowRequirementForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingRequirement ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;


