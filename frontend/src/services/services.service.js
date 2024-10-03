import axios from 'axios';
import ERRORS from '@/constants/errors';

const appendFormData = (data, formData = new FormData(), parentKey = '') => {
  if (data && typeof data === 'object' && !(data instanceof File)) {
    Object.keys(data).forEach(key => {
      const fullKey = parentKey ? `${parentKey}[${key}]` : key;

      appendFormData(data[key], formData, fullKey);
    });
  } else {
    formData.append(parentKey, data);
  }
  return formData;
}

const token = localStorage.getItem(`token`);

const getServices = async () => {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}api/protected/services`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
};

const getServiceCategories = async () => {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}api/protected/services/categories`, 
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

  return response.data;
};

const createService = async (service) => {
  if (service.bufferTime === ``) {
    service.bufferTime = null;
  }

  // eslint-disable-next-line no-useless-catch
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}api/protected/services/create-service`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ service }),
    });

    if(response.status === ERRORS.VALIDATION_ERROR) {
      const data = await response.json();
      throw new Error(JSON.stringify(data.errors));
    }

    const data = await response.json();
    
    return data;
  } catch (error) {
    throw error;
  }
};

const updateService = async (service) => {
  if (service.bufferTime === ``) {
    service.bufferTime = null;
  }

  // eslint-disable-next-line no-useless-catch
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}api/protected/services/edit/${service.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ service }),
    });

    if(response.status === ERRORS.VALIDATION_ERROR) {
      const data = await response.json();
      throw new Error(JSON.stringify(data.errors));
    }

    const data = await response.json();
    
    return data;
  } catch (error) {
    throw error;
  }
};

const updateServiceCategory = async (serviceCategory) => {  
  const formData = appendFormData(serviceCategory);

  try {    
    const response = await axios.put(
      `${process.env.REACT_APP_API_URL}api/protected/services/category/edit/${serviceCategory.id}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === ERRORS.VALIDATION_ERROR) {
      throw new Error(JSON.stringify(error.response.data.errors));
    }
    throw error;
  }
};

const deleteService = async (id) => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}api/protected/services/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  return data;
};

const serviceService = {
  getServices,
  getServiceCategories,
  updateService,
  updateServiceCategory,
  createService,
  deleteService,
};

export default serviceService;
