import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send HttpOnly refreshToken cookie automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach JWT Bearer Access Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Single-Refresh Queue & Infinite Loop Prevention
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // 1. Infinite Loop Guard: Do NOT retry refresh if failed request is refresh/login/register
    const reqUrl = originalRequest.url || '';
    if (reqUrl.includes('/auth/refresh') || reqUrl.includes('/auth/login') || reqUrl.includes('/auth/register')) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // 2. Queue Concurrent Requests: If refresh is already in progress, wait in queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return axiosClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Execute SINGLE refresh request via HttpOnly Cookie (withCredentials: true)
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newAccessToken = res.data.accessToken;
      localStorage.setItem('accessToken', newAccessToken);

      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

      // Resolve all queued requests with new token
      processQueue(null, newAccessToken);
      return axiosClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;
