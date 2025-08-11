import {
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  Checkbox,
  TextField,
  FormHelperText,
} from "@mui/material";

const EmployeePriceFields = ({
  employees,
  employeePrices,
  onCheckboxChange,
  onPriceChange,
  formErrors,
  cleanError,
  disabled = false,
}) => {
  return (
    <Box>
      <Typography
        variant="subtitle1"
        mt={2}>
        Employees for this service:
      </Typography>

      {employees?.map(employee => (
        <Box
          key={employee.employeeId}
          mt={2}
          sx={{
            border: `1px solid #ccc`,
            borderRadius: `3px`,
            padding: `10px`,
          }}>
          <FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  name="employeeName"
                  checked={employeePrices.some(employeePrice => employeePrice.employeeId === employee.employeeId)}
                  onChange={event => {
                    onCheckboxChange(event, employee.employeeId);
                    // Clear employee prices error when user changes selection
                    if (cleanError && formErrors?.employeePrices) {
                      cleanError(`employeePrices`);
                    }
                  }}
                  value={employee.employeeId}
                  disabled={disabled}
                />
              }
              label={`${employee.firstName} ${employee.lastName}`}
            />
          </FormControl>

          {employeePrices.some(employeePrice => employeePrice.employeeId === employee.employeeId) && (
            <FormControl
              error={Boolean(formErrors?.employeeIds)}
              sx={{
                mt: 1,
                width: `100%`, 
              }}>
              <TextField
                value={employeePrices.find(employeePrice => employeePrice.employeeId === employee.employeeId)?.price || ``}
                label="Service Price"
                variant="outlined"
                name="employeePrice"
                onChange={event => {
                  onPriceChange(event, employee.employeeId);
                  // Clear employee prices error when user starts typing
                  if (cleanError && formErrors?.employeePrices) {
                    cleanError(`employeePrices`);
                  }
                }}
                size="small"
                disabled={disabled}
                type="number"
                inputProps={{
                  min: 0,
                  step: 0.01, 
                }}
              />
            </FormControl>
          )}
        </Box>
      ))}

      {formErrors?.employeePrices && (
        <FormHelperText
          sx={{ color: `error.main` }}>
          {formErrors.employeePrices}
        </FormHelperText>
      )}
    </Box>
  );
};

export default EmployeePriceFields;