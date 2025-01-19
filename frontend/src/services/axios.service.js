import axios from 'axios';
import ERRORS from '@/constants/errors';

const token = localStorage.getItem(`token`);

const axiosInstance = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}api/protected`,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(`token`);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const handleAxiosError = (error) => {
  if (error?.status === ERRORS.VALIDATION_ERROR) {
    error.response.data.status = ERRORS.VALIDATION_ERROR;
    throw error.response.data;
  }

  if (error?.response?.data?.error) {
    throw error.response.data.error;
  }

  throw error.message;
};

export default axiosInstance;
