import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { ownerApi } from '../../api/ownerApi';
import Button from '../../components/Button';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ RentalItemList Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
              🚨 Something went wrong
            </h1>
            <p className="text-red-600 dark:text-red-300 mb-4">
              The rental items page encountered an error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Refresh Page
            </button>
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-red-600 dark:text-red-300">
                Error Details
              </summary>
              <pre className="mt-2 text-xs text-red-500 bg-red-100 dark:bg-red-900 p-2 rounded overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const RentalItemList = () => {
  return (
    <ErrorBoundary>
      <RentalItemListContent />
    </ErrorBoundary>
  );
};

const RentalItemListContent = () => {
  const { addNotification } = useNotification();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State
  const [rentalItems, setRentalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Fetch rental items
  const fetchRentalItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ownerApi.getRentalItems();
   
      setRentalItems(response.data.rental_items || []);

      setRentalItems(response.data.rental_items || []);
} catch (error) {
  console.error('Error fetching rental items:', error);
  addNotification('Error fetching rental items', 'error');
} finally {
  setLoading(false);
}
}, [addNotification]);

// Fetch categories for filtering
const fetchCategories = useCallback(async () => {
  try {
    const response = await ownerApi.getCategories();
    setCategories(response.data.categories || []);
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
}, []);

// Delete rental item
const handleDelete = useCallback(async (itemId) => {
  if (!window.confirm('Are you sure you want to delete this rental item?')) {
    return;
  }

  try {
    await ownerApi.deleteRentalItem(itemId);
    addNotification('Rental item deleted successfully', 'success');
    fetchRentalItems(); // Refresh the list
  } catch (error) {
    console.error('Error deleting rental item:', error);
    addNotification('Error deleting rental item', 'error');
  }
}, [addNotification, fetchRentalItems]);

// Get item image from dynamic data
const getItemImage = useCallback((item) => {
  if (!item.dynamic_data) {
    return null;
  }

  try {
    // Parse dynamic_data if it's a string
    const data = typeof item.dynamic_data === 'string'
      ? JSON.parse(item.dynamic_data)
      : item.dynamic_data;

    // Look for image fields in dynamic data
    const imageField = Object.entries(data).find(([key, value]) => {
      const isImageField = key.toLowerCase().includes('image') || key.toLowerCase().includes('photo');
      return isImageField && value && (
        (Array.isArray(value) && value.length > 0) ||
        (typeof value === 'string' && value.trim() !== '')
      );
    });

    if (imageField) {
      const imageValue = imageField[1];
      if (Array.isArray(imageValue)) {
        return imageValue[0]; // Return first image from array
      } else {
        return imageValue; // Return single image string
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing dynamic_data for item:', item.id, error);
    return null;
  }
}, []);

// Get item name from dynamic data
const getItemName = useCallback((item) => {
  if (!item.dynamic_data) return `Item ${item.id}`;

  try {
    // Parse dynamic_data if it's a string
    const data = typeof item.dynamic_data === 'string'
      ? JSON.parse(item.dynamic_data)
      : item.dynamic_data;

    // Look for name-related fields with priority order
    const nameFields = [
      'name', 'title', 'item_name', 'product_name', 'rental_name',
      'description', 'item_description', 'product_description'
    ];

    for (const fieldName of nameFields) {
      const value = data[fieldName];
      if (value && typeof value === 'string' && value.trim() !== '') {
        return value.trim();
      }
    }

    // If no specific name fields, look for any field that might contain a name
    const nameField = Object.entries(data).find(([key, value]) => {
      const isNameField = key.toLowerCase().includes('name') ||
        key.toLowerCase().includes('title') ||
        key.toLowerCase().includes('item') ||
        key.toLowerCase().includes('product');
      return isNameField && value && typeof value === 'string' && value.trim() !== '';
    });

    if (nameField) {
      return nameField[1].trim();
    }

    return `Item ${item.id}`;
  } catch (error) {
    console.error('Error parsing dynamic_data for item:', item.id, error);
    return `Item ${item.id}`;
  }
}, []);

// Get item price from dynamic data
const getItemPrice = useCallback((item) => {
  if (!item.dynamic_data) return null;

  try {
    // Parse dynamic_data if it's a string
    const data = typeof item.dynamic_data === 'string'
      ? JSON.parse(item.dynamic_data)
      : item.dynamic_data;

    // Debug: Log the data to see what fields are available
    console.log('=== PRICE DEBUG ===');
    console.log('Item ID:', item.id);
    console.log('Dynamic data:', data);
    console.log('Available fields:', Object.keys(data));

    // Look for price-related fields with priority order
    const priceFields = [
      'price', 'cost', 'rate', 'rental_price', 'daily_rate', 'hourly_rate',
      'weekly_rate', 'monthly_rate', 'amount', 'fee'
    ];

    for (const fieldName of priceFields) {
      const value = data[fieldName];
      console.log(`Checking field "${fieldName}":`, value, 'Type:', typeof value);

      if (value !== null && value !== undefined && value !== '') {
        // Try to parse as number
        let price;
        if (typeof value === 'number') {
          price = value;
        } else if (typeof value === 'string') {
          // Remove currency symbols and whitespace
          const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
          price = parseFloat(cleanValue);
        }

        console.log(`Parsed price for "${fieldName}":`, price);

        if (!isNaN(price) && price > 0) {
          console.log(`✅ Found valid price: $${price.toFixed(2)}`);
          return `$${price.toFixed(2)}`;
        }
      }
    }

    // If no standard price fields found, look for any field that might contain a price
    console.log('🔍 Searching for any field that might contain a price...');
    for (const [key, value] of Object.entries(data)) {
      const isPriceField = key.toLowerCase().includes('price') ||
        key.toLowerCase().includes('cost') ||
        key.toLowerCase().includes('rate') ||
        key.toLowerCase().includes('amount') ||
        key.toLowerCase().includes('fee') ||
        key.toLowerCase().includes('charge');

      if (isPriceField && value !== null && value !== undefined && value !== '') {
        console.log(`Found potential price field "${key}":`, value);

        let price;
        if (typeof value === 'number') {
          price = value;
        } else if (typeof value === 'string') {
          const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
          price = parseFloat(cleanValue);
        }

        if (!isNaN(price) && price > 0) {
          console.log(`✅ Found valid price in "${key}": $${price.toFixed(2)}`);
          return `$${price.toFixed(2)}`;
        }
      }
    }

    console.log('❌ No valid price found');
    return null;
  } catch (error) {
    console.error('Error parsing dynamic_data for item:', item.id, error);
    return null;
  }
}, []);

// Filter items based on search and category
const filteredItems = rentalItems.filter(item => {
  const matchesSearch = searchTerm === '' ||
    getItemName(item).toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category_name?.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesCategory = selectedCategory === '' ||
    item.category_id === parseInt(selectedCategory);

  return matchesSearch && matchesCategory;
});

// Initialize
useEffect(() => {
  try {
    fetchRentalItems();
    fetchCategories();
  } catch (error) {
    console.error('❌ Error in useEffect:', error);
  }
}, [fetchRentalItems, fetchCategories]);

// Add a simple loading state for debugging
if (loading && rentalItems.length === 0) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading rental items...</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Please wait</p>
      </div>
    </div>
  );
}



if (!user || !isAuthenticated) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">Please log in to continue.</p>
      </div>
    </div>
  );
}

