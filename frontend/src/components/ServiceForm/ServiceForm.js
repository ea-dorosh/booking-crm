/* eslint-disable no-unused-vars */
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  TextField,
  Avatar,
  FormHelperText,
} from "@mui/material";
import FormActions from "@/components/common/FormActions";
import FormField from "@/components/common/FormField";
import { TIME_DURATIONS, BUFFER_TIME_OPTIONS } from "@/constants/formFields";
import useForm from "@/hooks/useForm";
import { createServiceSubmitData } from "@/utils/formUtils";

export default function ServiceForm({
  service,
  employees,
  serviceSubCategories,
  serviceCategories,
  createNewService,
  formErrors,
  cleanError,
  cleanErrors,
  onCancel,
}) {
  const isEditMode = Boolean(service);

  const formFields = [
    {
      name: `name`,
      label: `Service Name`,
      type: `text`,
      required: true,
    },
  ];

  // Initialize form data
  const initialData = {
    ...formFields.reduce((acc, field) => {
      acc[field.name] = isEditMode
        ? service[field.name] || field.defaultValue || ``
        : field.defaultValue || ``;
      return acc;
    }, {}),
    categoryId: isEditMode ? service.categoryId : ``,
    subCategoryId: isEditMode ? (service.subCategoryId ?? ``) : ``,
    durationTime: isEditMode ? service.durationTime : ``,
    bufferTime: isEditMode && service.bufferTime ? service.bufferTime : ``,
    bookingNote: isEditMode ? service.bookingNote : ``,
    employeePrices: isEditMode ? service.employeePrices : [],
  };

  const {
    formData,
    handleChange,
    handleSubmit,
    updateFormData,
  } = useForm(initialData, {
    onSubmit: (data) => createNewService(createServiceSubmitData(service, data)),
    formErrors: formErrors || {},
    cleanError,
    cleanErrors,
  });

  // Check if all selected employees have valid prices
  const hasValidEmployeePrices = formData.employeePrices.every(emp =>
    emp.price !== null && emp.price !== undefined && emp.price !== `` && Number(emp.price) >= 0,
  );

  // Check if category is selected
  const hasValidCategory = formData.categoryId && formData.categoryId !== ``;



  // Filter sub categories based on selected category
  const filteredSubCategories = hasValidCategory
    ? serviceSubCategories.filter(subCategory => subCategory.categoryId === Number(formData.categoryId))
    : [];

  const handleCheckboxChange = (event, employeeId) => {
    const { checked } = event.target;

    updateFormData({
      employeePrices: checked
        ? [...formData.employeePrices, {
          employeeId,
          price: ``,
        }]
        : formData.employeePrices.filter(price => price.employeeId !== employeeId),
    });
  };

  const handlePriceChange = (event, employeeId) => {
    const { value } = event.target;

    updateFormData({
      employeePrices: formData.employeePrices.map(employeePrice =>
        employeePrice.employeeId === employeeId ? {
          ...employeePrice,
          price: value,
        } : employeePrice,
      ),
    });
  };

  const handleCategoryChange = (event) => {
    const {
      name, value,
    } = event.target;
    handleChange(event);

    // Clear sub category when category changes
    if (name === `categoryId`) {
      updateFormData({ subCategoryId: `` });
    }
  };

  const handleSubCategoryChange = (event) => {
    handleChange(event);
    if (cleanError) {
      cleanError(`subCategoryId`);
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.employeeId === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : ``;
  };

  const getEmployeePrice = (employeeId) => {
    const employeePrice = formData.employeePrices.find(ep => ep.employeeId === employeeId);
    return employeePrice ? employeePrice.price : ``;
  };

  const isEmployeeSelected = (employeeId) => {
    return formData.employeePrices.some(ep => ep.employeeId === employeeId);
  };

  return (
    <Box sx={{ padding: 0 }}>
      <Card
        sx={{
          marginBottom: 2,
          borderRadius: 2,
          boxShadow: `0 2px 8px rgba(0,0,0,0.08)`,
        }}
      >
        <CardContent sx={{ padding: 2.5 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              marginBottom: 2,
              color: `text.primary`,
            }}
          >
            Basic Information
          </Typography>

          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
            >
              <FormField
                type="text"
                name="name"
                label="Service Name"
                value={formData.name}
                onChange={handleChange}
                error={formErrors?.name}
                required={true}
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <FormField
                type="select"
                name="categoryId"
                label="Category"
                value={formData.categoryId}
                onChange={handleCategoryChange}
                error={formErrors?.categoryId}
                required={true}
                options={(serviceCategories || []).map(category => ({
                  value: category.id,
                  label: category.name,
                }))}
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <FormField
                type="select"
                name="subCategoryId"
                label="Sub-Category"
                value={formData.subCategoryId}
                onChange={handleSubCategoryChange}
                error={formErrors?.subCategoryId}
                required={false}
                disabled={!hasValidCategory}
                options={[
                  {
                    value: ``,
                    label: `Clear`,
                  },
                  ...filteredSubCategories.map(subCategory => ({
                    value: subCategory.id,
                    label: subCategory.name,
                  })),
                ]}
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <FormField
                type="select"
                name="durationTime"
                label="Duration"
                value={formData.durationTime}
                onChange={handleChange}
                error={formErrors?.durationTime}
                options={TIME_DURATIONS}
                required={true}
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <FormField
                type="select"
                name="bufferTime"
                label="Buffer Time"
                value={formData.bufferTime}
                onChange={handleChange}
                error={formErrors?.bufferTime}
                options={BUFFER_TIME_OPTIONS}
              />
            </Grid>

            <Grid
              item
              xs={12}
            >
              <FormField
                type="textarea"
                name="bookingNote"
                label="Note"
                value={formData.bookingNote}
                onChange={handleChange}
                error={formErrors?.bookingNote}
                rows={3}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Service Providers & Pricing */}
      <Card
        sx={{
          marginBottom: 2,
          borderRadius: 2,
          boxShadow: `0 2px 8px rgba(0,0,0,0.08)`,
        }}
      >
        <CardContent
          sx={{ padding: 2.5 }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              marginBottom: 1.5,
              color: `text.primary`,
            }}
          >
            Service Providers & Pricing
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ marginBottom: 2 }}
          >
            Select employees and set their prices for this service
          </Typography>

          <Box
            sx={{
              display: `flex`,
              flexDirection: `column`,
              gap: 1,
            }}
          >
            {employees.map((employee) => {
              const isSelected = isEmployeeSelected(employee.employeeId);
              const price = getEmployeePrice(employee.employeeId);

              return (
                <Box
                  key={employee.employeeId}
                  sx={{
                    display: `flex`,
                    alignItems: `center`,
                    padding: 2,
                    backgroundColor: isSelected ? `primary.50` : `grey.50`,
                    borderRadius: 2,
                    border: `1px solid`,
                    borderColor: isSelected ? `primary.200` : `grey.200`,
                    // Removed hover styles to prevent jumping
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => handleCheckboxChange(e, employee.employeeId)}
                        sx={{
                          color: `primary.main`,
                          '&.Mui-checked': {
                            color: `primary.main`,
                          },
                        }}
                      />
                    }
                    label=""
                    sx={{
                      margin: 0,
                      marginRight: 1.5,
                    }}
                  />

                  <Avatar
                    src={employee.image}
                    sx={{
                      width: 40,
                      height: 40,
                      marginRight: 1.5,
                      backgroundColor: `primary.main`,
                      fontSize: `1rem`,
                      fontWeight: 600,
                      border: `2px solid`,
                      borderColor: `primary.100`,
                    }}
                  >
                    {`${employee.firstName[0]}${employee.lastName[0]}`}
                  </Avatar>

                  <Box
                    sx={{ flex: 1 }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: `text.primary`,
                      }}
                    >
                      {`${employee.firstName} ${employee.lastName}`}
                    </Typography>
                  </Box>

                  {isSelected && (
                    <Box
                      sx={{
                        display: `flex`,
                        alignItems: `center`,
                        gap: 1,
                      }}
                    >
                      <TextField
                        type="number"
                        value={price}
                        onChange={(e) => handlePriceChange(e, employee.employeeId)}
                        placeholder="0"
                        size="small"
                        sx={{
                          width: 80,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            backgroundColor: `white`,
                          },
                        }}
                        InputProps={{
                          endAdornment:
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              €
                            </Typography>,
                        }}
                        error={formErrors?.employeePrices?.some(ep => ep.employeeId === employee.employeeId)}
                        helperText={formErrors?.employeePrices?.find(ep => ep.employeeId === employee.employeeId)?.price}
                      />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>

          {formErrors?.employeePrices && (
            <FormHelperText
              error
              sx={{ marginTop: 1 }}
            >
              Please select at least one employee and set valid prices
            </FormHelperText>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <Card>
        <CardContent>
          <FormActions
            onSubmit={handleSubmit}
            onCancel={onCancel}
            disabled={(formErrors && Object.keys(formErrors).length > 0) || !hasValidEmployeePrices || !hasValidCategory}
            isPending={false}
            submitText={isEditMode ? `Update Service` : `Create Service`}
            cancelText="Cancel"
            sx={{ mt: 0 }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
