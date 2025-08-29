import { apiClient } from './apiConfig';

export const complaintApi = {
  submitComplaint: (data) => apiClient.post('/api/complaints/submit', data),
  getMyComplaints: () => apiClient.get('/api/complaints/my'),
  getComplaint: (id) => apiClient.get(`/api/complaints/${id}`),
  updateComplaint: (id, data) => apiClient.put(`/api/complaints/${id}`, data),
  deleteComplaint: (id) => apiClient.delete(`/api/complaints/${id}`),
  getPendingComplaints: () => apiClient.get('/api/complaints/admin/pending'),
  updateComplaintStatus: (id, data) => apiClient.put(`/api/complaints/admin/${id}`, data),
};