// Add error state for debugging
if (!loading && rentalItems.length === 0) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            No Rental Items Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            It looks like you don't have any rental items yet.
          </p>
          <button
            onClick={() => navigate('/owner/rental-items/new')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add Your First Item
          </button>
        </div>
      </div>
    </div>
  );
}

return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent dark:from-white dark:via-indigo-200 dark:to-purple-200 mb-4">
            My Rental Items
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Manage your rental inventory with ease. Add, edit, and organize your items efficiently.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/owner/rental-items/new')}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 ease-out hover:from-indigo-700 hover:to-purple-700"
          >
            <svg className="w-6 h-6 mr-3 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Item
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl blur opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
          </button>


        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 mb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search your rental items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="lg:w-64">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-4 bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
              >
                <option value="">All Categories</option>
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
          </div>
        </div>
      </div>



      {/* Content Section */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="mt-4 text-center">
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading your items...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Please wait a moment</p>
              </div>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-3xl mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              No rental items found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {searchTerm || selectedCategory
                ? 'Try adjusting your search or filters to find what you\'re looking for'
                : 'Get started by adding your first rental item to build your inventory'
              }
            </p>
            {!searchTerm && !selectedCategory && (
              <button
                onClick={() => navigate('/owner/rental-items/new')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Your First Item
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => {
              // Parse dynamic_data if it's a string, otherwise use as is
              let dynamicData = {};
              try {
                if (item.dynamic_data) {
                  dynamicData = typeof item.dynamic_data === 'string'
                    ? JSON.parse(item.dynamic_data)
                    : item.dynamic_data;
                }
              } catch (error) {
                console.error(`❌ Error parsing dynamic_data for item ${item.id}:`, error);
                dynamicData = {};
              }

              // Find image field (any field containing image paths)
              const imageFields = Object.entries(dynamicData).find(([key, value]) => {
                // Look for any field that contains image data
                if (Array.isArray(value)) {
                  return value.some(img => typeof img === 'string' && img.includes('rental_items'));
                } else if (typeof value === 'string') {
                  return value.includes('rental_items');
                }
                return false;
              });

              // Extract the first image from the found field
              let itemImage = null;
              if (imageFields) {
                if (Array.isArray(imageFields[1])) {
                  // If it's an array, take the first image
                  itemImage = imageFields[1].find(img => typeof img === 'string' && img.includes('rental_items'));
                } else if (typeof imageFields[1] === 'string' && imageFields[1].includes('rental_items')) {
                  // If it's a direct string
                  itemImage = imageFields[1];
                }
              }

              // Fallback: If no image found, try to find any image in dynamic data
              if (!itemImage) {
                // Look through all fields for any image
                for (const [key, value] of Object.entries(dynamicData)) {
                  if (Array.isArray(value)) {
                    const foundImage = value.find(v => typeof v === 'string' && v.includes('rental_items'));
                    if (foundImage) {
                      itemImage = foundImage;
                      break;
                    }
                  } else if (typeof value === 'string' && value.includes('rental_items')) {
                    itemImage = value;
                    break;
                  }
                }
              }





              // Get item name from dynamic data
              const itemName = Object.entries(dynamicData).find(([key, value]) =>
                key.toLowerCase().includes('name') && value && value !== ''
              )?.[1] || `Item ${item.id}`;

              // Get item description from dynamic data
              const itemDescription = Object.entries(dynamicData).find(([key, value]) =>
                key.toLowerCase().includes('description') && value && value !== ''
              )?.[1] || null;

              // Get price from dynamic data
              const itemPrice = Object.entries(dynamicData).find(([key, value]) =>
                ['price', 'cost', 'rate', 'rental_price', 'daily_rate', 'hourly_rate'].includes(key.toLowerCase()) &&
                value && value !== ''
              )?.[1];

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer transform hover:-translate-y-1 transition-all duration-200 group"
                  onClick={() => navigate(`/owner/rental-items/${item.id}`)}
                >
                  {/* Image Section */}
                  <div className="relative h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    {itemImage ? (
                      <div className="relative">
                        <img
                          src={`/uploads/${itemImage.replace(/\\/g, '/')}`}
                          alt={itemName}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            console.log('Image failed to load:', e.target.src);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                          onLoad={(e) => {
                            console.log('✅ Image loaded successfully:', e.target.src);
                          }}
                        />
                        {/* Fallback for failed images */}
                        <div className="w-full h-48 flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-700" style={{ display: 'none' }}>
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>

                        {/* Image count badge if multiple images */}
                        {Array.isArray(imageFields?.[1]) && imageFields[1].length > 1 && (
                          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                            +{imageFields[1].length - 1} more
                          </div>
                        )}


                      </div>
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-700">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.is_available
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                        {item.is_available ? '✅ Available' : '❌ Not Available'}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6">
                    {/* Item Name */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                      {itemName}
                    </h3>

                    {/* Category */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      📂 {item.category_name || 'Uncategorized'}
                    </p>

                    {/* Description */}
                    {itemDescription && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {itemDescription}
                      </p>
                    )}

                    {/* Price */}
                    {itemPrice && (
                      <div className="mb-4">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          ${typeof itemPrice === 'string' ? parseFloat(itemPrice.replace(/[^\d.,]/g, '').replace(',', '.')) : itemPrice}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          navigate(`/owner/rental-items/${item.id}`);
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold py-2 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        👁️ View Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          navigate(`/owner/rental-items/${item.id}/edit`);
                        }}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                      >
                        ✏️ Edit
                      </button>
                    </div>



                    {/* Click hint */}
                    <p className="text-xs text-gray-400 text-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      💡 Click anywhere on the card to view details
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default RentalItemList;

