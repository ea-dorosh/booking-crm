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
    image: null,
  });

  const [temporaryImage, setTemporaryImage] = useState(null);

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

  const handleImgChange = (event) => {
    const [file] = event.target.files
    if (file) {
      setTemporaryImage(URL.createObjectURL(file))
    }

    setFormData((prevData) => ({
      ...prevData,
      image: event.target.files[0],
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

      {(temporaryImage || employee?.image) && 
        <Box 
          sx={{
            padding: `20px`, 
            margin: `20px 0`, 
            width: `50%`,
            backgroundColor: `#f5f5f5`,
          }}
        >
          {temporaryImage && 
            <img 
              src={temporaryImage}
              style={{ width: `100%` }}
            />
          }

          {!temporaryImage && employee?.image && 
            <img 
              src={employee.image} 
              style={{ width: `100%` }}
            />
          }
        </Box>}

      <input
        accept="image/*"
        type='file'
        onChange={handleImgChange}
        style={{ margin: `20px 0`}}
      />

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
