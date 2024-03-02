const createAppointment = async (appointment) => {
  const response = await fetch(`${process.env.REACT_APP_API_URL}api/appointments/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ appointment }),
  });

  try {
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};

const appointmentsService = {
  createAppointment,
};

export default appointmentsService;
