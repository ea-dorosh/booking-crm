import axios, { handleAxiosError } from '@/services/axios.service';
import { appendFormData } from '@/utils/formData';

const getEmployees = async (statuses) => {
  try {
    const params = {};
    if (Array.isArray(statuses) && statuses.length) {
      params.status = statuses.join(`,`);
    }
    const response = await axios.get(`/employees`, { params });

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

const updateEmployeeStatus = async (employeeId, status) => {
  try {
    const response = await axios.put(`/employees/${employeeId}/status`, {
      status,
    });

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

const getEmployeeAppointments = async (id, filters = {}) => {
  try {
    const params = new URLSearchParams();

    // Add filter parameters if they exist
    if (filters.startDate) params.append(`startDate`, filters.startDate);
    if (filters.endDate) params.append(`endDate`, filters.endDate);

    // Handle status parameter - pass null as string 'null' for "All Status"
    if (filters.status !== undefined) {
      const statusValue = filters.status === null ? `null` : filters.status.toString();
      params.append(`status`, statusValue);
    }

    if (filters.sortBy) params.append(`sortBy`, filters.sortBy);
    if (filters.sortOrder) params.append(`sortOrder`, filters.sortOrder);

    const queryString = params.toString();
    const url = `/employees/${id}/appointments${queryString ? `?${queryString}` : ``}`;

    const response = await axios.get(url);

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
  updateEmployeeStatus,
};

export default adminService;
