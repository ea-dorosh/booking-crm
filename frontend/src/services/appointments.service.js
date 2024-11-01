import axios, { handleAxiosError } from '@/services/axios.service';

const getAppointments = async () => {
  try {
    const response = await axios.get(`/appointments`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const getAppointment = async (id) => {
  try {
    const response = await axios.get(`/appointments/${id}`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

//TODO: Implement createAppointment in BE (protected route)
const createAppointment = async (appointment) => {
  try {
    const response = await axios.post(`/appointments/create`, appointment);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const appointmentsService = {
  getAppointments,
  getAppointment,
  createAppointment,
};

export default appointmentsService;
