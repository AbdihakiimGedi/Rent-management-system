import { apiClient } from './apiConfig';

export const bookingApi = {
  // Renter Booking Management - Two-step process
  submitBookingRequirements: (itemId, data) => apiClient.post(`/api/booking/rental-items/${itemId}/requirements`, data),
  getRenterInputFields: (itemId) => apiClient.get(`/api/booking/rental-items/${itemId}/renter-fields`),
  completeBookingPayment: (bookingId, paymentData) => apiClient.post(`/api/booking/${bookingId}/complete-payment`, paymentData),

  // ------------------- NEW DELIVERY CONFIRMATION METHOD -------------------

  // Confirm delivery with confirmation code
  confirmDelivery: (bookingId, confirmationCode) => apiClient.post(`/api/booking/${bookingId}/confirm-delivery`, { confirmation_code: confirmationCode }),

  // Legacy endpoint (kept for backward compatibility)
  submitBooking: (itemId, data) => apiClient.post(`/api/booking/rental-items/${itemId}`, data),

  // View bookings
  getMyBookings: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.status) queryParams.append('status', params.status);
    if (params.date) queryParams.append('date', params.date);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString ? `/api/booking/my-bookings?${queryString}` : '/api/booking/my-bookings';
    return apiClient.get(url);
  },
  getBooking: (id) => apiClient.get(`/api/booking/${id}`),

  // Admin/System Booking Management (if needed)
  getAllBookings: () => apiClient.get('/admin/bookings'),
  getBookingDetails: (id) => apiClient.get(`/admin/bookings/${id}`),
  updateBooking: (id, data) => apiClient.put(`/admin/bookings/${id}`, data),
  deleteBooking: (id) => apiClient.delete(`/admin/bookings/${id}`),
};