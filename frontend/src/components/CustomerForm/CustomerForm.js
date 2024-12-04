import {
  Box,
  Button,
  FormControl, 
  FormLabel,
  FormControlLabel,
  FormHelperText,
  TextField,
  Radio,
  RadioGroup,
  CircularProgress,
} from "@mui/material";
import { useState, useEffect } from "react";

export default function CustomerForm({
  customer,
  submitForm,
  formErrors,
  cleanError,
  cleanErrors,
  isPending,
}) {
  const isEditMode = Boolean(customer);

  const [formData, setFormData] = useState({
    salutation: isEditMode ? customer.salutation : null,
    firstName: isEditMode ? customer.firstName : ``,
    lastName: isEditMode ? customer.lastName : ``,
    email: isEditMode ? customer.email : ``,
    phone: isEditMode ? customer.phone : ``,
  });

  useEffect(() => {
    return () => cleanErrors()
  }, []); 

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

    await submitForm({
      ...customer,
      ...formData,
    });
  };

  return (
    <Box
      sx={{
        display: `flex`,
        flexDirection: `column`,
        gap: 2.2,
      }}
    >
      <FormControl error={Boolean(formErrors?.salutation)}>
        <Box sx={{
          display: `flex`,
          flexDirection: `row`,
          alignItems: `center`,
          gap: 3,
        }}>
          <FormLabel 
            id="salutation-group-label"
            sx={{ mr: 4 }}
          >
            Anrede
          </FormLabel>

          <RadioGroup
            row
            name="salutation"
            value={formData.salutation}
            onChange={handleChange}
          >
            <FormControlLabel value={1} control={
              <Radio color="info" disabled={isPending} />
            } label="Frau"  />

            <FormControlLabel value={0} control={
              <Radio color="info" disabled={isPending} />
            } label="Herr" />
          </RadioGroup>
        </Box>

        {formErrors?.salutation && 
          <FormHelperText>
            {formErrors.salutation}
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
          disabled={isPending}
        />
        {formErrors?.lastName && 
          <FormHelperText>
            {formErrors.lastName}
          </FormHelperText>
        }
      </FormControl>
      
      <FormControl error={Boolean(formErrors?.firstName)}>
        <TextField
          value={formData.firstName}
          label="First Name"
          variant="outlined"
          name="firstName"
          onChange={handleChange}
          disabled={isPending}
        />
        {formErrors?.firstName && 
          <FormHelperText>
            {formErrors.firstName}
          </FormHelperText>
        }
      </FormControl>

      <FormControl error={Boolean(formErrors?.email)}>
        <TextField
          value={formData.email}
          label="Email"
          variant="outlined"
          name="email"
          onChange={handleChange}
          disabled={isPending}
        />
        {formErrors?.email && 
          <FormHelperText>
            {formErrors.email}
          </FormHelperText>
        }
      </FormControl>

      <FormControl error={Boolean(formErrors?.phone)}>
        <TextField
          value={formData.phone}
          label="Phone"
          variant="outlined"
          name="phone"
          onChange={handleChange}
          disabled={isPending}
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
        disabled={formErrors && Object.keys(formErrors).length > 0 || isPending}
        endIcon={isPending && <CircularProgress size={16} />}
      >
        Save
      </Button>
    </Box>
  );
}
