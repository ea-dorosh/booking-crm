import axios, { handleAxiosError } from '@/services/axios.service';

const getCustomers = async () => {
  try {
    const response = await axios.get(`/customers`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const getCustomer = async (id) => {
  try {
    const response = await axios.get(`/customers/${id}`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const getCustomerAppointments = async (id) => {
  try {
    const response = await axios.get(`/customers/${id}/saved-appointments`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const createCustomer = async (customer) => {
  try {
    customer.salutation = Number(customer.salutation);

    const response = await axios.post(`/customers/create-customer`, customer);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const updateCustomer = async (customer) => {
  try {
    customer.salutation = Number(customer.salutation);

    const response = await axios.put(`/customers/edit/${customer.id}`, customer);

    return response.data;
  } catch (error) {    
    handleAxiosError(error);
  }
};

const customersService = {
  createCustomer,
  getCustomer,
  getCustomerAppointments,
  getCustomers,
  updateCustomer,
};

export default customersService;
