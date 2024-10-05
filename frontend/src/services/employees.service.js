import axios, { handleAxiosError } from '@/services/axios.service';

const getEmployees = async () => {
  try {
    const response = await axios.get(`/employees`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const createEmployee = async (employee) => {
  try {
    const response = await axios.post(`/employees/create-employee`, employee);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const updateEmployee = async (employee) => {
  try {
    const response = await axios.put(`/employees/edit/${employee.employeeId}`, employee);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const getEmployeeAvailability = async (id) => {
  try {
    const response = await axios.get(`/employees/employee-availability/${id}`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const applyEmployeeAvailability = async (availability) => {
  try {
    const response = await axios.post(`/employees/employee-availability`, availability);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const deleteEmployeeAvailability = async (id) => {
  try {
    const response = await axios.delete(`/employees/employee-availability/${id}`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const adminService = {
  applyEmployeeAvailability,
  createEmployee,
  deleteEmployeeAvailability,
  getEmployeeAvailability,
  getEmployees,
  updateEmployee,
};

export default adminService;
