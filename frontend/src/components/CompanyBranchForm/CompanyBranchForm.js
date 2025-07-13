import { Box } from "@mui/material";
import FormActions from "@/components/common/FormActions";
import FormField from "@/components/common/FormField";
import { ADDRESS_FIELDS, CONTACT_FIELDS } from "@/constants/formFields";
import useForm from "@/hooks/useForm";
import { createSubmitData } from "@/utils/formUtils";

export default function CompanyBranchForm({
  branch,
  submitForm,
  formErrors,
  cleanError,
  cleanErrors,
  isPending,
  onCancelClick,
}) {
  const isEditMode = Boolean(branch);

  // Define form fields configuration
  const formFields = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },
    ...ADDRESS_FIELDS,
    ...CONTACT_FIELDS,
  ];

  // Initialize form data
  const initialData = formFields.reduce((acc, field) => {
    acc[field.name] = isEditMode
      ? branch[field.name] || field.defaultValue || ``
      : field.defaultValue || ``;
    return acc;
  }, {});

  const {
    formData,
    handleChange,
    handleSubmit,
  } = useForm(initialData, {
    onSubmit: (data) => submitForm(createSubmitData(branch, data)),
    formErrors: formErrors || {},
    cleanError,
    cleanErrors,
    isPending,
  });

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
          disabled={isPending}
          required={field.required}
        />
      ))}

      <FormActions
        onSubmit={handleSubmit}
        onCancel={onCancelClick}
        isPending={isPending}
        disabled={formErrors && Object.keys(formErrors).length > 0}
      />
    </Box>
  );
}
