/* eslint-disable no-unused-vars */
import { Box } from "@mui/material";
import CategorySelectField from "@/components/common/CategorySelectField";
import EmployeePriceFields from "@/components/common/EmployeePriceFields";
import FormActions from "@/components/common/FormActions";
import FormField from "@/components/common/FormField";
import { TIME_DURATIONS, BUFFER_TIME_OPTIONS } from "@/constants/formFields";
import useForm from "@/hooks/useForm";
import { createServiceSubmitData } from "@/utils/formUtils";

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

  // Define form fields configuration
  const formFields = [
    {
      name: "name",
      label: "Service Name",
      type: "text",
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
    emp.price !== null && emp.price !== undefined && emp.price !== '' && Number(emp.price) >= 0
  );

  // Check if category is selected
  const hasValidCategory = formData.categoryId && formData.categoryId !== '';

  const handleCheckboxChange = (event, employeeId) => {
    const { checked } = event.target;

    updateFormData({
      employeePrices: checked
        ? [...formData.employeePrices, { employeeId, price: '' }]
        : formData.employeePrices.filter(price => price.employeeId !== employeeId),
    });
  };

  const handlePriceChange = (event, employeeId) => {
    const { value } = event.target;

    updateFormData({
      employeePrices: formData.employeePrices.map(employeePrice =>
        employeePrice.employeeId === employeeId ? { ...employeePrice, price: value } : employeePrice
      ),
    });
  };

  return (
    <Box
      sx={{
        display: `flex`,
        flexDirection: `column`,
        gap: 2.2,
      }}
    >
      {formFields.map((field) => (
        <FormField
          key={field.name}
          type={field.type}
          name={field.name}
          label={field.label}
          value={formData[field.name]}
          onChange={handleChange}
          error={formErrors?.[field.name]}
          required={field.required}
        />
      ))}

      <CategorySelectField
        name="categoryId"
        value={formData.categoryId}
        onChange={handleChange}
        error={formErrors?.categoryId}
        cleanError={cleanError}
        serviceCategories={serviceCategories}
      />

      <FormField
        type="select"
        name="durationTime"
        label="Duration Time"
        value={formData.durationTime}
        onChange={handleChange}
        error={formErrors?.durationTime}
        options={TIME_DURATIONS}
        required={true}
      />

      <FormField
        type="select"
        name="bufferTime"
        label="Buffer Time"
        value={formData.bufferTime}
        onChange={handleChange}
        error={formErrors?.bufferTime}
        options={BUFFER_TIME_OPTIONS}
      />

      <FormField
        type="textarea"
        name="bookingNote"
        label="Note"
        value={formData.bookingNote}
        onChange={handleChange}
        error={formErrors?.bookingNote}
        rows={3}
      />

      <EmployeePriceFields
        employees={employees}
        employeePrices={formData.employeePrices}
        onCheckboxChange={handleCheckboxChange}
        onPriceChange={handlePriceChange}
        formErrors={formErrors}
        cleanError={cleanError}
      />

      <FormActions
        onSubmit={handleSubmit}
        disabled={(formErrors && Object.keys(formErrors).length > 0) || !hasValidEmployeePrices || !hasValidCategory}
        isPending={false}
      />
    </Box>
  );
}
