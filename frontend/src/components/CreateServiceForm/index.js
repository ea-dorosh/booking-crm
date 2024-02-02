import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import { useState, useMemo } from "react";

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

export default function CreateServiceForm({
  service,
  employees,
  createNewService,
}) {
  const isEditMode = Boolean(service);
  console.log(service);
  const [formData, setFormData] = useState({
    name: isEditMode ? service.name : "",
    durationTime: isEditMode ? service.durationTime : "",
    bufferTime: isEditMode && service.bufferTime ? service.bufferTime : "",
    employeeIds: isEditMode ? service.employeeIds : [],
  });

  const handleCheckboxChange = (event) => {
    const { value, checked } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      employeeIds: checked
        ? [...new Set([...prevData.employeeIds, Number(value)])]
        : prevData.employeeIds.filter(
            (checkboxId) => Number(checkboxId) !== Number(value)
          ),
    }));

    console.log("formData", formData.employeeIds);
  };

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
    createNewService({
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
      <TextField
        value={formData.name}
        label="Service Name"
        variant="outlined"
        name="name"
        onChange={handleChange}
      />

      <FormControl sx={{ mt: `20px` }}>
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

      <Typography variant="subtitle1" mt={2}>
        Employees:
      </Typography>

      {employees?.map((employee) => (
        <FormControlLabel
          key={employee.employeeId}
          control={
            <Checkbox
              name={employee.employeeName}
              checked={formData.employeeIds.includes(employee.employeeId)}
              onChange={handleCheckboxChange}
              value={employee.employeeId}
            />
          }
          label={employee.employeeName}
        />
      ))}

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
