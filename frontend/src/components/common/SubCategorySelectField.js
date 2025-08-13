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

const SubCategorySelectField = ({
  name,
  value,
  onChange,
  error,
  cleanError,
  disabled = false,
  serviceSubCategories = [],
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
        <InputLabel
          id={`${name}-select-label`}
        >Service Sub Category
        </InputLabel>

        <Select
          name={name}
          value={value}
          labelId={`${name}-select-label`}
          label="Service Sub Category"
          onChange={(event) => {
            onChange(event);
            // Clear sub category error when user makes a selection
            if (cleanError && error) {
              cleanError(name);
            }
          }}
          disabled={disabled}
        >
          {serviceSubCategories.map((subCategory) => (
            <MenuItem
              key={subCategory.id}
              value={subCategory.id}
            >
              {subCategory.name}
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
        <RouterLink
          to={`/categories/${value}`}
        >
          <Button
            variant="outlined"
            color="primary"
            size="small"
            disabled={disabled}
          >
            Edit Sub Category
          </Button>
        </RouterLink>
      )}
    </Box>
  );
};

export default SubCategorySelectField;