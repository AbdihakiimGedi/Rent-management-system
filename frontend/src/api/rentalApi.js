import { apiClient } from './apiConfig';

// Rental browsing API endpoints
export const rentalApi = {
    // Get all categories
    getCategories: async () => {
        return await apiClient.get('/rental-browsing/categories');
    },

    // Get items by category
    getItemsByCategory: async (categoryId) => {
        return await apiClient.get(`/rental-browsing/categories/${categoryId}/items`);
    },

    // Search items
    searchItems: async (searchParams) => {
        return await apiClient.get('/rental-browsing/search', { params: searchParams });
    }
};






