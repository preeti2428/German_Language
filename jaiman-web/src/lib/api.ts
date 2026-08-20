import axios from 'axios';

const api = axios.create({
  baseURL: 'https://german-language-mwmn.onrender.com/api',
});

// Request interceptor to automatically add the JWT token to every request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
