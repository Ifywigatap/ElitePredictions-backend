import axios from 'axios';
import { env } from '../config/env.js';

export const axiosInstance = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request logging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(
      `➡️ ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`
    );
    return config;
  },
  (error) => Promise.reject(error)
);

// Response logging
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      'Axios Error:',
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export default axiosInstance;