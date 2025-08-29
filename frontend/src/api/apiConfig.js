import axios from 'axios';

// Prefer env var in production builds; fallback to localhost in dev
const baseURL = import.meta?.env?.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

export const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT token auto-attach
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  // Skip token attachment for auth endpoints
  const isAuthEndpoint = config.url?.includes('/auth/login') ||
    config.url?.includes('/auth/register');

  if (token && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('❌ API Error - Status:', error.response?.status);
    console.error('❌ API Error - URL:', error.config?.url);
    console.error('❌ API Error - Message:', error.message);
    console.error('❌ API Error - Response:', error.response?.data);

    // Only redirect to login on 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Don't redirect or clear tokens for login/register requests
      const isAuthRequest = error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register');

      // Don't redirect if we're already on login page
      const isOnLoginPage = window.location.pathname === '/login';

      // Don't redirect for payment/confirmation requests (let component handle it)
      const isPaymentRequest = error.config?.url?.includes('/complete-payment') ||
        error.config?.url?.includes('/payment/') ||
        error.config?.url?.includes('/payments/') ||
        error.config?.url?.includes('/confirm-delivery') ||
        error.config?.url?.match(/\/payment\/\d+$/); // Payment status endpoint

      // Don't redirect for auth requests, if already on login page, or payment requests
      if (!isAuthRequest && !isOnLoginPage && !isPaymentRequest) {
        // Check if we just logged in (token was stored recently)
        const tokenAge = Date.now() - (localStorage.getItem('tokenTimestamp') || 0);
        const justLoggedIn = tokenAge < 10000; // Increased to 10 seconds threshold

        // Check if token exists and is valid format
        const token = localStorage.getItem('token');
        const hasValidToken = token && token.split('.').length === 3;

        if (!justLoggedIn && hasValidToken) {
          // Only redirect if we have a valid token format and it's not a recent login
          console.log('Token validation failed, redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('tokenTimestamp');
          // Use React Router navigation instead of window.location
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        } else if (!hasValidToken) {
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('tokenTimestamp');
        } else {
          // Token might be valid but request failed for other reasons
          console.log('Token appears valid but request failed - not redirecting');
        }
      } else if (isPaymentRequest) {
        console.log('Payment request failed with 401 - letting component handle it');
      }
    }

    return Promise.reject(error);
  }
);