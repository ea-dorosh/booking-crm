import { Box } from "@mui/material";
import FormActions from "@/components/common/FormActions";
import FormField from "@/components/common/FormField";
import ImageUpload from "@/components/common/ImageUpload";
import { EMPLOYEE_FIELDS } from "@/constants/formFields";
import useForm from "@/hooks/useForm";
import { createEmployeeSubmitData } from "@/utils/formUtils";

export default function EmployeeForm({
  employee,
  createEmployee,
  formErrors,
  cleanError,
  cleanErrors,
}) {
  const isEditMode = Boolean(employee);

  // Initialize form data
  const initialData = {
    ...EMPLOYEE_FIELDS.reduce((acc, field) => {
      acc[field.name] = isEditMode
        ? employee[field.name] || field.defaultValue || ``
        : field.defaultValue || ``;
      return acc;
    }, {}),
    image: null,
  };

  const {
    formData,
    handleChange,
    handleSubmit,
    updateFormData,
  } = useForm(initialData, {
    onSubmit: (data) => createEmployee(createEmployeeSubmitData(employee, data)),
    formErrors: formErrors || {},
    cleanError,
    cleanErrors,
  });

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    updateFormData({ image: file });
  };

  return (
    <Box
      sx={{
        display: `flex`,
        flexDirection: `column`,
        gap: 2.2,
      }}
    >
      {EMPLOYEE_FIELDS.map((field) => (
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

      <ImageUpload
        currentImage={employee?.image}
        onChange={handleImageChange}
        name="image"
      />

      <FormActions
        onSubmit={handleSubmit}
        disabled={formErrors && Object.keys(formErrors).length > 0}
      />
    </Box>
  );
}
