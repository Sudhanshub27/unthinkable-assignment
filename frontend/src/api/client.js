import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const client = axios.create({ baseURL: API_URL });

let onUnauthorizedCallback = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorizedCallback = handler;
}

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only handle 401 token expiry/invalidation for protected endpoints, NOT /auth/login itself
    const isAuthLogin = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isAuthLogin) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      } else if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default client;
