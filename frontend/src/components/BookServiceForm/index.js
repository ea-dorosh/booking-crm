import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import TextField from "@mui/material/TextField";
import { useState } from "react";

export default function BookServiceForm({
  createAppointment,
  formErrors,
}) {
  const [formData, setFormData] = useState({
    firstName: ``,
    lastName: ``,
    phone: ``,
    email: ``,
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    if(formErrors && formErrors[name]) {
      delete formErrors[name];
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    createAppointment({
      ...formData,
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "300px",
        gap: "20px",
      }}
    >
      <FormControl error={Boolean(formErrors?.firstName)}>
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

      <FormControl error={Boolean(formErrors?.lastName)}>
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
        error={Boolean(formErrors?.phone)}
      >
        <TextField
          value={formData.phone}
          label="Phone"
          variant="outlined"
          name="phone"
          type="tel"
          placeholder="+49 111 111 11111"
          onChange={handleChange}
        />
        {formErrors?.phone && 
            <FormHelperText>
              {formErrors.phone}
            </FormHelperText>
        }
      </FormControl>

      <FormControl error={Boolean(formErrors?.email)}>
        <TextField
          value={formData.email}
          label="Email"
          variant="outlined"
          name="email"
          type="email"
          onChange={handleChange}
        />
        {formErrors?.email && 
          <FormHelperText>
            {formErrors.email}
          </FormHelperText>
        }
      </FormControl>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        onClick={handleSubmit}
      >
        Submit
      </Button>
    </Box>
  );
}
