import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { rentalApi } from '../../api/rentalApi';

const CategoryItems = () => {
    const { categoryId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { showNotification } = useNotification();

    const [rentalItems, setRentalItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categoryInfo, setCategoryInfo] = useState(null);

    useEffect(() => {
        if (categoryId) {
            fetchRentalItems(categoryId);
            // Get category info from navigation state
            if (location.state) {
                setCategoryInfo({
                    name: location.state.categoryName,
                    description: location.state.categoryDescription
                });
            }
        }
    }, [categoryId, location.state]);

    const fetchRentalItems = async (categoryId) => {
        try {
            setLoading(true);
            const response = await rentalApi.getItemsByCategory(categoryId);
            setRentalItems(response.data.items || []);
            // Update category info if not already set
            if (!categoryInfo && response.data.category) {
                setCategoryInfo(response.data.category);
            }
        } catch (error) {
            console.error('Error fetching rental items:', error);
            showNotification('Error fetching rental items', 'error');
            setRentalItems([]);
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

    const handleRentNow = (item) => {
        console.log('🚀 CategoryItems: handleRentNow called with item:', item);
        console.log('🚀 CategoryItems: Navigating to item detail:', `/rental-items/detail/${item.id}`);
        console.log('🚀 CategoryItems: Navigation state:', {
            fromCategory: true,
            categoryName: categoryInfo?.name
        });

        // Navigate to item detail page
        navigate(`/rental-items/detail/${item.id}`, {
            state: {
                fromCategory: true,
                categoryName: categoryInfo?.name,
                categoryId: categoryId // Pass the category ID
            }
        });

        console.log('🚀 CategoryItems: Navigation to item detail completed');
    };

    const handleBackToCategories = () => {
        navigate('/browse');
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Back Button and Category Info */}
            <div className="mb-6">
                <button
                    onClick={handleBackToCategories}
                    className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-4"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Categories
                </button>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {categoryInfo?.name || 'Category Items'}
                </h1>
                {categoryInfo?.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {categoryInfo.description}
                    </p>
                )}
            </div>

            {/* Items Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Available Items
                    </h2>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {rentalItems.length} item{rentalItems.length !== 1 ? 's' : ''} found
                    </span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : rentalItems.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 01-.707-.293l-2.414-2.414a1 1 0 00-.707-.293H6.414a1 1 0 00-.707.293L3.293 13.293A1 1 0 003 14v5a2 2 0 002 2h14a2 2 0 002-2v-5a1 1 0 00-.293-.707z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No items available yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            This category doesn't have any rental items yet. Check back later!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {rentalItems.map((item) => {
                            const itemName = getItemName(item.dynamic_data);
                            const itemPrice = getItemPrice(item.dynamic_data);
                            const itemImages = getItemImages(item.dynamic_data);
                            const mainImage = itemImages.length > 0 ? itemImages[0] : null;

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleRentNow(item)}
                                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer"
                                >
                                    {/* Item Image */}
                                    <div className="h-48 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
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
                                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Item Details */}
                                    <div className="p-4">
                                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">

                                            {itemImages.length > 0 && (
                                                <span className="flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {itemImages.length} {itemImages.length === 1 ? 'image' : 'images'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Contract Terms Indicator */}
                                        {item.renter_requirements && item.renter_requirements.some(req =>
                                            req.field_type === 'contract' || req.field_type === 'contract_accept'
                                        ) && (
                                                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                                                    <div className="flex items-center text-blue-700 dark:text-blue-300">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <span className="text-xs font-medium">Contract Terms Apply</span>
                                                    </div>
                                                </div>
                                            )}

                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            {itemName}
                                        </h3>

                                        {itemPrice ? (
                                            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-3">
                                                ${itemPrice.toLocaleString()}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                                Price not set
                                            </div>
                                        )}

                                        {/* Rent Now Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent card click
                                                handleRentNow(item);
                                            }}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Rent Now
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryItems;
