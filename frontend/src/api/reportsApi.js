import { apiClient } from './apiConfig';

export const getReports = async () => {
  const response = await apiClient.get('/reports');
  return response.data.map(report => ({
    id: report.id,
    title: report.title,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
  }));
};

export const getReportById = async (id) => {
  const response = await apiClient.get(`/reports/${id}`);
  const report = response.data;
  return {
    id: report.id,
    title: report.title,
    content: report.content,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
  };
};

export const createReport = async (reportData) => {
  const response = await apiClient.post('/reports', {
    title: reportData.title,
    content: reportData.content,
  });
  return {
    id: response.data.id,
    title: response.data.title,
    createdAt: response.data.created_at,
    updatedAt: response.data.updated_at,
  };
};

export const updateReport = async (id, reportData) => {
  const response = await apiClient.put(`/reports/${id}`, {
    title: reportData.title,
    content: reportData.content,
  });
  return {
    id: response.data.id,
    title: response.data.title,
    createdAt: response.data.created_at,
    updatedAt: response.data.updated_at,
  };
};

export const deleteReport = async (id) => {
  await apiClient.delete(`/reports/${id}`);
};