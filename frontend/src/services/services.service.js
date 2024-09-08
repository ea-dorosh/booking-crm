import axios from 'axios';
import ERRORS from '@/constants/errors';

// function appendFormData(data, formData = new FormData(), parentKey = '') {

//   console.log(`appendFormData called with parentKey: ${parentKey}, data:`, data);

//   if (data && typeof data === 'object' && !(data instanceof File)) {
//     console.log(`appendFormData iterating over keys of:`, data);
//     Object.keys(data).forEach(key => {
//       const fullKey = parentKey ? `${parentKey}[${key}]` : key;
//       console.log(`Recursing into key: ${key}, fullKey: ${fullKey}`);
//       appendFormData(data[key], formData, fullKey);
//     });
//   } else {
//     // If the data is a primitive type or a File, append it to FormData
//     console.log(`Appending to FormData: key = ${parentKey}, value =`, data);
//     formData.append(parentKey, data);
//   }
//   return formData;
// }

// function objectToFormData(obj) {
//   console.log('Starting objectToFormData with object:', obj);
//   return appendFormData(obj);
// }

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

  // const formData = objectToFormData(serviceCategory);

  const formData = new FormData();

  // Append the id and name to the FormData object
  formData.append('id', serviceCategory.id);
  formData.append('name', serviceCategory.name);


  // Append the image file if it exists
  if (serviceCategory.image) {
    formData.append('image', serviceCategory.image);
  }

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
    // Handle the error (axios wraps errors into its own object)
    if (error.response && error.response.status === ERRORS.VALIDATION_ERROR) {
      throw new Error(JSON.stringify(error.response.data.errors));
    }
    throw error;
  }
  
  // eslint-disable-next-line no-useless-catch
  // try {
  //   const response = await fetch(`${process.env.REACT_APP_API_URL}api/protected/services/category/edit/${serviceCategory.id}`, {
  //     method: "PUT",
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ category: serviceCategory }),
  //   });

  //   if(response.status === ERRORS.VALIDATION_ERROR) {
  //     const data = await response.json();
  //     throw new Error(JSON.stringify(data.errors));
  //   }

  //   const data = await response.json();
    
  //   return data;
  // } catch (error) {
  //   throw error;
  // }
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
