import axios, { handleAxiosError } from '@/services/axios.service';
import { appendFormData } from '@/utils/formData';

const getEmployees = async () => {
  try {
    const response = await axios.get(`/employees`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const createEmployee = async (employee) => {
  const formData = appendFormData(employee);

  try {
    const response = await axios.post(`/employees/create-employee`, formData);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const updateEmployee = async (employee) => {
  const formData = appendFormData(employee);

  try {
    const response = await axios.put(`/employees/edit/${employee.employeeId}`, formData);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const getEmployeeAvailability = async (id) => {
  try {
    const response = await axios.get(`/employees/${id}/availabilities`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const getEmployeeAppointments = async (id) => {
  try {
    const response = await axios.get(`/employees/${id}/appointments`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const applyEmployeeAvailability = async (availability) => {
  try {
    const response = await axios.post(`/employees/availability`, availability);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const deleteEmployeeAvailability = async (id) => {
  try {
    const response = await axios.delete(`/employees/${id}/availability`);

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
  getEmployeeAppointments,
  getEmployees,
  updateEmployee,
};

export default adminService;
