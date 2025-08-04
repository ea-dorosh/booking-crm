import {
  FormControl,
  FormHelperText,
  TextField,
  Select,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Box,
  Typography,
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
          size="small"
          displayEmpty
          sx={{ width: '100%' }}
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
          variant="outlined"
          multiline
          rows={rows}
          size="small"
          sx={{ width: '100%' }}
        />
      );

    default:
      return (
        <TextField
          {...commonProps}
          variant="outlined"
          type={type}
          size="small"
          sx={{ width: '100%' }}
        />
      );
    }
  };

  return (
    <Box sx={{ width: `100%` }}>
      {/* Label above field (except for radio which has its own label) */}
      {type !== "radio" && (
        <Typography
          variant="body2"
          sx={{
            mb: 0.5,
            fontWeight: 500,
            color: error ? 'error.main' : 'text.primary'
          }}
        >
          {label}
          {required && <span style={{ color: 'red', marginLeft: 2 }}>*</span>}
        </Typography>
      )}

      <FormControl error={Boolean(error)} sx={{ width: `100%` }}>
        {renderField()}

        {error && (
          <FormHelperText sx={{ color: 'error.main', mt: 0.5 }}>
            {error}
          </FormHelperText>
        )}
      </FormControl>
    </Box>
  );
};

export default FormField;
