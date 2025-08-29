import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { bookingApi } from '../../api/bookingApi';
import { ownerApi } from '../../api/ownerApi';

const ItemRequirements = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { addNotification } = useNotification();
    const { user } = useAuth();

    // Helper function to safely create and validate dates
    const createValidDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    };

    const isValidDate = (date) => {
        return date && !isNaN(date.getTime());
    };

    const [item, setItem] = useState(null);
    const [renterFields, setRenterFields] = useState([]);
    const [requirementsData, setRequirementsData] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formValid, setFormValid] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);
    const [totalPrice, setTotalPrice] = useState(0);
    const [rentalDays, setRentalDays] = useState(0);
    const [selectedRentalPeriod, setSelectedRentalPeriod] = useState('');
    const [rentalPeriods, setRentalPeriods] = useState(0);
    const [existingPendingBooking, setExistingPendingBooking] = useState(null);

    // Find the rental period field once for use throughout the component
    const rentalPeriodField = renterFields.find(field => field.field_type === 'rental_period');

    const validateForm = useCallback(() => {
        if (renterFields.length === 0) return false;

        // Check if all required fields are filled
        const requiredFields = renterFields.filter(field => field.required);
        const missingFields = requiredFields.filter(field =>
            !requirementsData[field.field_name] ||
            (Array.isArray(requirementsData[field.field_name]) && requirementsData[field.field_name].length === 0) ||
            requirementsData[field.field_name].toString().trim() === ''
        );

        if (missingFields.length > 0) return false;

        // Check if all contract terms are accepted
        const contractFields = renterFields.filter(field =>
            field.field_type === 'contract' || field.field_type === 'contract_accept'
        );

        const missingContractAcceptance = contractFields.filter(field => {
            if (field.field_type === 'contract') {
                return requirementsData[field.field_name] !== 'I agree to the terms and conditions';
            } else if (field.field_type === 'contract_accept') {
                return requirementsData[field.field_name] !== 'Accept';
            }
            return false;
        });

        if (missingContractAcceptance.length > 0) return false;

        // Check if rental period is selected (if rental_period field exists)
        if (rentalPeriodField && rentalPeriodField.required && !requirementsData[rentalPeriodField.field_name]) {
            return false;
        }

        // Check if start and end dates are selected and valid (if date fields exist)
        const dateFields = renterFields.filter(field => field.field_type === 'date');
        if (dateFields.length >= 2) {
            const startDateField = dateFields.find(field =>
                field.field_name.toLowerCase().includes('start') || field.field_name.toLowerCase().includes('begin')
            );
            const endDateField = dateFields.find(field =>
                field.field_name.toLowerCase().includes('end') || field.field_name.toLowerCase().includes('finish') || field.field_name.toLowerCase().includes('return')
            );

            if (!startDateField || !endDateField) {
                return false;
            }

            const startDate = requirementsData[startDateField.field_name];
            const endDate = requirementsData[endDateField.field_name];

            if (!startDate || !endDate) {
                return false;
            }

            // Validate start date is today or later
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDateObj = new Date(startDate);

            // Validate start date is valid
            if (isNaN(startDateObj.getTime())) {
                return false;
            }

            if (startDateObj < today) {
                return false;
            }

            // Validate end date is at least 1 day after start date
            const endDateObj = new Date(endDate);

            // Validate end date is valid
            if (isNaN(endDateObj.getTime())) {
                return false;
            }

            const minEndDate = new Date(startDate);
            minEndDate.setDate(minEndDate.getDate() + 1);

            if (endDateObj <= minEndDate) {
                return false;
            }
        }

        return true;
    }, [renterFields, requirementsData]);

    // Calculate total price based on rental period and dates
    const calculateTotalPrice = useCallback(() => {
        if (!item || !item.dynamic_data) return;

        const itemPrice = getItemPrice(item.dynamic_data);
        console.log('🚀 ItemRequirements: calculateTotalPrice called with:', {
            item,
            dynamicData: item.dynamic_data,
            itemPrice
        });

        if (!itemPrice) return;

        // Find rental period field
        const selectedPeriod = rentalPeriodField ? requirementsData[rentalPeriodField.field_name] : null;

        console.log('🚀 ItemRequirements: Rental period check:', {
            rentalPeriodField,
            selectedPeriod,
            requirementsData
        });

        if (!selectedPeriod) {
            setRentalPeriods(0);
            setTotalPrice(0);
            return;
        }

        // Find date fields in renter requirements
        const dateFields = renterFields.filter(field => field.field_type === 'date');

        console.log('🚀 ItemRequirements: Date fields found:', {
            dateFields,
            dateFieldsLength: dateFields.length
        });

        if (dateFields.length >= 2) {
            // Look for start and end dates
            let startDate = null;
            let endDate = null;

            dateFields.forEach(field => {
                const fieldValue = requirementsData[field.field_name];
                if (fieldValue) {
                    const date = new Date(fieldValue);
                    // Check if the date is valid before using it
                    if (!isNaN(date.getTime())) {
                        if (field.field_name.toLowerCase().includes('start') || field.field_name.toLowerCase().includes('begin')) {
                            startDate = date;
                        } else if (field.field_name.toLowerCase().includes('end') || field.field_name.toLowerCase().includes('finish') || field.field_name.toLowerCase().includes('return')) {
                            endDate = date;
                        }
                    } else {
                        console.warn('🚀 ItemRequirements: Invalid date value:', fieldValue, 'for field:', field.field_name);
                    }
                }
            });

            console.log('🚀 ItemRequirements: Start and end dates detected:', {
                startDate,
                endDate,
                startDateStr: startDate && !isNaN(startDate.getTime()) ? startDate.toISOString().split('T')[0] : null,
                endDateStr: endDate && !isNaN(endDate.getTime()) ? endDate.toISOString().split('T')[0] : null
            });

            // If we have both dates, validate and calculate periods and total price
            if (startDate && endDate) {
                // Validate start date is today or later
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (startDate < today) {
                    setRentalDays(0);
                    setRentalPeriods(0);
                    setTotalPrice(0);
                    return;
                }

                // Validate end date is at least 1 day after start date
                const minEndDate = new Date(startDate);
                minEndDate.setDate(minEndDate.getDate() + 1);

                if (endDate <= minEndDate) {
                    setRentalDays(0);
                    setRentalPeriods(0);
                    setTotalPrice(0);
                    return;
                }

                // Calculate total price based on daily rate × total days
                const timeDiff = endDate.getTime() - startDate.getTime();
                const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

                // Always calculate based on daily rate × total days
                const total = itemPrice * daysDiff;

                // Calculate periods for display purposes only
                let periods = 0;
                switch (selectedPeriod) {
                    case 'Daily':
                        periods = daysDiff;
                        break;
                    case 'Weekly':
                        periods = Math.ceil(daysDiff / 7);
                        break;
                    case 'Monthly':
                        periods = Math.ceil(daysDiff / 30);
                        break;
                    case 'Yearly':
                        periods = Math.ceil(daysDiff / 365);
                        break;
                    default:
                        periods = 0;
                }

                console.log('🚀 ItemRequirements: Price calculation:', {
                    itemPrice,
                    selectedPeriod,
                    daysDiff,
                    periods,
                    total,
                    calculation: `${itemPrice} × ${daysDiff} days = ${total}`
                });

                setRentalDays(daysDiff);
                setRentalPeriods(periods);
                setTotalPrice(total);
            } else {
                setRentalDays(0);
                setRentalPeriods(0);
                setTotalPrice(0);
            }
        }
    }, [renterFields, requirementsData, item]);

    // Update total price whenever requirements data changes
    useEffect(() => {
        calculateTotalPrice();
    }, [calculateTotalPrice]);

    // Update selectedRentalPeriod when requirementsData changes
    useEffect(() => {
        if (rentalPeriodField && requirementsData[rentalPeriodField.field_name]) {
            setSelectedRentalPeriod(requirementsData[rentalPeriodField.field_name]);
        }
    }, [rentalPeriodField, requirementsData]);

    useEffect(() => {
        console.log('🚀 ItemRequirements: useEffect triggered');
        console.log('🚀 ItemRequirements: id from params:', id);
        console.log('🚀 ItemRequirements: location.state:', location.state);

        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('🚀 ItemRequirements: No token found, redirecting to login');
            addNotification('Please log in to access this page', 'error');
            navigate('/login');
            return;
        }

        // Wait for user data to be loaded
        if (!user) {
            console.log('🚀 ItemRequirements: User data not loaded yet, waiting...');
            return;
        }

        // Authentication checks passed, proceed with loading data
        setAuthChecking(false);

        // Check if user has the correct role (should be 'user' for renting)
        if (user && user.role !== 'user') {
            console.log('🚀 ItemRequirements: User role not allowed:', user.role);
            addNotification('Only users can rent items. Please log in with a user account.', 'error');
            navigate('/login');
            return;
        }

        // Check if token is expired (JWT tokens expire after 24 hours)
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                const currentTime = Math.floor(Date.now() / 1000);

                if (payload.exp && payload.exp < currentTime) {
                    console.log('🚀 ItemRequirements: Token expired, redirecting to login');
                    addNotification('Your session has expired. Please log in again.', 'error');
                    // Clear expired token
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('tokenTimestamp');
                    navigate('/login');
                    return;
                }
            }
        } catch (error) {
            console.log('🚀 ItemRequirements: Error checking token validity:', error);
            addNotification('Invalid authentication token. Please log in again.', 'error');
            navigate('/login');
            return;
        }

        if (id && location.state?.item) {
            console.log('🚀 ItemRequirements: Setting item and fetching renter fields');
            setItem(location.state.item);
            fetchRenterFields(id);

            // Check if user already has a PENDING booking for this item
            checkExistingPendingBooking(parseInt(id));
        } else {
            console.log('🚀 ItemRequirements: Missing id or item in state');
        }
    }, [id, location.state, navigate, addNotification, user]);

    // Update form validity whenever requirements data changes
    useEffect(() => {
        const isValid = validateForm();
        setFormValid(isValid);
    }, [validateForm]);

    const fetchRenterFields = async (rentalItemId) => {
        try {
            setLoading(true);
            console.log('🚀 ItemRequirements: Fetching renter fields for item:', rentalItemId);

            // Check authentication status
            const token = localStorage.getItem('token');
            console.log('🚀 ItemRequirements: Current token:', token ? `${token.substring(0, 20)}...` : 'No token');
            console.log('🚀 ItemRequirements: Current user:', user);
            console.log('🚀 ItemRequirements: Is authenticated:', !!token);

            // Fetch renter fields for users from booking API (owner-defined fields exposed for users)
            const response = await bookingApi.getRenterInputFields(rentalItemId);
            console.log('🚀 ItemRequirements: API response:', response);

            const fields = response.data.renter_input_fields || response.data.fields || [];
            console.log('🚀 ItemRequirements: Fetched renter fields:', fields);

            if (fields.length === 0) {
                console.log('🚀 ItemRequirements: No renter fields found, using default fields');
                // Fallback to default fields if none are defined
                const defaultFields = [
                    {
                        field_name: 'rental_period',
                        field_type: 'rental_period',
                        required: true,
                        options: ['Daily', 'Weekly', 'Monthly', 'Yearly']
                    },
                    {
                        field_name: 'start_date',
                        field_type: 'date',
                        required: true
                    },
                    {
                        field_name: 'end_date',
                        field_type: 'date',
                        required: true
                    },
                    {
                        field_name: 'contract_accept',
                        field_type: 'contract_accept',
                        required: true
                    }
                ];
                setRenterFields(defaultFields);
            } else {
                setRenterFields(fields);
            }

            // Initialize requirements data with empty values for each field
            const currentFields = fields.length > 0 ? fields : [
                {
                    field_name: 'rental_period',
                    field_type: 'rental_period',
                    required: true,
                    options: ['Daily', 'Weekly', 'Monthly', 'Yearly']
                },
                {
                    field_name: 'start_date',
                    field_type: 'date',
                    required: true
                },
                {
                    field_name: 'end_date',
                    field_type: 'date',
                    required: true
                },
                {
                    field_name: 'contract_accept',
                    field_type: 'contract_accept',
                    required: true
                }
            ];

            const initialRequirements = {};
            currentFields.forEach(field => {
                if (field.field_type === 'file') {
                    initialRequirements[field.field_name] = [];
                } else {
                    initialRequirements[field.field_name] = '';
                }
            });
            setRequirementsData(initialRequirements);
        } catch (error) {
            console.error('🚀 ItemRequirements: Error fetching renter fields:', error);
            console.error('🚀 ItemRequirements: Error details:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                config: error.config
            });

            // Handle specific error cases
            if (error.response?.status === 401) {
                console.log('🚀 ItemRequirements: 401 Unauthorized - redirecting to login');
                addNotification('Authentication required. Please log in again.', 'error');
                // Redirect to login after a short delay
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else if (error.response?.status === 404) {
                addNotification('Rental item not found or no requirements defined.', 'error');
            } else if (error.message === 'Network Error') {
                addNotification('Unable to connect to server. Please check your internet connection and try again.', 'error');
            } else {
                addNotification(`Error fetching requirements: ${error.message}`, 'error');
            }

            setRenterFields([]);
        } finally {
            setLoading(false);
        }
    };

    const checkExistingPendingBooking = async (rentalItemId) => {
        try {
            console.log('🚀 ItemRequirements: Checking for existing PENDING booking for item:', rentalItemId);

            // Check if user has any existing bookings for this item
            const response = await bookingApi.getMyBookings();
            const existingBookings = response.data.bookings || [];

            const pendingBooking = existingBookings.find(booking =>
                booking.rental_item_id === rentalItemId &&
                booking.payment_status === 'PENDING' &&
                booking.status === 'Requirements_Submitted'
            );

            if (pendingBooking) {
                console.log('🚀 ItemRequirements: Found existing PENDING booking:', pendingBooking);
                setExistingPendingBooking(pendingBooking);
                addNotification('You have existing requirements for this item. You can continue to payment or update your requirements.', 'info');

                // Optionally, you could pre-fill the form with existing requirements
                // setRequirementsData(pendingBooking.requirements_data || {});
            }
        } catch (error) {
            console.log('🚀 ItemRequirements: Error checking existing bookings:', error);
            // Don't show error notification for this check - it's not critical
        }
    };



    const handleRequirementChange = (fieldName, value) => {
        console.log('🚀 ItemRequirements: Field change:', fieldName, 'Value:', value);
        setRequirementsData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const renderRequirementField = (field) => {
        const { field_name, field_type, required, options } = field;
        const value = requirementsData[field_name] || '';

        console.log('🚀 ItemRequirements: Rendering field:', { field_name, field_type, required, options, value });

        switch (field_type) {
            case 'string':
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleRequirementChange(field_name, e.target.value)}
                        required={required}
                        placeholder={`Enter ${field_name}`}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                );

            case 'boolean':
                return (
                    <div className="flex items-center space-x-6">
                        <label className="flex items-center space-x-3">
                            <input
                                type="radio"
                                name={field_name}
                                value="Yes"
                                checked={value === 'Yes'}
                                onChange={(e) => handleRequirementChange(field_name, e.target.value)}
                                required={required}
                                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2"
                            />
                            <span className="text-gray-700 dark:text-gray-300">Yes</span>
                        </label>
                        <label className="flex items-center space-x-3">
                            <input
                                type="radio"
                                name={field_name}
                                value="No"
                                checked={value === 'No'}
                                onChange={(e) => handleRequirementChange(field_name, e.target.value)}
                                required={required}
                                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2"
                            />
                            <span className="text-gray-300">No</span>
                        </label>
                    </div>
                );

            case 'date':
                // Get today's date as minimum start date (start date can be today or later)
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];

                const isStartDate = field_name.toLowerCase().includes('start') || field_name.toLowerCase().includes('begin');
                const isEndDate = field_name.toLowerCase().includes('end') || field_name.toLowerCase().includes('finish') || field_name.toLowerCase().includes('return');

                // Check if rental period is selected first
                const hasRentalPeriod = rentalPeriodField ? requirementsData[rentalPeriodField.field_name] : true;

                // Find start date value for end date validation
                let minEndDate = '';
                if (isEndDate) {
                    const startDateField = renterFields.find(f =>
                        f.field_type === 'date' &&
                        (f.field_name.toLowerCase().includes('start') || f.field_name.toLowerCase().includes('begin'))
                    );
                    if (startDateField && requirementsData[startDateField.field_name]) {
                        // End date must be at least 1 day after start date
                        const startDate = new Date(requirementsData[startDateField.field_name]);
                        // Check if startDate is valid before using it
                        if (!isNaN(startDate.getTime())) {
                            startDate.setDate(startDate.getDate() + 1);
                            minEndDate = startDate.toISOString().split('T')[0];
                        } else {
                            console.warn('🚀 ItemRequirements: Invalid start date for end date validation:', requirementsData[startDateField.field_name]);
                            minEndDate = '';
                        }
                    }
                }

                // Validate current date selection
                let dateError = '';
                if (value) {
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (isStartDate && selectedDate < today) {
                        dateError = 'Start date must be today or later';
                    } else if (isEndDate && minEndDate && value <= minEndDate) {
                        dateError = 'End date must be at least 1 day after start date';
                    }
                }

                return (
                    <div className="space-y-2">
                        {!hasRentalPeriod && (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    ⚠️ Please select a rental period first before choosing dates.
                                </p>
                            </div>
                        )}
                        <input
                            type="date"
                            value={value}
                            onChange={(e) => handleRequirementChange(field_name, e.target.value)}
                            required={required}
                            disabled={!hasRentalPeriod}
                            min={isStartDate ? todayStr : minEndDate}
                            className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${!hasRentalPeriod ? 'opacity-50 cursor-not-allowed' : ''
                                } ${dateError ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {dateError && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                                ❌ {dateError}
                            </p>
                        )}
                        {isStartDate && !dateError && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                📅 Select the date you want to start renting (can be today or later)
                            </p>
                        )}
                        {isEndDate && !dateError && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                📅 Select the date you want to return the item (must be at least 1 day after start date)
                            </p>
                        )}
                    </div>
                );

            case 'textarea':
                return (
                    <textarea
                        value={value}
                        onChange={(e) => handleRequirementChange(field_name, e.target.value)}
                        required={required}
                        rows={4}
                        placeholder={`Enter ${field_name}`}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                );

            case 'file':
                return (
                    <div className="space-y-2">
                        <input
                            type="file"
                            onChange={(e) => {
                                const files = Array.from(e.target.files);
                                handleRequirementChange(field_name, files);
                            }}
                            required={required}
                            multiple
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {Array.isArray(value) && value.length > 0 && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Selected files: {value.map(file => file.name).join(', ')}
                            </div>
                        )}
                    </div>
                );

            case 'selection':
                return (
                    <select
                        value={value}
                        onChange={(e) => handleRequirementChange(field_name, e.target.value)}
                        required={required}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="">Select {field_name}</option>
                        {options?.map((option, index) => (
                            <option key={index} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                );

            case 'rental_period':
                return (
                    <div className="space-y-3">
                        <select
                            value={value}
                            onChange={(e) => {
                                handleRequirementChange(field_name, e.target.value);
                                setSelectedRentalPeriod(e.target.value);
                            }}
                            required={required}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">Select Rental Period</option>
                            {options?.map((option, index) => (
                                <option key={index} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        {value && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    📅 After selecting {value.toLowerCase()} rental period, you'll need to choose your start and end dates.
                                    <br />
                                    <strong>Note:</strong> Pricing is always calculated as Daily Rate × Total Days, regardless of the period selected.
                                </p>
                            </div>
                        )}
                    </div>
                );

            case 'contract':
                return (
                    <div className="space-y-4">
                        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                            <div className="flex items-center mb-3">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Rental Contract Terms</h4>
                            </div>
                            <div className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                                {(() => {
                                    console.log('🚀 ItemRequirements: Contract field options:', options);
                                    // For contract fields, the first option is usually the agreement text
                                    // and the second option (if exists) contains the actual contract terms
                                    if (options && options.length > 1) {
                                        return options[1]; // Return the actual contract terms
                                    } else if (options && options.length === 1) {
                                        return options[0]; // Fallback to first option
                                    }
                                    return 'Contract terms will be displayed here';
                                })()}
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                            <input
                                type="checkbox"
                                id={`contract-${field_name}`}
                                checked={value === 'I agree to the terms and conditions'}
                                onChange={(e) => handleRequirementChange(field_name, e.target.checked ? 'I agree to the terms and conditions' : '')}
                                required={required}
                                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                            />
                            <label htmlFor={`contract-${field_name}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                I have read and agree to the rental contract terms and conditions above
                            </label>
                        </div>
                    </div>
                );

            case 'contract_accept':
                return (
                    <div className="space-y-4">
                        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-700">
                            <div className="flex items-center mb-3">
                                <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h4 className="text-lg font-semibold text-green-800 dark:text-green-200">Rental Contract Terms</h4>
                            </div>
                            <div className="text-sm text-green-800 dark:text-green-200 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                                {(() => {
                                    console.log('🚀 ItemRequirements: Contract accept field options:', options);
                                    // For contract fields, the first option is usually the agreement text
                                    // and the second option (if exists) contains the actual contract terms
                                    if (options && options.length > 1) {
                                        return options[1]; // Return the actual contract terms
                                    } else if (options && options.length === 1) {
                                        return options[0]; // Fallback to first option
                                    }
                                    return 'Contract terms will be displayed here';
                                })()}
                            </div>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Please review the contract terms above and select your response: *
                            </label>
                            <select
                                value={value}
                                onChange={(e) => handleRequirementChange(field_name, e.target.value)}
                                required={required}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="">Select your response</option>
                                <option value="Accept">✅ Accept - I agree to the contract terms</option>
                                <option value="Reject">❌ Reject - I do not agree to the contract terms</option>
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Note: You must accept the contract terms to proceed with the rental.
                            </p>
                        </div>
                    </div>
                );

            default:
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleRequirementChange(field_name, e.target.value)}
                        required={required}
                        placeholder={`Enter ${field_name}`}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Additional validation before submission
        if (renterFields.length > 0) {
            const dateFields = renterFields.filter(f => f.field_type === 'date');
            if (dateFields.length >= 2) {
                const hasStartDate = dateFields.some(f =>
                    f.field_name.toLowerCase().includes('start') ||
                    f.field_name.toLowerCase().includes('begin')
                );
                const hasEndDate = dateFields.some(f =>
                    f.field_name.toLowerCase().includes('end') ||
                    f.field_name.toLowerCase().includes('finish') ||
                    f.field_name.toLowerCase().includes('return')
                );

                if (!hasStartDate) {
                    addNotification('Please select a start date for your rental.', 'error');
                    return;
                }
                if (!hasEndDate) {
                    addNotification('Please select an end date for your rental.', 'error');
                    return;
                }

                // Validate start date is tomorrow or later
                const startDateField = dateFields.find(f =>
                    f.field_name.toLowerCase().includes('start') || f.field_name.toLowerCase().includes('begin')
                );
                const endDateField = dateFields.find(f =>
                    f.field_name.toLowerCase().includes('end') || f.field_name.toLowerCase().includes('finish') || f.field_name.toLowerCase().includes('return')
                );

                if (startDateField && endDateField) {
                    const startDate = new Date(requirementsData[startDateField.field_name]);
                    const endDate = new Date(requirementsData[endDateField.field_name]);

                    // Validate dates are valid before using them
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        addNotification('Invalid date values provided. Please check your date selections.', 'error');
                        return;
                    }
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    // Check start date is today or later
                    if (startDate < today) {
                        addNotification('Start date must be today or later. You cannot rent starting in the past.', 'error');
                        return;
                    }

                    // Check end date is at least 1 day after start date
                    const minEndDate = new Date(startDate);
                    minEndDate.setDate(minEndDate.getDate() + 1);

                    if (endDate <= minEndDate) {
                        addNotification('End date must be at least 1 day after start date. You cannot rent for 0 days.', 'error');
                        return;
                    }
                }
            }
        }

        setSubmitting(true);
        try {
            // Prepare the booking data according to backend requirements
            const bookingData = {
                rental_item_id: parseInt(id),
                requirements_data: {
                    ...requirementsData, // Include all owner-defined requirements
                    rental_period: rentalPeriodField ? requirementsData[rentalPeriodField.field_name] : null,
                    total_price: totalPrice,
                    rental_days: rentalDays,
                    rental_periods: rentalPeriods
                },
                contract_accepted: true
            };

            console.log('🚀 ItemRequirements: Submitting requirements data:', bookingData);

            // Check authentication before submitting
            const token = localStorage.getItem('token');
            console.log('🚀 ItemRequirements: Token exists:', !!token);
            console.log('🚀 ItemRequirements: Token value:', token ? `${token.substring(0, 20)}...` : 'No token');
            console.log('🚀 ItemRequirements: Current user:', user);
            console.log('🚀 ItemRequirements: User role:', user?.role);
            console.log('🚀 ItemRequirements: User ID:', user?.id);

            // Submit the requirements to the backend (new endpoint)
            const response = await bookingApi.submitBookingRequirements(parseInt(id), bookingData);

            console.log('🚀 ItemRequirements: Requirements response:', response);
            console.log('🚀 ItemRequirements: Response data:', response.data);
            console.log('🚀 ItemRequirements: Response status:', response.status);

            // Check if this is an existing PENDING booking
            if (response.data.existing_booking) {
                console.log('🚀 ItemRequirements: Found existing PENDING booking, proceeding to payment');

                // Show notification about existing booking
                addNotification('Found existing requirements for this item. Proceeding to payment completion.', 'info');

                // Show additional warning if provided by backend
                if (response.data.warning) {
                    setTimeout(() => {
                        addNotification(response.data.warning, 'warning');
                    }, 1000);
                }

                // Show additional info if provided by backend
                if (response.data.info) {
                    setTimeout(() => {
                        addNotification(response.data.info, 'info');
                    }, 2000);
                }

                // Navigate to payment completion with existing booking data
                const navigationData = {
                    bookingData: {
                        booking_id: response.data.booking_id,
                        payment_amount: response.data.payment_amount,
                        // Add item details for complete display
                        item_name: getItemName(item.dynamic_data),
                        daily_rate: getItemPrice(item.dynamic_data),
                        rental_period: rentalPeriodField ? requirementsData[rentalPeriodField.field_name] : null,
                        rental_days: rentalDays,
                        rental_periods: rentalPeriods,
                        total_price: totalPrice,
                        // Add requirements summary
                        requirements_summary: Object.keys(requirementsData).filter(key =>
                            key !== 'rental_period' &&
                            key !== 'total_price' &&
                            key !== 'rental_days' &&
                            key !== 'rental_periods'
                        ).length
                    }
                };

                navigate('/payment-completion', {
                    state: navigationData
                });
                return;
            }

            // Validate response structure for new bookings
            if (!response.data || !response.data.booking_id || !response.data.payment_amount) {
                throw new Error('Invalid response from server. Missing required booking information.');
            }

            // Log the navigation data being sent
            const navigationData = {
                bookingData: {
                    booking_id: response.data.booking_id,
                    payment_amount: response.data.payment_amount,
                    // Add item details for complete display
                    item_name: getItemName(item.dynamic_data),
                    daily_rate: getItemPrice(item.dynamic_data),
                    rental_period: rentalPeriodField ? requirementsData[rentalPeriodField.field_name] : null,
                    rental_days: rentalDays,
                    rental_periods: rentalPeriods,
                    total_price: totalPrice,
                    // Add requirements summary
                    requirements_summary: Object.keys(requirementsData).filter(key =>
                        key !== 'rental_period' &&
                        key !== 'total_price' &&
                        key !== 'rental_days' &&
                        key !== 'rental_periods'
                    ).length
                }
            };
            console.log('🚀 ItemRequirements: Navigation data being sent:', navigationData);

            // Show success notification with warning
            addNotification('Requirements submitted successfully! Please complete your payment to finalize the booking.', 'success');

            // Show additional warning if provided by backend
            if (response.data.warning) {
                setTimeout(() => {
                    addNotification(response.data.warning, 'warning');
                }, 1000);
            }

            // Show additional info if provided by backend
            if (response.data.info) {
                setTimeout(() => {
                    addNotification(response.data.info, 'info');
                }, 2000);
            }

            // Navigate to payment completion form with complete booking data
            console.log('🚀 ItemRequirements: About to navigate to /payment-completion');
            console.log('🚀 ItemRequirements: Navigation data:', navigationData);

            // Use setTimeout to ensure navigation happens after state updates
            setTimeout(() => {
                console.log('🚀 ItemRequirements: About to navigate - user context check:');
                console.log('🚀 ItemRequirements: User:', user);
                console.log('🚀 ItemRequirements: User role:', user?.role);
                console.log('🚀 ItemRequirements: Token exists:', !!localStorage.getItem('token'));

                try {
                    navigate('/payment-completion', {
                        state: navigationData
                    });
                    console.log('🚀 ItemRequirements: Navigation successful');
                } catch (navError) {
                    console.error('🚀 ItemRequirements: Navigation error:', navError);
                    // Fallback navigation
                    navigate('/payment/complete', {
                        state: navigationData
                    });
                }
            }, 100);

        } catch (error) {
            console.error('🚀 ItemRequirements: Error submitting requirements:', error);

            // Handle specific error messages from backend
            if (error.response?.data?.error) {
                addNotification(error.response.data.error, 'error');
            } else if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat();
                addNotification(`Validation errors: ${errorMessages.join(', ')}`, 'error');
            } else if (error.message) {
                addNotification(`Error: ${error.message}`, 'error');
            } else {
                addNotification('Error submitting requirements. Please try again.', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleBackToItem = () => {
        navigate(-1); // Go back to item detail page
    };

    // Helper functions to get item name and price from dynamic data
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!item || !renterFields.length) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Requirements Not Found
                </h2>
                <button
                    onClick={handleBackToItem}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Back Button */}
            <div className="mb-6">
                <button
                    onClick={handleBackToItem}
                    className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Item
                </button>
            </div>

            {/* Item Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 p-6 mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                            <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {getItemName(item.dynamic_data)}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Please provide the following information to complete your rental request
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        {getItemPrice(item.dynamic_data) ? (
                            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                ${getItemPrice(item.dynamic_data).toLocaleString()}
                            </div>
                        ) : (
                            <div className="text-lg font-medium text-gray-500 dark:text-gray-400">
                                Price not set
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Requirements Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contract Terms Explanation */}
                {renterFields.some(field => field.field_type === 'contract' || field.field_type === 'contract_accept') && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                                    Important: Contract Terms
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    This rental item has contract terms that you must review and agree to before proceeding.
                                    These terms outline the rental conditions, rules, and policies set by the item owner.
                                    Please read them carefully and ensure you understand and agree to all conditions.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Rental Requirements
                        </h3>
                        {selectedRentalPeriod && (
                            <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 rounded-full text-sm font-medium">
                                📅 {selectedRentalPeriod} Rental
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {renterFields.map((field) => (
                            <div key={field.id}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {field.field_name} {field.required && <span className="text-red-500">*</span>}
                                    {(field.field_type === 'contract' || field.field_type === 'contract_accept') && (
                                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                            Contract Field
                                        </span>
                                    )}
                                    {field.field_type === 'rental_period' && (
                                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                            Rental Period
                                        </span>
                                    )}
                                </label>
                                {renderRequirementField(field)}
                                {field.required && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        This field is required
                                    </p>
                                )}
                                {(field.field_type === 'contract' || field.field_type === 'contract_accept') && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        ⚠️ You must accept these contract terms to proceed with the booking
                                    </p>
                                )}
                                {field.field_type === 'rental_period' && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                        📅 Select your rental period for organization, then choose start and end dates.
                                        Pricing is calculated as Daily Rate × Total Days.
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Booking Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        📋 Booking Summary
                    </h4>

                    {/* Calculation Explanation */}
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    <strong>How pricing works:</strong> Total price = Daily Rate × Total Days.
                                    The rental period (Daily/Weekly/Monthly/Yearly) is just for reference and organization.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Item Information */}
                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Item Name:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {getItemName(item.dynamic_data)}
                            </span>
                        </div>

                        {/* Daily Rate */}
                        <div className="flex justify-between items-center py-2 bg-green-50 dark:bg-green-900/20 rounded-lg px-3">
                            <span className="text-green-700 dark:text-green-300 font-medium">Daily Rate:</span>
                            <span className="font-semibold text-green-800 dark:text-green-200">
                                {getItemPrice(item.dynamic_data) ? `$${getItemPrice(item.dynamic_data).toLocaleString()}` : 'Price not set'}
                            </span>
                        </div>

                        {/* Rental Period (Reference Only) */}
                        {selectedRentalPeriod && (
                            <div className="flex justify-between items-center py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3">
                                <span className="text-purple-700 dark:text-purple-300 font-medium">Rental Period:</span>
                                <span className="font-semibold text-purple-800 dark:text-purple-200">
                                    {selectedRentalPeriod} (Reference Only)
                                </span>
                            </div>
                        )}

                        {/* Total Days - Always Show */}
                        <div className="flex justify-between items-center py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3">
                            <span className="text-blue-700 dark:text-blue-300 font-semibold">Total Days:</span>
                            <span className="text-xl font-bold text-blue-800 dark:text-blue-200">
                                {rentalDays > 0 ? `${rentalDays} day${rentalDays !== 1 ? 's' : ''}` : 'Not set'}
                            </span>
                        </div>

                        {/* Calculation Breakdown */}
                        {rentalDays > 0 && getItemPrice(item.dynamic_data) && (
                            <div className="flex justify-between items-center py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-3">
                                <span className="text-yellow-700 dark:text-yellow-300 font-medium">Calculation:</span>
                                <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                                    ${getItemPrice(item.dynamic_data).toLocaleString()} × {rentalDays} days
                                </span>
                            </div>
                        )}

                        {/* Total Price - Always Show */}
                        <div className="flex justify-between items-center py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-3 border-2 border-indigo-200 dark:border-indigo-700">
                            <span className="text-indigo-700 dark:text-indigo-300 text-lg font-semibold">Total Price:</span>
                            <span className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">
                                ${totalPrice > 0 ? totalPrice.toLocaleString() : '0'}
                            </span>
                        </div>

                        {/* Rental Periods (Reference Only) */}
                        {rentalPeriods > 0 && (
                            <div className="flex justify-between items-center py-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">Periods (Reference):</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                    {rentalPeriods} {selectedRentalPeriod?.toLowerCase()}{rentalPeriods !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}

                        {/* Status Indicators */}
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="space-y-2">
                                {renterFields.some(field => field.field_type === 'rental_period') && (
                                    <div className="flex items-center text-sm">
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                                        <span className="text-gray-600 dark:text-gray-400">Rental period must be selected first</span>
                                    </div>
                                )}
                                {renterFields.some(field => field.field_type === 'contract' || field.field_type === 'contract_accept') && (
                                    <div className="flex items-center text-sm">
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                        <span className="text-gray-600 dark:text-gray-400">Contract terms must be accepted</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Validation Summary */}
                {!formValid && renterFields.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div>
                                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                                    Please complete the following to submit your booking:
                                </h4>
                                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                                    {(() => {
                                        const issues = [];

                                        // Check required fields
                                        const requiredFields = renterFields.filter(field => field.required);
                                        const missingFields = requiredFields.filter(field =>
                                            !requirementsData[field.field_name] ||
                                            (Array.isArray(requirementsData[field.field_name]) && requirementsData[field.field_name].length === 0) ||
                                            requirementsData[field.field_name].toString().trim() === ''
                                        );

                                        if (missingFields.length > 0) {
                                            issues.push(`Fill in required fields: ${missingFields.map(f => f.field_name).join(', ')}`);
                                        }

                                        // Check contract acceptance
                                        const contractFields = renterFields.filter(field =>
                                            field.field_type === 'contract' || field.field_type === 'contract_accept'
                                        );

                                        const missingContractAcceptance = contractFields.filter(field => {
                                            if (field.field_type === 'contract') {
                                                return requirementsData[field.field_name] !== 'I agree to the terms and conditions';
                                            } else if (field.field_type === 'contract_accept') {
                                                return requirementsData[field.field_name] !== 'Accept';
                                            }
                                            return false;
                                        });

                                        if (missingContractAcceptance.length > 0) {
                                            issues.push(`Accept contract terms for: ${missingContractAcceptance.map(f => f.field_name).join(', ')}`);
                                        }

                                        // Check rental period selection
                                        if (rentalPeriodField && rentalPeriodField.required && !requirementsData[rentalPeriodField.field_name]) {
                                            issues.push('Select a rental period (Daily/Weekly/Monthly/Yearly)');
                                        }

                                        // Check date selection and validation if rental period is selected
                                        if (rentalPeriodField && requirementsData[rentalPeriodField.field_name]) {
                                            const dateFields = renterFields.filter(field => field.field_type === 'date');
                                            if (dateFields.length >= 2) {
                                                const startDateField = dateFields.find(field =>
                                                    field.field_name.toLowerCase().includes('start') || field.field_name.toLowerCase().includes('begin')
                                                );
                                                const endDateField = dateFields.find(field =>
                                                    field.field_name.toLowerCase().includes('end') || field.field_name.toLowerCase().includes('finish') || field.field_name.toLowerCase().includes('return')
                                                );

                                                if (!startDateField || !endDateField) {
                                                    issues.push('Select both start and end dates');
                                                } else {
                                                    const startDate = requirementsData[startDateField.field_name];
                                                    const endDate = requirementsData[endDateField.field_name];

                                                    if (!startDate) {
                                                        issues.push('Select a start date');
                                                    } else {
                                                        // Check start date is tomorrow or later
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);
                                                        const startDateObj = new Date(startDate);

                                                        // Validate start date is valid
                                                        if (isNaN(startDateObj.getTime())) {
                                                            issues.push('Invalid start date format');
                                                        } else if (startDateObj < today) {
                                                            issues.push('Start date must be today or later (not in the past)');
                                                        }
                                                    }

                                                    if (!endDate) {
                                                        issues.push('Select an end date');
                                                    } else if (startDate) {
                                                        // Check end date is at least 1 day after start date
                                                        const startDateObj = new Date(startDate);
                                                        const endDateObj = new Date(endDate);

                                                        // Validate both dates are valid
                                                        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
                                                            issues.push('Invalid date format detected');
                                                        } else {
                                                            const minEndDate = new Date(startDateObj);
                                                            minEndDate.setDate(minEndDate.getDate() + 1);

                                                            if (endDateObj <= minEndDate) {
                                                                issues.push('End date must be at least 1 day after start date');
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        return issues.map((issue, index) => (
                                            <li key={index} className="flex items-center">
                                                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2"></span>
                                                {issue}
                                            </li>
                                        ));
                                    })()}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Existing PENDING Booking Option */}
                {existingPendingBooking && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                                        Existing Requirements Found
                                    </h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                        You have already submitted requirements for this item (Booking #{existingPendingBooking.booking_id}).
                                        You can continue to payment or update your requirements below.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const navigationData = {
                                                bookingData: {
                                                    booking_id: existingPendingBooking.booking_id,
                                                    payment_amount: existingPendingBooking.payment_amount,
                                                    item_name: getItemName(item.dynamic_data),
                                                    daily_rate: getItemPrice(item.dynamic_data),
                                                    rental_period: existingPendingBooking.requirements_data?.rental_period || null,
                                                    rental_days: existingPendingBooking.requirements_data?.rental_days || 0,
                                                    rental_periods: existingPendingBooking.requirements_data?.rental_periods || 0,
                                                    total_price: existingPendingBooking.payment_amount,
                                                    requirements_summary: Object.keys(existingPendingBooking.requirements_data || {}).filter(key =>
                                                        key !== 'rental_period' && key !== 'total_price' && key !== 'rental_days' && key !== 'rental_periods'
                                                    ).length
                                                }
                                            };
                                            navigate('/payment/complete', { state: navigationData });
                                        }}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        Continue to Payment
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={handleBackToItem}
                        className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || !formValid}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center"
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Submitting...
                            </>
                        ) : !formValid ? (
                            'Complete All Requirements'
                        ) : existingPendingBooking ? (
                            'Update Requirements & Submit'
                        ) : (
                            'Submit Requirements'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ItemRequirements;
