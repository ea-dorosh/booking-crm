/* eslint-disable no-unused-vars */
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";

const timeDurations = [
  { title: "15 min", value: "00:15:00" },
  { title: "30 min", value: "00:30:00" },
  { title: "45 min", value: "00:45:00" },
  { title: "1 hour", value: "01:00:00" },
  { title: "1 hour 15 min", value: "01:15:00" },
  { title: "1 hour 30 min", value: "01:30:00" },
  { title: "1 hour 45 min", value: "01:45:00" },
  { title: "2 hours", value: "02:00:00" },
  { title: "2 hours 30 min", value: "02:30:00" },
  { title: "3 hours", value: "03:00:00" },
  { title: "3 hours 30 min", value: "03:30:00" },
  { title: "4 hours", value: "04:00:00" },
];

export default function ServiceForm({
  service,
  employees,
  serviceCategories,
  createNewService,
  formErrors,
  cleanError,
  cleanErrors,
}) {
  const isEditMode = Boolean(service);

  const [formData, setFormData] = useState({
    name: isEditMode ? service.name : ``,
    categoryId: isEditMode ? service.categoryId : ``,
    durationTime: isEditMode ? service.durationTime : ``,
    bufferTime: isEditMode && service.bufferTime ? service.bufferTime : ``,
    bookingNote: isEditMode ? service.bookingNote : ``,
    employeePrices: isEditMode ? service.employeePrices : [],
  });

  useEffect(() => {
    return () => cleanErrors()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckboxChange = (event, employeeId) => {
    const { checked } = event.target;
  
    // if (formErrors && formErrors.employeeIds) {
    //   cleanError(`employeeIds`);
    // }
  
    setFormData(prevData => ({
      ...prevData,
      employeePrices: checked
        ? [...prevData.employeePrices, { employeeId, price: '' }] // Add employee
        : prevData.employeePrices.filter(price => price.employeeId !== employeeId), // Remove employee
    }));
  };

  const handlePriceChange = (event, employeeId) => {
    const { value } = event.target;
  
    setFormData(prevData => ({
      ...prevData,
      employeePrices: prevData.employeePrices.map(employeePrice =>
        employeePrice.employeeId === employeeId ? { ...employeePrice, price: value } : employeePrice
      ),
    }));
  };

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

    await createNewService({
      ...service,
      ...formData,
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <FormControl error={Boolean(formErrors?.name)}>
        <TextField
          value={formData.name}
          label="Service Name"
          variant="outlined"
          name="name"
          onChange={handleChange}
        />
        {formErrors?.name && 
          <FormHelperText>
            {formErrors.name}
          </FormHelperText>
        }
      </FormControl>

      <FormControl
        sx={{ mt: `20px` }}
        error={Boolean(formErrors?.categoryId)}
      >
        <InputLabel id="category-select-label">Service Category</InputLabel>

        <Select
          name="categoryId"
          value={formData.categoryId}
          labelId="category-select-label"
          label="Service Category"
          onChange={handleChange}
        >
          {serviceCategories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </Select>

        {formErrors?.categoryId && 
          <FormHelperText>
            {formErrors?.categoryId}
          </FormHelperText>
        }
      </FormControl>

      <FormControl
        sx={{ mt: `20px` }}
        error={Boolean(formErrors?.durationTime)}
      >
        <InputLabel id="time-select-label">Duration Time</InputLabel>

        <Select
          name="durationTime"
          value={formData.durationTime}
          labelId="time-select-label"
          label="Duration Time"
          onChange={handleChange}
        >
          {timeDurations.map((time) => (
            <MenuItem key={time.value} value={time.value}>
              {time.title}
            </MenuItem>
          ))}
        </Select>

        {formErrors?.durationTime && 
          <FormHelperText>
            {formErrors?.durationTime}
          </FormHelperText>
        }
      </FormControl>

      <FormControl sx={{ mt: `20px` }}>
        <InputLabel id="buffer-select-label">Buffer Time</InputLabel>

        <Select
          labelId="buffer-select-label"
          name="bufferTime"
          value={formData.bufferTime}
          label="Buffer Time"
          onChange={handleChange}
        >
          <MenuItem value="">Clear</MenuItem>
          {timeDurations.map((time) => (
            <MenuItem key={time.value} value={time.value}>
              {time.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl
        sx={{ mt: `20px` }}
        error={Boolean(formErrors?.bookingNote)}
      >
        <TextField
          value={formData.bookingNote}
          label="Note"
          variant="outlined"
          name="bookingNote"
          multiline
          onChange={handleChange}
        />
        {formErrors?.bookingNote && 
          <FormHelperText>
            {formErrors.bookingNote}
          </FormHelperText>
        }
      </FormControl>

      <Box>
        <Typography variant="subtitle1" mt={2}>
          Employees for this service:
        </Typography>

        {employees?.map(employee => (
          <Box key={employee.employeeId} mt={2} sx={{
            border: `1px solid #ccc`,
            borderRadius: `3px`,
            padding: `10px`,
          }}>
            <FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    name="employeeName"
                    checked={formData.employeePrices.some(employeePrice => employeePrice.employeeId === employee.employeeId)}
                    onChange={event => handleCheckboxChange(event, employee.employeeId)}
                    value={employee.employeeId}
                  />
                }
                label={`${employee.firstName} ${employee.lastName}`}
              />
            </FormControl>
            
            {formData.employeePrices.some(employeePrice => employeePrice.employeeId === employee.employeeId) && <FormControl error={Boolean(formErrors?.name)}>
              <TextField
                value={formData.employeePrices.find(employeePrice => employeePrice.employeeId === employee.employeeId).price}
                label="Service Price"
                variant="outlined"
                name="employeePrice"
                onChange={event => handlePriceChange(event, employee.employeeId)}
                size="small"
              />
            </FormControl>}
          </Box>
        ))}

        {formErrors?.employeeIds && 
          <FormHelperText>
            {formErrors.employeeIds}
          </FormHelperText>
        }
      </Box>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ mt: `20px` }}
        disabled={formErrors && Object.keys(formErrors).length > 0}
      >
        Save
      </Button>
    </Box>
  );
}
