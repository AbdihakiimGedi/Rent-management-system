import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { bookingApi } from '../../api/bookingApi';
import { ownerApi } from '../../api/ownerApi';
import { rentalApi } from '../../api/rentalApi';
import Button from '../../components/Button';

const BookingForm = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookingData, setBookingData] = useState({
    rental_item_id: '',
    renter_id: '',
    owner_id: '',
    requirements_data: {},
    contract_accepted: false,
    status: 'Pending',
    payment_status: 'HELD',
    payment_amount: '',
    service_fee: 0,
    payment_method: '',
    payment_account: ''
  });

  const [loading, setLoading] = useState(false);
  const [rentalItems, setRentalItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [renterFields, setRenterFields] = useState([]);
  const [selectedRentalItem, setSelectedRentalItem] = useState(null);

  // New booking flow states
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryRentalItems, setCategoryRentalItems] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingCategoryItems, setLoadingCategoryItems] = useState(false);
  const [isNewBooking, setIsNewBooking] = useState(false);

  useEffect(() => {
    if (id) {
      // Editing existing booking
      const fetchBooking = async () => {
        setLoading(true);
        try {
          const response = await bookingApi.getBookingDetails(id);
          setBookingData(response);
          if (response.rental_item_id) {
            await fetchRenterFields(response.rental_item_id);
          }
        } catch (error) {
          addNotification('Error fetching booking details', 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchBooking();
      setIsNewBooking(false);
    } else {
      // Creating new booking
      setIsNewBooking(true);
      fetchCategories();
    }

    // Fetch rental items and users for dropdowns (only for editing)
    if (id) {
      fetchRentalItems();
      fetchUsers();
    }
  }, [id, addNotification]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await rentalApi.getCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      addNotification('Error fetching categories', 'error');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchRentalItemsByCategory = async (categoryId) => {
    try {
      setLoadingCategoryItems(true);
      const response = await rentalApi.getItemsByCategory(categoryId);
      setCategoryRentalItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching rental items:', error);
      addNotification('Error fetching rental items', 'error');
      setCategoryRentalItems([]);
    } finally {
      setLoadingCategoryItems(false);
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setSelectedRentalItem(null);
    setRenterFields([]);
    setBookingData(prev => ({
      ...prev,
      rental_item_id: '',
      requirements_data: {}
    }));
    await fetchRentalItemsByCategory(category.id);
  };

  const handleRentalItemSelect = async (rentalItem) => {
    setSelectedRentalItem(rentalItem);
    setBookingData(prev => ({
      ...prev,
      rental_item_id: rentalItem.id
    }));
    await fetchRenterFields(rentalItem.id);
  };

  const getItemName = (dynamicData) => {
    if (!dynamicData) return 'Unnamed Item';

    const nameFields = ['Item Name', 'name', 'title', 'item_name', 'product_name', 'rental_name'];
    for (const field of nameFields) {
      if (dynamicData[field] && typeof dynamicData[field] === 'string' && dynamicData[field].trim() !== '') {
        return dynamicData[field];
      }
    }

    // Look for any field that might be a name
    for (const [fieldName, fieldValue] of Object.entries(dynamicData)) {
      if (fieldName.toLowerCase().includes('image') || fieldName.toLowerCase().includes('photo')) {
        continue;
      }
      if (fieldValue && typeof fieldValue === 'string' && fieldValue.length < 100 && !/^\d+$/.test(fieldValue)) {
        return fieldValue;
      }
    }

    return 'Unnamed Item';
  };

  const getItemPrice = (dynamicData) => {
    if (!dynamicData) return null;

    const priceFields = ['Price', 'price', 'Daily Rate', 'daily_rate', 'Hourly Rate', 'hourly_rate', 'Cost', 'cost'];
    for (const field of priceFields) {
      if (dynamicData[field] && !isNaN(parseFloat(dynamicData[field]))) {
        return parseFloat(dynamicData[field]);
      }
    }

    // Look for any field that might be a price
    for (const [fieldName, fieldValue] of Object.entries(dynamicData)) {
      if (fieldName.toLowerCase().includes('image') || fieldName.toLowerCase().includes('photo')) {
        continue;
      }
      if (fieldValue && (fieldName.toLowerCase().includes('price') || fieldName.toLowerCase().includes('cost') || fieldName.toLowerCase().includes('rate'))) {
        const price = parseFloat(fieldValue);
        if (!isNaN(price) && price > 0) {
          return price;
        }
      }
    }

    return null;
  };

  const fetchRentalItems = async () => {
    try {
      // This would be replaced with actual API call
      setRentalItems([
        { id: 1, name: 'Rental Item 1' },
        { id: 2, name: 'Rental Item 2' },
        { id: 3, name: 'Rental Item 3' }
      ]);
    } catch (error) {
      console.error('Error fetching rental items:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      // This would be replaced with actual API call
      setUsers([
        { id: 1, username: 'User 1' },
        { id: 2, username: 'User 2' },
        { id: 3, username: 'User 3' }
      ]);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchRenterFields = async (rentalItemId) => {
    try {
      const response = await ownerApi.getRenterInputFields(rentalItemId);
      setRenterFields(response.data.renter_input_fields || []);

      // Initialize requirements_data with empty values for each field
      const initialRequirements = {};
      response.data.renter_input_fields.forEach(field => {
        initialRequirements[field.field_name] = '';
      });

      setBookingData(prev => ({
        ...prev,
        requirements_data: { ...prev.requirements_data, ...initialRequirements }
      }));
    } catch (error) {
      console.error('Error fetching renter fields:', error);
      setRenterFields([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBookingData({
      ...bookingData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleRentalItemChange = async (rentalItemId) => {
    setBookingData(prev => ({ ...prev, rental_item_id: rentalItemId, requirements_data: {} }));
    setRenterFields([]);

    if (rentalItemId) {
      await fetchRenterFields(rentalItemId);
    }
  };

  const handleRequirementChange = (fieldName, value) => {
    setBookingData(prev => ({
      ...prev,
      requirements_data: {
        ...prev.requirements_data,
        [fieldName]: value
      }
    }));
  };

  // Helper function to render input field based on field type
  const renderRequirementField = (field) => {
    const { field_name, field_type, required, options } = field;
    const value = bookingData.requirements_data[field_name] || '';

    switch (field_type) {
      case 'string':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleRequirementChange(field_name, e.target.value)}
            required={required}
            placeholder={`Enter ${field_name}`}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleRequirementChange(field_name, e.target.value)}
            required={required}
            placeholder={`Enter ${field_name}`}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleRequirementChange(field_name, e.target.value)}
            required={required}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        );

      case 'file':
        return (
          <input
            type="file"
            onChange={(e) => handleRequirementChange(field_name, e.target.files[0])}
            required={required}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        );

      case 'selection':
        return (
          <select
            value={value}
            onChange={(e) => handleRequirementChange(field_name, e.target.value)}
            required={required}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Select {field_name}</option>
            {options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleRequirementChange(field_name, e.target.value)}
            required={required}
            placeholder={`Enter ${field_name}`}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate new booking flow
    if (isNewBooking) {
      if (!selectedCategory) {
        addNotification('Please select a category first', 'error');
        return;
      }
      if (!selectedRentalItem) {
        addNotification('Please select a rental item first', 'error');
        return;
      }
      if (!bookingData.contract_accepted) {
        addNotification('Please accept the contract to continue', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      if (id) {
        await bookingApi.updateBooking(id, bookingData);
        addNotification('Booking updated successfully', 'success');
      } else {
        await bookingApi.createBooking(bookingData);
        addNotification('Booking created successfully', 'success');
      }
      navigate('/bookings');
    } catch (error) {
      addNotification('Error saving booking', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {id ? 'Edit Booking' : 'Create New Booking'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Progress Indicator for New Bookings */}
          {isNewBooking && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Booking Progress
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedCategory ? (selectedRentalItem ? '3/3' : '2/3') : '1/3'}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: selectedCategory
                      ? (selectedRentalItem ? '100%' : '66%')
                      : '33%'
                  }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className={selectedCategory ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}>
                  Select Category
                </span>
                <span className={selectedCategory ? (selectedRentalItem ? 'text-indigo-600 dark:text-indigo-400 font-medium' : '') : ''}>
                  Select Item
                </span>
                <span className={selectedCategory && selectedRentalItem ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}>
                  Fill Details
                </span>
              </div>
            </div>
          )}

          {/* New Booking Flow - Category and Item Selection */}
          {isNewBooking && (
            <>
              {/* Category Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Step 1: Select Category
                </h3>
                {loadingCategories ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        onClick={() => handleCategorySelect(category)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${selectedCategory?.id === category.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500'
                          }`}
                      >
                        <div className="text-center">
                          <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${selectedCategory?.id === category.id
                            ? 'bg-indigo-100 dark:bg-indigo-800'
                            : 'bg-gray-100 dark:bg-gray-700'
                            }`}>
                            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            {category.name}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {category.description || 'No description'}
                          </p>
                          <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            {category.item_count} item{category.item_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rental Item Selection */}
              {selectedCategory && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Step 2: Select Rental Item from {selectedCategory.name}
                  </h3>
                  {loadingCategoryItems ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : categoryRentalItems.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 01-.707-.293l-2.414-2.414a1 1 0 00-.707-.293H6.414a1 1 0 00-.707.293L3.293 13.293A1 1 0 003 14v5a2 2 0 002 2h14a2 2 0 002-2v-5a1 1 0 00-.293-.707z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No items available yet
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        This category doesn't have any rental items yet. Please select another category.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryRentalItems.map((item) => {
                        const itemName = getItemName(item.dynamic_data);
                        const itemPrice = getItemPrice(item.dynamic_data);

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleRentalItemSelect(item)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${selectedRentalItem?.id === item.id
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500'
                              }`}
                          >
                            <div className="text-center">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                {itemName}
                              </h4>
                              {itemPrice ? (
                                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                                  ${itemPrice.toLocaleString()}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                  Price not set
                                </div>
                              )}
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Item #{item.id}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Existing Rental Item Selection (for editing) */}
          {!isNewBooking && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rental Item *
              </label>
              <select
                name="rental_item_id"
                value={bookingData.rental_item_id}
                onChange={(e) => handleRentalItemChange(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select a rental item</option>
                {rentalItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Renter Selection - Only for editing existing bookings */}
          {!isNewBooking && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Renter *
              </label>
              <select
                name="renter_id"
                value={bookingData.renter_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select a renter</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Owner Selection - Only for editing existing bookings */}
          {!isNewBooking && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Owner *
              </label>
              <select
                name="owner_id"
                value={bookingData.owner_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select an owner</option>
                {users.filter(u => u.role === 'owner').map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selected Item Summary for New Bookings */}
          {isNewBooking && selectedRentalItem && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-100 mb-3">
                Selected Rental Item
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Item Name:</p>
                  <p className="text-indigo-900 dark:text-indigo-100">{getItemName(selectedRentalItem.dynamic_data)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Category:</p>
                  <p className="text-indigo-900 dark:text-indigo-100">{selectedCategory?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Item ID:</p>
                  <p className="text-indigo-900 dark:text-indigo-100">#{selectedRentalItem.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Price:</p>
                  <p className="text-indigo-900 dark:text-indigo-100">
                    {getItemPrice(selectedRentalItem.dynamic_data)
                      ? `$${getItemPrice(selectedRentalItem.dynamic_data).toLocaleString()}`
                      : 'Price not set'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Renter Requirements */}
          {renterFields.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {isNewBooking ? 'Step 3: ' : ''}Renter Requirements
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please provide the following information as required by the owner:
              </p>
              {renterFields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {field.field_name} {field.required && '*'}
                  </label>
                  {renderRequirementField(field)}
                </div>
              ))}
            </div>
          )}

          {/* Contract Accepted */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="contract_accepted"
              checked={bookingData.contract_accepted}
              onChange={handleChange}
              required
              className="4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
            />
            <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Contract Accepted *
            </label>
          </div>

          {/* Status - Only for editing existing bookings */}
          {!isNewBooking && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={bookingData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* Payment Status - Only for editing existing bookings */}
          {!isNewBooking && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Status
              </label>
              <select
                name="payment_status"
                value={bookingData.payment_status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="HELD">HELD</option>
                <option value="RELEASED">RELEASED</option>
                <option value="FORFEITED">FORFEITED</option>
              </select>
            </div>
          )}

          {/* Payment Amount - Only for editing existing bookings */}
          {!isNewBooking && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Amount *
              </label>
              <input
                type="number"
                name="payment_amount"
                value={bookingData.payment_amount}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Service Fee - Only for editing existing bookings */}
          {!isNewBooking && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Service Fee
              </label>
              <input
                type="number"
                name="service_fee"
                value={bookingData.service_fee}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Payment Method - Only for editing existing bookings */}
          {!isNewBooking && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Method *
              </label>
              <select
                name="payment_method"
                value={bookingData.payment_method}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select payment method</option>
                <option value="EVC_PLUS">EVC Plus</option>
                <option value="BANK">Bank Transfer</option>
              </select>
            </div>
          )}

          {/* Payment Account - Only for editing existing bookings */}
          {!isNewBooking && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Account *
              </label>
              <input
                type="text"
                name="payment_account"
                value={bookingData.payment_account}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Enter payment account details"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/bookings')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={isNewBooking && (!selectedCategory || !selectedRentalItem || !bookingData.contract_accepted)}
            >
              {loading ? 'Saving...' : (id ? 'Update Booking' : 'Create Booking')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;