import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { rentalApi } from '../../api/rentalApi';

const ItemDetail = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { showNotification } = useNotification();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    useEffect(() => {
        if (id) {
            fetchItemDetails(id);
        }
    }, [id]);

    const fetchItemDetails = async (itemId) => {
        console.log('🚀 ItemDetail: fetchItemDetails called with itemId:', itemId);
        try {
            setLoading(true);

            // Get category ID from navigation state or try to find it
            let categoryId = location.state?.categoryId;

            if (!categoryId) {
                // If no category ID in state, try to find the item in all categories
                const allCategoriesResponse = await rentalApi.getCategories();
                const categoriesData = allCategoriesResponse.data;

                // Search through each category to find the item
                for (const category of categoriesData.categories || []) {
                    try {
                        const categoryResponse = await rentalApi.getItemsByCategory(category.id);
                        const categoryData = categoryResponse.data;
                        const foundItem = categoryData.items.find(item => item.id == itemId);
                        if (foundItem) {
                            setItem(foundItem);
                            setLoading(false);
                            return;
                        }
                    } catch (error) {
                        // Continue searching other categories
                        continue;
                    }
                }
            } else {
                // Use the category ID from navigation state
                const response = await rentalApi.getItemsByCategory(categoryId);
                const data = response.data;
                const foundItem = data.items.find(item => item.id == itemId);

                if (foundItem) {
                    setItem(foundItem);
                } else {
                    showNotification('Item not found', 'error');
                }
            }
        } catch (error) {
            console.error('Error fetching item details:', error);
            showNotification('Error fetching item details', 'error');
        } finally {
            setLoading(false);
        }
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

    const getItemImages = (dynamicData) => {
        if (!dynamicData) return [];

        const images = [];
        for (const [fieldName, fieldValue] of Object.entries(dynamicData)) {
            if (fieldName.toLowerCase().includes('image') ||
                fieldName.toLowerCase().includes('photo') ||
                fieldName.toLowerCase().includes('img') ||
                fieldName.toLowerCase().includes('pic') ||
                fieldName.toLowerCase().includes('car mage')) {

                if (Array.isArray(fieldValue)) {
                    images.push(...fieldValue);
                } else if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim() !== '') {
                    images.push(fieldValue);
                }
            }
        }

        return images;
    };

    const handleRentNow = () => {


        // Navigate to requirements page
        navigate(`/rental-items/detail/${id}/requirements`, {
            state: {
                item: item,
                fromDetail: true
            }
        });

        console.log('🚀 ItemDetail: Navigation to requirements completed');
    };

    const handleBackToCategory = () => {
        if (location.state?.fromCategory) {
            // Go back to the specific category items page
            const categoryId = location.state?.categoryId;
            if (categoryId) {
                navigate(`/rental-items/category/${categoryId}`, {
                    state: {
                        categoryName: location.state?.categoryName,
                        categoryDescription: location.state?.categoryDescription
                    }
                });
            } else {
                navigate(-1); // Fallback to previous page
            }
        } else {
            navigate('/browse'); // Go back to categories
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Item Not Found
                </h2>
                <button
                    onClick={handleBackToCategory}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const itemName = getItemName(item.dynamic_data);
    const itemPrice = getItemPrice(item.dynamic_data);
    const itemImages = getItemImages(item.dynamic_data);
    const mainImage = itemImages[selectedImageIndex] || itemImages[0];

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Back Button */}
            <div className="mb-6">
                <button
                    onClick={handleBackToCategory}
                    className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {location.state?.fromCategory ? 'Back to Category' : 'Back to Categories'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Images */}
                <div className="space-y-4">
                    {/* Main Image (Amazon/Trendyol Style) */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                        <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                            {mainImage ? (
                                <img
                                    src={`/uploads/${mainImage.replace(/\\/g, '/')}`}
                                    alt={itemName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            {/* Fallback for no image */}
                            <div className={`w-full h-full flex items-center justify-center text-gray-400 ${mainImage ? 'hidden' : 'flex'}`}>
                                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Thumbnail Images */}
                    {itemImages.length > 1 && (
                        <div className="grid grid-cols-5 gap-2">
                            {itemImages.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImageIndex(index)}
                                    className={`aspect-square rounded-lg border-2 overflow-hidden transition-all duration-200 ${selectedImageIndex === index
                                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300'
                                        }`}
                                >
                                    <img
                                        src={`/uploads/${image.replace(/\\/g, '/')}`}
                                        alt={`${itemName} ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    {/* Fallback for thumbnail */}
                                    <div className={`w-full h-full flex items-center justify-center text-gray-400 ${index === selectedImageIndex ? 'hidden' : 'flex'}`}>
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column - Item Details */}
                <div className="space-y-6">
                    {/* Item Title and Price */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            {itemName}
                        </h1>

                        {itemPrice ? (
                            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                                ${itemPrice.toLocaleString()}
                            </div>
                        ) : (
                            <div className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Price not set
                            </div>
                        )}
                    </div>

                    {/* Item Details Card - Amazon Style */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                            Product Details
                        </h2>

                        <div className="space-y-4">
                            {/* Category */}
                            {item.category && (
                                <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                    <span className="font-medium text-gray-700 dark:text-gray-300 text-base">
                                        Category
                                    </span>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        {item.category.name || item.category}
                                    </span>
                                </div>
                            )}

                            {/* Contract Terms Preview */}
                            {item.renter_requirements && item.renter_requirements.some(req =>
                                req.field_type === 'contract' || req.field_type === 'contract_accept'
                            ) && (
                                    <div className="py-3 border-b border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-700 dark:text-gray-300 text-base">
                                                Contract Terms
                                            </span>
                                            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 px-2 py-1 rounded-full">
                                                Required
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            This item has rental contract terms that you'll need to review and agree to before booking.
                                        </div>
                                    </div>
                                )}

                            {/* All Other Fields (excluding images and empty values) */}
                            {Object.entries(item.dynamic_data || {}).map(([fieldName, fieldValue]) => {
                                // Skip image fields, empty values, and image path arrays
                                if (fieldName.toLowerCase().includes('image') ||
                                    fieldName.toLowerCase().includes('photo') ||
                                    fieldName.toLowerCase().includes('img') ||
                                    fieldName.toLowerCase().includes('pic') ||
                                    fieldName.toLowerCase().includes('car mage') ||
                                    !fieldValue ||
                                    fieldValue === '' ||
                                    // Skip arrays that contain image paths
                                    (Array.isArray(fieldValue) && fieldValue.some(item =>
                                        typeof item === 'string' && (
                                            item.includes('rental_items\\') ||
                                            item.includes('rental_items/') ||
                                            item.includes('.jpg') ||
                                            item.includes('.png') ||
                                            item.includes('.jpeg')
                                        )
                                    )) ||
                                    // Skip single strings that are image paths
                                    (typeof fieldValue === 'string' && (
                                        fieldValue.includes('rental_items\\') ||
                                        fieldValue.includes('rental_items/') ||
                                        fieldValue.includes('.jpg') ||
                                        fieldValue.includes('.png') ||
                                        fieldValue.includes('.jpeg')
                                    ))) {
                                    return null;
                                }

                                return (
                                    <div key={fieldName} className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                        <span className="font-medium text-gray-700 dark:text-gray-300 capitalize text-base">
                                            {fieldName.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                        <span className="text-gray-900 dark:text-white font-medium text-right max-w-xs">
                                            {typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Rent Now Button */}
                    <div className="sticky top-4">
                        <button
                            onClick={handleRentNow}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-4 px-6 rounded-2xl transition-colors duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                        >
                            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Rent Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemDetail;
