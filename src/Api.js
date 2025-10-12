import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: "http://localhost:3203/api/v1",
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

export default api;