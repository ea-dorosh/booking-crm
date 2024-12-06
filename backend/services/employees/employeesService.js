const getEmployees = async (dbPool) => {
  const sql = `
    SELECT 
      employee_id, 
      first_name, 
      last_name, 
      email, 
      phone, 
      image 
    FROM Employees`;

    const [results] = await dbPool.query(sql);

    const employees = results.map((row) => ({
      employeeId: row.employee_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      image: row.image ? `${process.env.SERVER_API_URL}/images/${row.image}` : `${process.env.SERVER_API_URL}/images/no-user-photo.png`,
    }));

    return employees;
};

const checkEmployeeTimeNotOverlap = async (dbPool, { date, employeeId, timeStart, timeEnd }) => {
  const checkAvailabilityQuery = `
    SELECT * FROM SavedAppointments
    WHERE employee_id = ? 
    AND date = ? 
    AND (
      (time_start >= ? AND time_start < ?) OR 
      (time_end > ? AND time_end <= ?) OR 
      (time_start <= ? AND time_end >= ?)
    )
  `;

  const checkAvailabilityValues = [
    employeeId, 
    date, 
    timeStart, 
    timeEnd, 
    timeStart,
    timeEnd, 
    timeStart, 
    timeEnd,
  ];

  const [existingAppointments] = await dbPool.query(checkAvailabilityQuery, checkAvailabilityValues);

  if (existingAppointments.length > 0) {
    return { isEmployeeAvailable: false };
  } else {
    return { isEmployeeAvailable: true };
  }
};

module.exports = {
  checkEmployeeTimeNotOverlap,
  getEmployees,
};