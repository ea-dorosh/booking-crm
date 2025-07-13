import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";

const RadioField = ({
  name,
  label,
  value,
  onChange,
  options = [],
  error,
  disabled = false,
  required = false,
  sx = {},
}) => {
  return (
    <FormControl error={Boolean(error)} sx={sx}>
      <Box sx={{
        display: `flex`,
        flexDirection: `row`,
        alignItems: `center`,
        gap: 3,
      }}>
        <FormLabel
          id={`${name}-group-label`}
          sx={{ mr: 4 }}
          required={required}
        >
          {label}
        </FormLabel>

        <RadioGroup
          row
          name={name}
          value={value}
          onChange={onChange}
        >
          {options.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={
                <Radio color="info" disabled={disabled} />
              }
              label={option.label}
            />
          ))}
        </RadioGroup>
      </Box>

      {error && (
        <FormHelperText>
          {error}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default RadioField;