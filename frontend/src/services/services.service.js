import axios from 'axios';
import ERRORS from '@/constants/errors';
import { appendFormData } from '@/utils/formData';

const token = localStorage.getItem(`token`);

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const handleAxiosError = (error) => {
  if (error.response && error.response.status === ERRORS.VALIDATION_ERROR) {
    throw new Error(JSON.stringify(error.response.data.errors));
  }
  throw error;
};

const getServices = async () => {
  try {
    const response = await axiosInstance.get(`api/protected/services`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const getServiceCategories = async () => {
  try {
    const response = await axiosInstance.get(`api/protected/services/categories`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const createService = async (service) => {
  if (service.bufferTime === ``) {
    service.bufferTime = null;
  }

  try {
    const response = await axiosInstance.post(
      `api/protected/services/create-service`, 
      service,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const updateService = async (service) => {
  if (service.bufferTime === ``) {
    service.bufferTime = null;
  }

  try {
    const response = await axiosInstance.put(
      `api/protected/services/edit/${service.id}`, 
      service,
      { 
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const updateServiceCategory = async (serviceCategory) => {
  const formData = appendFormData(serviceCategory);

  try {
    const response = await axiosInstance.put(
      `api/protected/services/category/edit/${serviceCategory.id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const deleteService = async (id) => {
  try {
    const response = await axiosInstance.delete(`api/protected/services/${id}`);
    
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const serviceService = {
  getServices,
  getServiceCategories,
  createService,
  updateService,
  updateServiceCategory,
  deleteService,
};

export default serviceService;
