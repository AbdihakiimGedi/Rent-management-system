import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { rentalApi } from '../../api/rentalApi';

const CategorySelection = () => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch all categories
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await rentalApi.getCategories();
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            showNotification('Error fetching categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySelect = (category) => {
        // Navigate to items page for this category
        navigate(`/rental-items/category/${category.id}`, {
            state: {
                categoryName: category.name,
                categoryDescription: category.description
            }
        });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Page Title */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Browse Rental Items
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Select a category to view available rental items
                </p>
            </div>

            {/* Categories Section */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Select Category
                </h2>

                {loading ? (
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                onClick={() => handleCategorySelect(category)}
                                className="p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500"
                            >
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                        <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        {category.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        {category.description || 'No description available'}
                                    </p>
                                    <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                        {category.item_count} item{category.item_count !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategorySelection;
