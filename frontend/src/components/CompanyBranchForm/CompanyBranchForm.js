import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  TextField,
  CircularProgress,
} from "@mui/material";
import { useState, useEffect } from "react";

export default function CompanyBranchForm({
  branch,
  submitForm,
  formErrors,
  cleanError,
  cleanErrors,
  isPending,
  onCancelClick,
}) {
  const isEditMode = Boolean(branch);

  const [formData, setFormData] = useState({
    name: isEditMode ? branch.name : ``,
    addressStreet: isEditMode ? branch.addressStreet : ``,
    addressZip: isEditMode ? branch.addressZip : ``,
    addressCity: isEditMode ? branch.addressCity : ``,
    addressCountry: isEditMode ? branch.addressCountry : ``,
    phone: isEditMode ? branch.phone : ``,
    email: isEditMode ? branch.email : ``,
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
      ...branch,
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
      <FormControl error={Boolean(formErrors?.name)}>
        <TextField
          value={formData.name}
          label="Name"
          variant="outlined"
          name="name"
          onChange={handleChange}
          disabled={isPending}
        />
        {formErrors?.name &&
          <FormHelperText>
            {formErrors.name}
          </FormHelperText>
        }
      </FormControl>

      <FormControl error={Boolean(formErrors?.addressStreet)}>
        <TextField
          value={formData.addressStreet}
          label="Street, House Number"
          variant="outlined"
          name="addressStreet"
          onChange={handleChange}
          disabled={isPending}
        />
        {formErrors?.addressStreet &&
          <FormHelperText>
            {formErrors.addressStreet}
          </FormHelperText>
        }
      </FormControl>

      <FormControl error={Boolean(formErrors?.addressZip)}>
        <TextField
          value={formData.addressZip}
          label="Zip"
          variant="outlined"
          name="addressZip"
          onChange={handleChange}
          disabled={isPending}
        />
        {formErrors?.addressZip &&
          <FormHelperText>
            {formErrors.addressZip}
          </FormHelperText>
        }
      </FormControl>

      <FormControl error={Boolean(formErrors?.addressCity)}>
        <TextField
          value={formData.addressCity}
          label="City"
          variant="outlined"
          name="addressCity"
          onChange={handleChange}
          disabled={isPending}
        />
        {formErrors?.addressCity &&
          <FormHelperText>
            {formErrors.addressCity}
          </FormHelperText>
        }
      </FormControl>

      <FormControl error={Boolean(formErrors?.addressCountry)}>
        <TextField
          value={formData.addressCountry}
          label="Country"
          variant="outlined"
          name="addressCountry"
          onChange={handleChange}
          disabled={isPending}
        />
        {formErrors?.addressCountry &&
          <FormHelperText>
            {formErrors.addressCountry}
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

      <Button
        type="submit"
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ mt: `20px` }}
        disabled={isPending}
        endIcon={isPending && <CircularProgress size={16} />}
      >
        Save
      </Button>

      <Button
        variant="outlined"
        color="secondary"
        onClick={onCancelClick}
      >
        Cancel
      </Button>
    </Box>
  );
}
