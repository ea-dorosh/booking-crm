import ERRORS from '@/constants/errors';

const createAppointment = async (appointment) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}api/appointments/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ appointment }),
    });

    if(response.status === ERRORS.VALIDATION_ERROR) {
      const data = await response.json();

      throw new Error(JSON.stringify(data.errors));
    }

    const data = await response.json();

    return data;
  } catch (error) {
    throw error;
  }
};

const appointmentsService = {
  createAppointment,
};

export default appointmentsService;
