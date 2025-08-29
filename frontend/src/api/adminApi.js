import { apiClient } from './apiConfig';

export const adminApi = {
  // Get all users
  getUsers: (params) => apiClient.get('/admin/users', { params }),

  // Get user by ID
  getUser: (id) => apiClient.get(`/admin/users/${id}`),

  // Create user
  createUser: (data) => apiClient.post('/admin/users', data),

  // Update user
  updateUser: (id, data) => apiClient.put(`/admin/users/${id}`, data),

  // Toggle user restriction
  toggleUserRestriction: (id, isRestricted) => apiClient.put(`/admin/users/${id}/restrict`, { is_restricted: isRestricted }),

  // Delete user
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),

  // Get owner requests
  getOwnerRequests: () => apiClient.get('/admin/owner-requests'),

  // Update owner request status
  updateOwnerRequest: (id, data) => apiClient.put(`/admin/owner-requests/${id}`, data),

  // Get categories
  getCategories: () => apiClient.get('/admin/categories'),

  // Create category
  createCategory: (data) => apiClient.post('/admin/categories', data),

  // Update category
  updateCategory: (id, data) => apiClient.put(`/admin/categories/${id}`, data),

  // Delete category
  deleteCategory: (id) => apiClient.delete(`/admin/categories/${id}`),

  // Get category requirements
  getCategoryRequirements: (categoryId) => apiClient.get(`/admin/categories/${categoryId}/requirements`),

  // Add category requirement
  addCategoryRequirement: (categoryId, data) => apiClient.post(`/admin/categories/${categoryId}/requirements`, data),

  // Update category requirement
  updateCategoryRequirement: (categoryId, reqId, data) => apiClient.put(`/admin/categories/${categoryId}/requirements/${reqId}`, data),

  // Delete category requirement
  deleteCategoryRequirement: (categoryId, reqId) => apiClient.delete(`/admin/categories/${categoryId}/requirements/${reqId}`),

  // Get all bookings (admin can see all)
  getBookings: (params) => apiClient.get('/admin/bookings', { params }),

  // Update booking status (admin)
  updateBookingStatus: (id, data) => apiClient.put(`/admin/bookings/${id}/status`, data),

  // Get all complaints (admin can see all)
  getComplaints: (params) => apiClient.get('/admin/complaints', { params }),

  // Get all payments (admin can see all)
  getPayments: (params) => apiClient.get('/admin/payments', { params }),

  // Get payment details with user information (admin)
  getPaymentDetails: (id) => apiClient.get(`/admin/payments/${id}/details`),



  // Get dashboard statistics
  getDashboardStats: () => apiClient.get('/admin/dashboard/stats'),

  // Get recent activity
  getRecentActivity: () => apiClient.get('/admin/dashboard/activity'),

  // Get system reports
  getSystemReports: () => apiClient.get('/admin/reports'),

  // Generate report
  generateReport: (type, params) => apiClient.post('/admin/reports/generate', { type, params }),

  // Reports API methods
  getSystemOverview: () => apiClient.get('/reports/admin/system-overview'),
  getUserAnalytics: () => apiClient.get('/reports/admin/user-analytics'),
  getBookingAnalytics: () => apiClient.get('/reports/admin/booking-analytics'),
  exportSystemReport: (format) => apiClient.get(`/reports/admin/export-system-report?format=${format}`, { responseType: 'blob' }),
  getEarningsSummary: (params) => apiClient.get('/reports/earnings', { params }),
  getCompletedBookings: (params) => apiClient.get('/reports/completed-bookings', { params }),

  // Get system settings
  getSystemSettings: () => apiClient.get('/admin/settings'),

  // Update system settings
  updateSystemSettings: (data) => apiClient.put('/admin/settings', data),

  // Get audit logs
  getAuditLogs: (params) => apiClient.get('/admin/audit-logs', { params }),

  // Export data
  exportData: (type, format) => apiClient.get(`/admin/export/${type}`, {
    params: { format },
    responseType: 'blob'
  }),

  // Owner Requirements Management
  getOwnerRequirements: () => apiClient.get('/admin/owner-requirements'),
  createOwnerRequirement: (data) => apiClient.post('/admin/owner-requirements', data),
  updateOwnerRequirement: (id, data) => apiClient.put(`/admin/owner-requirements/${id}`, data),
  deleteOwnerRequirement: (id) => apiClient.delete(`/admin/owner-requirements/${id}`),
  reorderOwnerRequirements: (data) => apiClient.post('/admin/owner-requirements/reorder', data),

  // Owner Requests Management
  getPendingOwnerRequests: () => apiClient.get('/admin/owner-requests'),
  updateOwnerRequest: (id, data) => apiClient.put(`/admin/owner-requests/${id}`, data),

  // Held Payments Management
  getHeldPayments: () => apiClient.get('/admin/held-payments'),
  approveHeldPayment: (bookingId, data) => apiClient.post(`/admin/held-payments/${bookingId}/approve`, data),
  rejectHeldPayment: (bookingId, data) => apiClient.post(`/admin/held-payments/${bookingId}/reject`, data)
};