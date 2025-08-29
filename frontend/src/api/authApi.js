// src/api/authApi.js
import { apiClient } from './apiConfig';

const authApi = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/api/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await apiClient.post('/api/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await apiClient.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  },

  // Get user profile
  getUserProfile: async () => {
    try {
      const response = await apiClient.get('/api/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Fetching user profile failed:', error);
      throw error;
    }
  },
};

export { authApi };
