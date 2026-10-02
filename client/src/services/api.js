import axios from 'axios';

// Base API configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Automatically attach JWT Bearer token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('skillswap_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 Unauthorized globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token expired or invalid, clear localStorage (avoid loop on login/register endpoints)
    if (error.response && error.response.status === 401) {
      const isAuthUrl =
        error.config.url.includes('/auth/login') ||
        error.config.url.includes('/auth/register') ||
        error.config.url.includes('/auth/google');
      if (!isAuthUrl) {
        localStorage.removeItem('skillswap_token');
      }
    }
    return Promise.reject(error);
  }
);

export default API;
