import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  TextField,
  CircularProgress,
} from "@mui/material";
import { useState, useEffect } from "react";

export default function CompanyForm({
  company,
  submitForm,
  formErrors,
  cleanError,
  cleanErrors,
  isPending,
}) {
  const isEditMode = Boolean(company);

  const [formData, setFormData] = useState({
    name: isEditMode ? company.name : ``,
    addressStreet: isEditMode ? company.addressStreet : ``,
    addressZip: isEditMode ? company.addressZip : ``,
    addressCity: isEditMode ? company.addressCity : ``,
    addressCountry: isEditMode ? company.addressCountry : `Deutschland`,
    phone: isEditMode ? company.phone : ``,
    email: isEditMode ? company.email : ``,
    website: isEditMode ? company.website : ``,
    taxNumber: isEditMode ? company.taxNumber : ``,
    bankAccount: isEditMode ? company.bankAccount : ``,
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
      ...company,
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

      <FormControl error={Boolean(formErrors?.website)}>
        <TextField
          value={formData.website}
          label="Website"
          variant="outlined"
          name="website"
          onChange={handleChange}
          disabled={isPending}
        />
        {formErrors?.website &&
          <FormHelperText>
            {formErrors.website}
          </FormHelperText>
        }
      </FormControl>

      <FormControl error={Boolean(formErrors?.taxNumber)}>
        <TextField
          value={formData.taxNumber}
          label="Tax Number"
          variant="outlined"
          name="taxNumber"
          onChange={handleChange}
          disabled={isPending}
        />
        {formErrors?.taxNumber &&
          <FormHelperText>
            {formErrors.taxNumber}
          </FormHelperText>
        }
      </FormControl>

      <FormControl error={Boolean(formErrors?.bankAccount)}>
        <TextField
          value={formData.bankAccount}
          label="IBAN"
          variant="outlined"
          name="bankAccount"
          onChange={handleChange}
          disabled={isPending}
        />
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
