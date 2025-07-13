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

const createCompanyBranch = async (companyBranch) => {
  try {
    const response = await axios.post(`/company/create-company-branch`, companyBranch);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const updateCompanyBranch = async (companyBranch) => {
  try {
    const response = await axios.put(`/company/edit-company-branch/${companyBranch.id}`, companyBranch);

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
  createCompanyBranch,
  updateCompanyBranch,
  getCompany,
  updateCompany,
};

export default companyService;
