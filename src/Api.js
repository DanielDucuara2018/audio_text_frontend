import axios from 'axios';

// Get API URL from environment variable or use default
// React requires REACT_APP_ prefix, so we map from our AUDIO_TEXT_ vars
const API_BASE_URL = process.env.REACT_APP_AUDIO_TEXT_API_URL_ENV || 'http://localhost:3203';
const WS_BASE_URL = process.env.REACT_APP_AUDIO_TEXT_WS_URL_ENV || 'ws://localhost:3203';

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
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
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
export const getWebSocketUrl = (path) => `${WS_BASE_URL}/api/v1${path}`;

export default api;

