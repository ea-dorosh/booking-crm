import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useState } from "react";

export default function BookServiceForm({createAppointment}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // You can perform form submission logic here
    console.log("Form submitted:", formData);
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
      <TextField
        value={formData.firstName}
        label="First Name"
        variant="outlined"
        name="firstName"
        onChange={handleChange}
      />

      <TextField
        value={formData.lastName}
        label="Last Name"
        variant="outlined"
        name="lastName"
        onChange={handleChange}
      />

      <TextField
        value={formData.phone}
        label="Phone"
        variant="outlined"
        name="phone"
        onChange={handleChange}
      />

      <TextField
        value={formData.email}
        label="Email"
        variant="outlined"
        name="email"
        onChange={handleChange}
      />

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
