import { Box } from "@mui/material";
import FormActions from "@/components/common/FormActions";
import FormField from "@/components/common/FormField";
import RadioField from "@/components/common/RadioField";
import SectionHeader from "@/components/common/SectionHeader";
import { CUSTOMER_FIELDS } from "@/constants/formFields";
import useForm from "@/hooks/useForm";
import { createCustomerSubmitData } from "@/utils/formUtils";

export default function CustomerForm({
  customer,
  submitForm,
  formErrors,
  cleanError,
  cleanErrors,
  isPending,
  errorMessage,
}) {
  const isEditMode = Boolean(customer);

  // Initialize form data
  const initialData = {
    ...CUSTOMER_FIELDS.reduce((acc, field) => {
      acc[field.name] = isEditMode
        ? customer[field.name] || field.defaultValue || ``
        : field.defaultValue || ``;
      return acc;
    }, {}),
  };

  const {
    formData,
    handleChange,
    handleSubmit,
  } = useForm(initialData, {
    onSubmit: (data) => submitForm(createCustomerSubmitData(customer, data)),
    formErrors: formErrors || {},
    cleanError,
    cleanErrors,
  });

  // Render different field types
  const renderField = (field) => {
    if (field.type === `radio`) {
      return (
        <RadioField
          key={field.name}
          name={field.name}
          label={field.label}
          value={formData[field.name]}
          onChange={handleChange}
          options={field.options}
          error={formErrors?.[field.name]}
          disabled={isPending}
          required={field.required}
        />
      );
    }

    return (
      <FormField
        key={field.name}
        type={field.type}
        name={field.name}
        label={field.label}
        value={formData[field.name]}
        onChange={handleChange}
        error={formErrors?.[field.name]}
        required={field.required}
        disabled={isPending}
      />
    );
  };

  // Group fields by sections
  const renderFields = () => {
    const fields = [];
    let currentSection = null;

    CUSTOMER_FIELDS.forEach((field) => {
      // Add section header for address fields
      if (field.name === `addressStreet` && currentSection !== `address`) {
        fields.push(
          <SectionHeader
            key="address-header"
            title="Address"
          />,
        );
        currentSection = `address`;
      }

      fields.push(renderField(field));
    });

    return fields;
  };

  return (
    <Box
      sx={{
        display: `flex`,
        flexDirection: `column`,
        gap: 2.2,
      }}
    >
      {renderFields()}

      {errorMessage && (
        <Box
          sx={{
            color: `error.main`,
            fontSize: `16px`,
            mt: 1, 
          }}
        >
          {errorMessage}
        </Box>
      )}

      <FormActions
        onSubmit={handleSubmit}
        disabled={formErrors && Object.keys(formErrors).length > 0}
        isPending={isPending}
        submitText="Save"
      />
    </Box>
  );
}
