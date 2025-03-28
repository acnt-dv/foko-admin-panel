// src/config/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://103.75.198.210:8080/api/',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;