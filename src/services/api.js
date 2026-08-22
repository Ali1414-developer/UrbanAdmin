import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'bypass-tunnel-reminder': 'true'
  }
});

// Attach staff token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('staffToken') || localStorage.getItem('adminToken') || localStorage.getItem('receptionToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally for expired sessions (skip for login requests)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('staffToken');
      localStorage.removeItem('staffUser');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('receptionToken');
      localStorage.removeItem('receptionUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
