const getEmployees = async () => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}api/admin/employees`
  );
  const data = await response.json();
  return data;
}

const getDaysOfWeek = async () => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}api/admin/days`
  );
  const data = await response.json();
  return data;
}

const getTimeSlots = async () => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}api/admin/time-slots`
  );
  const data = await response.json();
  return data;
}

const getEmployeeAvailability = async (id) => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}api/admin/employee-availability/${id}`
  );
  const data = await response.json();
  return data;
}

const applyEmployeeAvailability = async (availability) => {
  const response = await fetch(`${process.env.REACT_APP_API_URL}api/admin/employee-availability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ availability }),
  });

  const data = await response.json();
  return data;
}

const deleteEmployeeAvailability = async (id) => {
  const response = await fetch(`${process.env.REACT_APP_API_URL}api/admin/employee-availability/${id}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  return data;
}

export default {
  getEmployees,
  getDaysOfWeek,
  getTimeSlots,
  getEmployeeAvailability,
  applyEmployeeAvailability,
  deleteEmployeeAvailability,
}