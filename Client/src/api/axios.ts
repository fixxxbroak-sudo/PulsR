import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Автоматически добавляем токен к запросам, если он есть
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pulsr_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});