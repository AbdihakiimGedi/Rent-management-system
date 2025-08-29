import { apiClient } from './apiConfig';

export const paymentApi = {
  // Payment Status Viewing
  getPaymentStatus: (bookingId) => apiClient.get(`/payment/${bookingId}`),

  // Get User Payments
  getMyPayments: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.method) queryParams.append('method', params.method);
    if (params.date) queryParams.append('date', params.date);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString ? `/payment/my-payments?${queryString}` : '/payment/my-payments';
    return apiClient.get(url);
  },

  // Admin Payment Management
  releasePayment: (bookingId) => apiClient.post(`/payment/release/${bookingId}`),

  // Payment CRUD (if needed for admin)
  getPayment: (id) => apiClient.get(`/admin/payments/${id}`),
  createPayment: (data) => apiClient.post('/admin/payments', data),
  updatePayment: (id, data) => apiClient.put(`/admin/payments/${id}`, data),
  deletePayment: (id) => apiClient.delete(`/admin/payments/${id}`),
};