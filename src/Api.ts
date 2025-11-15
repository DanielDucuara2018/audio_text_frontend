import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Get API URL from environment variable or use default
// Vite requires VITE_ prefix for environment variables
const API_BASE_URL = import.meta.env.VITE_AUDIO_TEXT_API_URL_ENV || 'http://localhost:3203';
const WS_BASE_URL = import.meta.env.VITE_AUDIO_TEXT_WS_URL_ENV || 'ws://localhost:3203';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    console.error('Response error:', error.response?.data || error.message);

    // Handle specific error cases
    if (error.response?.status === 413) {
      error.message = 'File too large. Please select a smaller file.';
    } else if (error.response?.status === 415) {
      error.message = 'Unsupported file type. Please select a valid audio file.';
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please try again.';
    } else if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

// Export WebSocket URL for use in other components
export const getWebSocketUrl = (path: string) => `${WS_BASE_URL}/api/v1${path}`;

export default api;

