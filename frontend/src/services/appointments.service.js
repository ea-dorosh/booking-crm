import ERRORS from '@/constants/errors';

const createAppointment = async (appointment) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}api/appointments/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ appointment }),
    });

    if (response.status === ERRORS.VALIDATION_ERROR) {
      const data = await response.json();

      throw new Error(JSON.stringify(data.errors));
    } else if (response.status === ERRORS.CONFLICT_ERROR) {
      const data = await response.json();

      throw new Error(JSON.stringify(data.error));
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const appointmentsService = {
  createAppointment,
};

export default appointmentsService;
