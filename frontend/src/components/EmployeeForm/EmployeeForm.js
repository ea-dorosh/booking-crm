import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from "react";

export default function EmployeeForm({
  employee,
  createEmployee,
  formErrors,
  cleanError,
  cleanErrors,
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
      cleanError(name);
    }

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

  useEffect(() => {
    return () => cleanErrors()
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <FormControl 
        sx={{ mt: `20px` }}
        error={Boolean(formErrors?.firstName)}
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
        error={Boolean(formErrors?.lastName)}
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
        error={Boolean(formErrors?.email)}
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
        error={Boolean(formErrors?.phone)}
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
        disabled={formErrors && Object.values(formErrors).length > 0}
      >
        Submit
      </Button>
    </Box>
  );
}
