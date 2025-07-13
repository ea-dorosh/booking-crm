import {
  FormControl,
  FormHelperText,
  TextField,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Box,
} from "@mui/material";

const FormField = ({
  type = "text",
  name,
  label,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  rows = 1,
  options = [],
  radioOptions = [],
  sx = {},
  ...props
}) => {

  const commonProps = {
    name,
    value,
    onChange,
    disabled,
    required,
    sx,
    ...props,
  };

  const renderField = () => {
    switch (type) {
    case "select":
      return (
        <Select
          {...commonProps}
          labelId={`${name}-label`}
          label={label}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      );

    case "radio":
      return (
        <Box sx={{
          display: `flex`,
          flexDirection: `row`,
          alignItems: `center`,
          gap: 3,
        }}>
          <FormLabel
            id={`${name}-group-label`}
            sx={{ mr: 4 }}
          >
            {label}
          </FormLabel>

          <RadioGroup
            row
            name={name}
            value={value}
            onChange={onChange}
          >
            {radioOptions.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio color="info" disabled={disabled} />}
                label={option.label}
              />
            ))}
          </RadioGroup>
        </Box>
      );

    case "textarea":
      return (
        <TextField
          {...commonProps}
          label={label}
          variant="outlined"
          multiline
          rows={rows}
        />
      );

    default:
      return (
        <TextField
          {...commonProps}
          label={label}
          variant="outlined"
          type={type}
        />
      );
    }
  };

  return (
    <FormControl error={Boolean(error)} sx={{ width: `100%` }}>
      {type === "select" && (
        <InputLabel id={`${name}-label`}>{label}</InputLabel>
      )}

      {renderField()}

      {error && (
        <FormHelperText sx={{ color: 'error.main' }}>
          {error}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default FormField;