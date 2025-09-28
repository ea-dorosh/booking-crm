import axios, { handleAxiosError } from '@/services/axios.service';
import { appendFormData } from '@/utils/formData';

const getServices = async () => {
  try {
    // Always fetch all services - filtering will be done on frontend
    const response = await axios.get(`/services`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const getServiceSubCategories = async () => {
  try {
    // Always fetch all sub-categories - filtering will be done on frontend
    const response = await axios.get(`/services/sub-categories`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const getServiceCategories = async () => {
  try {
    // Always fetch all categories - filtering will be done on frontend
    const response = await axios.get(`/services/categories`);

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
    const response = await axios.post(`/services/create-service`, service);

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
    const response = await axios.put(`/services/edit/${service.id}`, service);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const updateServiceStatus = async (serviceId, status) => {
  try {
    const response = await axios.put(`/services/edit/${serviceId}`, { status });

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const updateServiceSubCategory = async (serviceSubCategory) => {
  const formData = appendFormData(serviceSubCategory);

  try {
    const response = await axios.put(`/services/sub-category/edit/${serviceSubCategory.id}`, formData);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const createServiceSubCategory = async (serviceSubCategory) => {
  const formData = appendFormData(serviceSubCategory);

  try {
    const response = await axios.post(`/services/sub-category/create`, formData);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const updateServiceCategory = async (serviceCategory) => {
  const formData = appendFormData(serviceCategory);

  try {
    const response = await axios.put(`/services/category/edit/${serviceCategory.id}`, formData);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const createServiceCategory = async (serviceCategory) => {
  const formData = appendFormData(serviceCategory);

  try {
    const response = await axios.post(`/services/category/create`, formData);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const serviceService = {
  getServices,
  getServiceSubCategories,
  getServiceCategories,
  createService,
  updateService,
  updateServiceStatus,
  updateServiceSubCategory,
  createServiceSubCategory,
  updateServiceCategory,
  createServiceCategory,
};

export default serviceService;
