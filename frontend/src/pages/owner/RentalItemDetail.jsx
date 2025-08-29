import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { ownerApi } from '../../api/ownerApi';
import RenterRequirementsManager from '../../components/RenterRequirementsManager';

const RentalItemDetail = () => {
  const { addNotification } = useNotification();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  // State
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [showAllImages, setShowAllImages] = useState(false);


  // Fetch rental item details
  const fetchRentalItem = useCallback(async () => {
    try {
      setLoading(true);

      const response = await ownerApi.getRentalItem(id);

      setItem(response.data);

      // Fetch category details if available
      if (response.data.category_id) {
        try {
          const categoriesResponse = await ownerApi.getCategories();
          const categoryData = categoriesResponse.data.categories.find(
            cat => cat.id === response.data.category_id
          );
          setCategory(categoryData);
        } catch (error) {
          console.error('Error fetching category:', error);
        }
      }

      // Fetch renter input fields

    } catch (error) {
      console.error('Error fetching rental item:', error);
      addNotification('Error fetching rental item', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, addNotification]);



  // Delete rental item
  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this rental item?')) {
      return;
    }

    try {
      await ownerApi.deleteRentalItem(id);
      addNotification('Rental item deleted successfully', 'success');
      navigate('/owner/rental-items');
    } catch (error) {
      console.error('Error deleting rental item:', error);
      addNotification('Error deleting rental item', 'error');
    }
  }, [id, addNotification, navigate]);

  // Initialize
  useEffect(() => {
    fetchRentalItem();
  }, [fetchRentalItem]);

  if (!user || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Please log in to continue.</p>
        </div>
      </div>
    );
  }

  // Helper functions
  const getItemName = () => {
    if (!item?.dynamic_data) return null;

    // Always parse dynamic data directly from item
    let data = {};
    try {
      data = typeof item.dynamic_data === 'string'
        ? JSON.parse(item.dynamic_data)
        : (item.dynamic_data || {});
    } catch (error) {
      console.error('Error parsing dynamic data in getItemName:', error);
      return null;
    }

    if (!data || Object.keys(data).length === 0) return null;

    // First, try the specific name fields
    const nameFields = ['Item Name', 'name', 'title', 'item_name', 'product_name', 'rental_name'];
    for (const field of nameFields) {
      if (data[field] && typeof data[field] === 'string' && data[field].trim() !== '') {
        return data[field];
      }
    }

    // If no specific name field found, look for any field that might be a name
    // (exclude image fields and look for fields with "name" in the key)
    for (const [fieldName, fieldValue] of Object.entries(data)) {
      // Skip image fields
      if (fieldName.toLowerCase().includes('image') || fieldName.toLowerCase().includes('photo')) {
        continue;
      }

      // Skip empty values
      if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
        continue;
      }

      // If the field name contains "name" or the value looks like a name (not a number, not too long)
      if (fieldName.toLowerCase().includes('name') ||
        (typeof fieldValue === 'string' && fieldValue.length < 100 && !/^\d+$/.test(fieldValue))) {
        return fieldValue;
      }
    }

    return null;
  };

  const getItemPrice = () => {
    if (!item?.dynamic_data) return null;

    // Always parse dynamic data directly from item
    let data = {};
    try {
      data = typeof item.dynamic_data === 'string'
        ? JSON.parse(item.dynamic_data)
        : (item.dynamic_data || {});
    } catch (error) {
      console.error('Error parsing dynamic data in getItemPrice:', error);
      return null;
    }

    if (!data || Object.keys(data).length === 0) return null;



    // First, try the specific price fields
    const priceFields = ['Price', 'price', 'cost', 'rate', 'rental_price', 'daily_rate', 'hourly_rate'];
    for (const field of priceFields) {
      if (data[field] && data[field] !== '') {

        let price;
        if (typeof data[field] === 'number') {
          price = data[field];
        } else if (typeof data[field] === 'string') {
          const cleanValue = data[field].replace(/[^\d.,]/g, '').replace(',', '.');
          price = parseFloat(cleanValue);
        }
        if (!isNaN(price) && price > 0) {

          return price.toFixed(2);
        }
      }
    }

    // If no specific price field found, look for any field that might be a price
    for (const [fieldName, fieldValue] of Object.entries(data)) {
      // Skip image fields
      if (fieldName.toLowerCase().includes('image') || fieldName.toLowerCase().includes('photo')) {
        continue;
      }

      // Skip empty values
      if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
        continue;
      }

      // If the field name contains price-related words or the value looks like a price
      if (fieldName.toLowerCase().includes('price') ||
        fieldName.toLowerCase().includes('cost') ||
        fieldName.toLowerCase().includes('rate') ||
        (typeof fieldValue === 'string' && /[\d.,]/.test(fieldValue))) {


        let price;
        if (typeof fieldValue === 'number') {
          price = fieldValue;
        } else if (typeof fieldValue === 'string') {
          const cleanValue = fieldValue.replace(/[^\d.,]/g, '').replace(',', '.');
          price = parseFloat(cleanValue);
        }
        if (!isNaN(price) && price > 0) {

          return price.toFixed(2);
        }
      }
    }


    return null;
  };

  const getTotalImageCount = () => {
    if (!dynamicData) return 0;

    let totalCount = 0;
    Object.entries(dynamicData).forEach(([key, value]) => {
      // More comprehensive image field detection
      const isImageField = key.toLowerCase().includes('image') ||
        key.toLowerCase().includes('photo') ||
        key.toLowerCase().includes('img') ||
        key.toLowerCase().includes('pic') ||
        key.toLowerCase().includes('car mage'); // Handle the "car mage" field

      if (isImageField) {
        if (Array.isArray(value)) {
          totalCount += value.length;
        } else if (value && typeof value === 'string' && value.trim() !== '') {
          totalCount += 1;
        }
      }
    });
    return totalCount;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">Rental item not found.</p>
        </div>
      </div>
    );
  }

  // Parse dynamic data
  let dynamicData = {};
  try {

    dynamicData = typeof item.dynamic_data === 'string'
      ? JSON.parse(item.dynamic_data)
      : (item.dynamic_data || {});

  } catch (error) {
    console.error('Error parsing dynamic data:', error);
    dynamicData = {};
  }

  // Get item images
  const getItemImages = () => {
    const images = [];
    Object.entries(dynamicData).forEach(([key, value]) => {
      // More comprehensive image field detection
      const isImageField = key.toLowerCase().includes('image') ||
        key.toLowerCase().includes('photo') ||
        key.toLowerCase().includes('img') ||
        key.toLowerCase().includes('pic') ||
        key.toLowerCase().includes('car mage'); // Handle the "car mage" field

      if (isImageField) {
        if (Array.isArray(value)) {
          value.forEach(img => images.push({ field: key, path: img }));
        } else if (typeof value === 'string' && value.trim() !== '') {
          images.push({ field: key, path: value });
        }
      }
    });
    return images;
  };

  const itemImages = getItemImages();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/owner/rental-items')}
              className="group p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent dark:from-white dark:via-indigo-200 dark:to-purple-200">
                Item Details
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                View complete information about your rental item
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/owner/rental-items/${item.id}/edit`)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Item
              </div>
            </button>
            <button
              onClick={handleDelete}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-600 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Item
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Item Overview Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-gray-600/40 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Item Overview
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {/* Item Name */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-2xl border border-blue-200/50 dark:border-blue-600/50">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">Item Name</div>
                <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                  {getItemName() || 'Not specified'}
                </div>

              </div>

              {/* Category */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-2xl border border-green-200/50 dark:border-green-600/50">
                <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">Category</div>
                <div className="text-xl font-bold text-green-900 dark:text-green-100">
                  {category?.name || 'Unknown'}
                </div>
              </div>

              {/* Price */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-2xl border border-purple-200/50 dark:border-purple-600/50">
                <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">Price</div>
                <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                  {getItemPrice() ? `$${getItemPrice()}` : 'Not specified'}
                </div>

              </div>

              {/* Created Date */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-4 rounded-2xl border border-teal-200/50 dark:border-teal-600/50">
                <div className="text-sm font-medium text-teal-600 dark:text-teal-400 mb-2">Created Date</div>
                <div className="text-xl font-bold text-teal-900 dark:text-teal-100">
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Status */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-2xl border border-orange-200/50 dark:border-orange-600/50">
                <div className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">Status</div>
                <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${item.is_available
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                    }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${item.is_available ? 'bg-white' : 'bg-white'}`}></div>
                    {item.is_available ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>
            </div>
          </div>





          {/* Complete Item Information - All Dynamic Data */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-gray-600/40 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Complete Item Information
              </h2>
            </div>

            {Object.keys(dynamicData).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(dynamicData).map(([fieldName, fieldValue]) => {
                  // Skip image fields as they're shown in the Images section
                  if (fieldName.toLowerCase().includes('image') || fieldName.toLowerCase().includes('photo')) {
                    return null;
                  }

                  // Format the field value for display
                  let displayValue = fieldValue;
                  if (Array.isArray(fieldValue)) {
                    displayValue = fieldValue.join(', ');
                  } else if (typeof fieldValue === 'string' && fieldValue.trim() === '') {
                    displayValue = 'Not specified';
                  } else if (fieldValue === null || fieldValue === undefined) {
                    displayValue = 'Not specified';
                  }

                  return (
                    <div key={fieldName} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-4 rounded-2xl border border-gray-200/50 dark:border-gray-600/50">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {displayValue}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">No additional item information available</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add more details when creating or editing this item</p>
              </div>
            )}
          </div>

          {/* Renter Requirements Management - Only for owners */}
          {user.role === 'owner' && (
            <div>
              <RenterRequirementsManager key={`renter-requirements-${item.id}`} itemId={item.id} onUpdate={fetchRentalItem} />
            </div>
          )}

          {/* Images Gallery */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-gray-600/40 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  All Images ({getTotalImageCount()} total)
                </h2>
              </div>
              {getTotalImageCount() > 0 && (
                <button
                  onClick={() => setShowAllImages(!showAllImages)}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-xl hover:from-pink-600 hover:to-rose-600 transform hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                >
                  <svg className={`w-4 h-4 mr-2 transition-transform duration-300 ${showAllImages ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {showAllImages ? 'Hide Images' : 'Show Images'}
                </button>
              )}
            </div>

            {getTotalImageCount() > 0 && showAllImages ? (
              <div className="space-y-6">
                {/* All Images in Single Row */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    All Uploaded Images
                    <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                      ({getTotalImageCount()} total)
                    </span>
                  </h3>

                  {/* Single Flex Row for All Images */}
                  <div className="relative">
                    <div className="flex flex-row flex-wrap gap-8 overflow-x-auto pb-4 px-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                      {itemImages.map((imageData, index) => {
                        const fileName = imageData.path.split('\\').pop() || imageData.path.split('/').pop();
                        const displayName = fileName ? fileName.split('.')[0] : `Image ${index + 1}`;

                        return (
                          <div key={index} className="group relative flex-shrink-0 w-40 mx-4">
                            <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                              <img
                                src={`/uploads/${imageData.path.replace(/\\/g, '/')}`}
                                alt={`${imageData.field} - ${displayName}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              {/* Fallback for failed images */}
                              <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100 dark:bg-gray-700" style={{ display: 'none' }}>
                                <div className="text-center">
                                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-xs">{displayName}</span>
                                </div>
                              </div>
                            </div>

                            {/* Image Label */}
                            <div className="mt-2 text-center">
                              <span className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                                {displayName}
                              </span>
                            </div>

                            {/* View Full Size Button */}
                            <a
                              href={`/uploads/${imageData.path.replace(/\\/g, '/')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/90"
                              title="View full size"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                    {/* Gradient fade effects for scroll indication */}
                    <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-white/80 to-transparent dark:from-gray-800/80 pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-white/80 to-transparent dark:from-gray-800/80 pointer-events-none"></div>
                  </div>
                </div>
              </div>
            ) : getTotalImageCount() > 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-pink-600 dark:text-pink-400 text-lg">Images are hidden</p>
                <p className="text-pink-500 dark:text-pink-300 text-sm mt-1">Click "Show Images" to view all uploaded images</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">No images uploaded for this item</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Upload some images to make your item more attractive</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalItemDetail;

