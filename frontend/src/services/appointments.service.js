import axios, { handleAxiosError } from '@/services/axios.service';
import { transformIsoDates } from '@/utils/formatters';

const getAppointments = async (startDate, status) => {
  try {
    const response = await axios.get(`/appointments`, {
      params: {
        startDate,
        status,
      },
    });

    const data = transformIsoDates(
      response.data,
      [`date`, `timeStart`, `timeEnd`, `createdDate`],
    );

    return data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const getAppointment = async (id) => {
  try {
    const response = await axios.get(`/appointments/${id}`);

    const data = transformIsoDates(
      response.data,
      [`date`, `timeStart`, `timeEnd`, `createdDate`],
    );

    return data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const cancelAppointment = async (id) => {
  try {
    const response = await axios.put(`/appointments/${id}/cancel`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

//TODO: Implement createAppointment in BE (protected route)
const createAppointment = async (appointment) => {
  try {
    const response = await axios.post(`/appointments/create`, appointment);

    return transformIsoDates(
      response.data,
      [`date`, `timeStart`, `timeEnd`, `createdDate`],
    );
  } catch (error) {
    handleAxiosError(error);
  }
};

const appointmentsService = {
  cancelAppointment,
  createAppointment,
  getAppointment,
  getAppointments,
};

export default appointmentsService;
