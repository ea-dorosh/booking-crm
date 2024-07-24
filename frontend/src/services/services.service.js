import ERRORS from '@/constants/errors';

const token = localStorage.getItem(`token`);

const getServices = async () => {
  const response = await fetch(`${process.env.REACT_APP_API_URL}api/protected/services`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

const getServiceCategories = async () => {
  const response = await fetch(`${process.env.REACT_APP_API_URL}api/protected/services/categories`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
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
  // eslint-disable-next-line no-useless-catch
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}api/protected/services/category/edit/${serviceCategory.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category: serviceCategory }),
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
