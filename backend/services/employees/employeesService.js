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
};