import { apiClient } from './apiConfig';

export const notificationApi = {
  // User Notification Management
  getNotifications: () => apiClient.get('/notifications/'),
  getNotification: (id) => apiClient.get(`/notifications/${id}`),
  markAsRead: (id) => apiClient.post(`/notifications/mark-read/${id}`),
  deleteNotification: (id) => apiClient.delete(`/notifications/${id}`),

  // Admin Notification Creation
  createNotification: (data) => apiClient.post('/notifications/', data),
};