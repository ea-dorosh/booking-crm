import axios, { handleAxiosError } from '@/services/axios.service';

const getCompany = async () => {
  try {
    const response = await axios.get(`/company`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const createCompany = async (company) => {
  try {
    const response = await axios.post(`/company/create-company`, company);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const updateCompany = async (company) => {
  try {
    const response = await axios.put(`/company/edit/${company.id}`, company);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const companyService = {
  createCompany,
  getCompany,
  updateCompany,
};

export default companyService;
