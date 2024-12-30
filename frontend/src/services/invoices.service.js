import axios, { handleAxiosError } from '@/services/axios.service';

const getInvoices = async () => {
  try {
    const response = await axios.get(`/invoices`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const invoicesService = {
  getInvoices,
};

export default invoicesService;
