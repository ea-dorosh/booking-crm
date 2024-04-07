import ERRORS from "@/constants/errors";

const token = localStorage.getItem('token');

const getEmployees = async () => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}api/employees`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  return data;
};

const createEmployee = async (employee) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}api/employees/create-employee`,
      {
        method: `POST`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ employee }),
      }
    );

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

const updateEmployee = async (employee) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}api/employees/edit/${employee.employeeId}`,
      {
        method: `PUT`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employee }),
      }
    );

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

const getEmployeeAvailability = async (id) => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}api/employees/employee-availability/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  return data;
};

const applyEmployeeAvailability = async (availability) => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}api/employees/employee-availability`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ availability }),
    }
  );

  const data = await response.json();
  return data;
};

const deleteEmployeeAvailability = async (id) => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}api/employees/employee-availability/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  return data;
};

const adminService = {
  getEmployees,
  createEmployee,
  updateEmployee,
  getEmployeeAvailability,
  applyEmployeeAvailability,
  deleteEmployeeAvailability,
};

export default adminService;
