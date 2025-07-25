// src/lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
});

// Interceptor to handle API responses
api.interceptors.response.use(
  (response) => response, // Directly return successful responses
  (error) => {
    // Check if the error is a 401 Unauthorized
    if (error.response && error.response.status === 401) {
      console.error("Authentication Error: Token is invalid or expired. Redirecting to login.");
      // Clear any existing auth data from storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
      // Redirect to the login page
      // We use window.location instead of router because this is not a React component
      window.location.href = '/auth/login';
    }
    // For all other errors, just reject the promise
    return Promise.reject(error);
  }
);

export default api;