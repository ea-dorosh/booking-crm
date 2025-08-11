import { Box } from "@mui/material";
import FormActions from "@/components/common/FormActions";
import FormField from "@/components/common/FormField";
import { ADDRESS_FIELDS, CONTACT_FIELDS } from "@/constants/formFields";
import useForm from "@/hooks/useForm";
import { createSubmitData } from "@/utils/formUtils";

export default function CompanyForm({
  company,
  submitForm,
  formErrors,
  cleanError,
  cleanErrors,
  isPending,
}) {
  const isEditMode = Boolean(company);

  // Define form fields configuration
  const formFields = [
    {
      name: `name`,
      label: `Name`,
      type: `text`,
      required: true,
    },
    ...ADDRESS_FIELDS,
    ...CONTACT_FIELDS,
    {
      name: `website`,
      label: `Website`,
      type: `url`,
    },
    {
      name: `taxNumber`,
      label: `Tax Number`,
      type: `text`,
    },
    {
      name: `bankAccount`,
      label: `IBAN`,
      type: `text`,
    },
  ];

  // Initialize form data
  const initialData = formFields.reduce((acc, field) => {
    acc[field.name] = isEditMode
      ? company[field.name] || field.defaultValue || ``
      : field.defaultValue || ``;
    return acc;
  }, {});

  const {
    formData,
    handleChange,
    handleSubmit,
  } = useForm(initialData, {
    onSubmit: (data) => submitForm(createSubmitData(company, data)),
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
        isPending={isPending}
        disabled={formErrors && Object.keys(formErrors).length > 0}
      />
    </Box>
  );
}
