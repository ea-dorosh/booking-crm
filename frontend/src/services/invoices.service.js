import axios, { handleAxiosError } from '@/services/axios.service';

const getInvoices = async () => {
  try {
    const response = await axios.get(`/invoices`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const getInvoiceById = async (id) => {
  try {
    const response = await axios.get(`/invoices/${id}`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const createInvoice = async (invoice) => {
  console.log(`invoice`, invoice);
  
  try {
    const response = await axios.post(`/invoices/create-invoice`, invoice);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const invoicesService = {
  getInvoices,
  getInvoiceById,
  createInvoice,
};

export default invoicesService;
