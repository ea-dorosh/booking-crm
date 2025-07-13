import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';

const CategorySelectField = ({
  name,
  value,
  onChange,
  error,
  cleanError,
  disabled = false,
  serviceCategories = [],
  sx = {},
}) => {
  return (
    <Box
      sx={{
        display: `flex`,
        alignItems: `center`,
        gap: `20px`,
        ...sx,
      }}
    >
      <FormControl
        sx={{ flexGrow: 1 }}
        error={Boolean(error)}
      >
        <InputLabel id={`${name}-select-label`}>Service Category</InputLabel>

        <Select
          name={name}
          value={value}
          labelId={`${name}-select-label`}
          label="Service Category"
          onChange={(event) => {
            onChange(event);
            // Clear category error when user makes a selection
            if (cleanError && error) {
              cleanError(name);
            }
          }}
          disabled={disabled}
        >
          {serviceCategories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </Select>

        {error && (
          <FormHelperText>
            {error}
          </FormHelperText>
        )}
      </FormControl>

      {value && (
        <RouterLink to={`/categories/${value}`}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            disabled={disabled}
          >
            Edit Category
          </Button>
        </RouterLink>
      )}
    </Box>
  );
};

export default CategorySelectField;