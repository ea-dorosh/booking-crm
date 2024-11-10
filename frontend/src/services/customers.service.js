import axios, { handleAxiosError } from '@/services/axios.service';

const getCustomers = async () => {
  try {
    const response = await axios.get(`/customers`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const customersService = {
  getCustomers,
};

export default customersService;
