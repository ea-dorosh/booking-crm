import axios from 'axios';
import ERRORS from '@/constants/errors';

const normalizeBaseUrl = (url) => {
  if (!url) return `/api/protected`;
  return url.endsWith(`/`) ? `${url}api/protected` : `${url}/api/protected`;
};

const axiosInstance = axios.create({
  baseURL: normalizeBaseUrl(process.env.REACT_APP_API_URL),
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(`token`);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method !== `get` && config.method !== `head`) {
      if (config.data instanceof FormData) {
        config.headers[`Content-Type`] = `multipart/form-data`;
      } else {
        config.headers[`Content-Type`] = `application/json`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const handleAxiosError = (error) => {
  // Handle validation errors (428 Precondition Required)
  if (error?.response?.status === 428 || error?.status === ERRORS.VALIDATION_ERROR) {
    const errorData = error.response?.data || error;
    errorData.status = ERRORS.VALIDATION_ERROR;
    throw errorData;
  }

  // Handle other API errors
  if (error?.response?.data?.errorMessage) {
    throw error.response.data.errorMessage;
  } else if (error?.response?.data?.message) {
    throw error.response.data.message;
  }

  throw error.message;
};

export default axiosInstance;
