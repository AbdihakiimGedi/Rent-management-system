import { apiClient } from './apiConfig';

export const ownerApi = {
  // Owner Request Management
  submitOwnerRequest: (data) => apiClient.post('/api/owner/request', data),
  getOwnerRequest: () => apiClient.get('/api/owner/request'),
  getOwnerRequirements: () => apiClient.get('/api/owner/requirements'),

  // Get Categories for Owners
  getCategories: () => apiClient.get('/api/owner/categories'),

  // Rental Item Management
  getRentalItems: () => apiClient.get('/api/owner/rental-items'),
  getRentalItem: (id) => apiClient.get(`/api/owner/rental-items/${id}`),
  createRentalItem: (data) => apiClient.post('/api/owner/rental-items', data),
  updateRentalItem: (id, data) => apiClient.put(`/api/owner/rental-items/${id}`, data),
  deleteRentalItem: (id) => apiClient.delete(`/api/owner/rental-items/${id}`),

  // Public routes for renters (no authentication required)
  getPublicRentalItems: (params = {}) => apiClient.get('/api/owner/rental-items/public', { params }),
  getPublicRentalItem: (id) => apiClient.get(`/api/owner/rental-items/${id}/public`),

  // Image Upload
  uploadImage: (imageFile, fieldName) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('field_name', fieldName);
    return apiClient.post('/api/owner/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // New endpoints for full rental item details
  getRentalItemsFull: (params = {}) => apiClient.get('/api/owner/rental-items/full', { params }),
  getRentalItemsStats: () => apiClient.get('/api/owner/rental-items/stats'),

  // Renter Input Fields Management
  getRenterInputFields: (itemId) => apiClient.get(`/api/owner/rental-items/${itemId}/renter-fields`),
  createRenterInputField: (itemId, data) => apiClient.post(`/api/owner/rental-items/${itemId}/renter-fields`, data),
  updateRenterInputField: (itemId, fieldId, data) => apiClient.put(`/api/owner/rental-items/${itemId}/renter-fields/${fieldId}`, data),
  deleteRenterInputField: (itemId, fieldId) => apiClient.delete(`/api/owner/rental-items/${itemId}/renter-fields/${fieldId}`),

  // Bookings (owner can view bookings for their items)
  getBookings: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.status) queryParams.append('status', params.status);
    if (params.date) queryParams.append('date', params.date);

    const queryString = queryParams.toString();
    const url = queryString ? `/api/owner/bookings?${queryString}` : '/api/owner/bookings';
    return apiClient.get(url);
  },

  // Get a specific booking for the owner
  getBooking: (bookingId) => apiClient.get(`/api/owner/bookings/${bookingId}`),

  // Payments (owner can view payments for their items)
  getPayments: () => apiClient.get('/api/owner/payments'),

  // ------------------- NEW OWNER CONFIRMATION METHODS -------------------

  // Accept a booking (generates confirmation code)
  acceptBooking: (bookingId) => apiClient.post(`/api/owner/bookings/${bookingId}/accept`),

  // Reject a booking (triggers refund)
  rejectBooking: (bookingId, reason) => apiClient.post(`/api/owner/bookings/${bookingId}/reject`, { reason }),

  // Confirm delivery with confirmation code
  confirmDelivery: (bookingId, confirmationCode) => apiClient.post(`/api/owner/bookings/${bookingId}/confirm-delivery`, { confirmation_code: confirmationCode }),

  // Update booking status
  updateBookingStatus: (bookingId, data) => apiClient.put(`/api/owner/bookings/${bookingId}/status`, data),

  // Get owner notifications with booking details
  getNotifications: () => apiClient.get('/api/owner/notifications'),

  // Mark notification as read
  markNotificationRead: (notificationId) => apiClient.put(`/api/owner/notifications/${notificationId}/mark-read`),

  // ------------------- DASHBOARD METHODS -------------------

  // Get comprehensive dashboard data
  getDashboardData: () => apiClient.get('/api/owner/dashboard'),

  // Get dashboard statistics
  getDashboardStats: () => apiClient.get('/api/owner/dashboard/stats'),

  // Get recent activity
  getRecentActivity: () => apiClient.get('/api/owner/dashboard/recent-activity'),

  // Get earnings summary
  getEarningsSummary: (period = 'month') => apiClient.get(`/api/owner/dashboard/earnings?period=${period}`),

  // Get pending actions
  getPendingActions: () => apiClient.get('/api/owner/dashboard/pending-actions'),
};