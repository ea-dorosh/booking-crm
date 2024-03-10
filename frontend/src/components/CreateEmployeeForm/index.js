import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import DayFormRow from "@/components/DayFormRow";

export default function CreateEmployeeForm({
  employee,
  createEmployee,
  formErrors,
  daysOfWeek,
  employeeAvailability,
  applyEmployeeAvailability,
  deleteEmployeeAvailability,
}) {
  const isEditMode = Boolean(employee);

  const [formData, setFormData] = useState({
    firstName: isEditMode ? employee.firstName : ``,
    lastName: isEditMode ? employee.lastName : ``,
    email: isEditMode ? employee.email : ``,
    phone: isEditMode ? employee.phone : ``,
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    if(formErrors && formErrors[name]) {
      delete formErrors[name];
    }
    console.log(name, value);
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await createEmployee({
      ...employee,
      ...formData,
    });
  };

  const getEmployeeAvailabilityByDayId = (dayId) => {
    return employeeAvailability?.find((item) => item.dayId === dayId);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <FormControl 
        sx={{ mt: `20px` }}
        error={formErrors?.firstName}
      >
        <TextField
          value={formData.firstName}
          label="First Name"
          variant="outlined"
          name="firstName"
          onChange={handleChange}
        />
        {formErrors?.firstName && 
          <FormHelperText>
            {formErrors.firstName}
          </FormHelperText>
        }
      </FormControl>

      <FormControl 
        sx={{ mt: `20px` }}
        error={formErrors?.lastName}
      >
        <TextField
          value={formData.lastName}
          label="Last Name"
          variant="outlined"
          name="lastName"
          onChange={handleChange}
        />
        {formErrors?.lastName && 
          <FormHelperText>
            {formErrors.lastName}
          </FormHelperText>
        }
      </FormControl>

      <FormControl 
        sx={{ mt: `20px` }}
        error={formErrors?.email}
      >
        <TextField
          value={formData.email}
          label="Email"
          variant="outlined"
          name="email"
          onChange={handleChange}
        />
        {formErrors?.email && 
          <FormHelperText>
            {formErrors.email}
          </FormHelperText>
        }
      </FormControl>

      <FormControl 
        sx={{ mt: `20px` }}
        error={formErrors?.phone}
      >
        <TextField
          value={formData.phone}
          label="Phone"
          variant="outlined"
          name="phone"
          onChange={handleChange}
        />
        {formErrors?.phone && 
          <FormHelperText>
            {formErrors.phone}
          </FormHelperText>
        }
      </FormControl>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ mt: `20px` }}
        disabled={formErrors && Object.keys(formErrors).length > 0}
      >
        Submit
      </Button>

      {daysOfWeek && employeeAvailability && (
        <Box mt={3}>
          {daysOfWeek
            .sort((a, b) => a.dayId - b.dayId)
            .map((day) => (
              <DayFormRow
                key={day.dayId}
                day={day}
                employeeAvailability={getEmployeeAvailabilityByDayId(day.dayId)}
                applyEmployeeAvailability={applyEmployeeAvailability}
                deleteEmployeeAvailability={deleteEmployeeAvailability}
              />
            ))}
        </Box>
      )}
    </Box>
  );
}
