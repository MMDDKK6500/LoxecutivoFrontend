import axios from 'axios';

export const apiExport = axios.create({
  baseURL: '/export',
  headers: {
    Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
});

apiExport.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiExport.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);
