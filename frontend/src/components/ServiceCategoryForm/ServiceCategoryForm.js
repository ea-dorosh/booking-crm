import { Box, Card, CardContent } from "@mui/material";
import FormActions from "@/components/common/FormActions";
import FormField from "@/components/common/FormField";
import ImageUpload from "@/components/common/ImageUpload";
import useForm from "@/hooks/useForm";
import { createSubmitData } from "@/utils/formUtils";

export default function ServiceCategoryForm({
  category,
  submitForm,
  formErrors,
  cleanError,
  cleanErrors,
  onCancelEdit,
}) {
  const isEditMode = Boolean(category);

  // Define form fields configuration
  const formFields = [
    {
      name: `name`,
      label: `Service Category Name`,
      type: `text`,
      required: true,
    },
  ];

  // Initialize form data
  const initialData = formFields.reduce((acc, field) => {
    acc[field.name] = isEditMode
      ? category[field.name] || field.defaultValue || ``
      : field.defaultValue || ``;
    return acc;
  }, {});

  const {
    formData,
    handleChange,
    handleSubmit,
    updateFormData,
  } = useForm(initialData, {
    onSubmit: (data) => submitForm(createSubmitData(category, data)),
    formErrors: formErrors || {},
    cleanError,
    cleanErrors,
  });

  const handleImageChange = (event) => {
    const [file] = event.target.files;
    updateFormData({ image: file });
  };

  return (
    <Card>
      <CardContent>
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

          <ImageUpload
            name="image"
            onChange={handleImageChange}
            currentImage={category?.image}
          />

          <FormActions
            onSubmit={handleSubmit}
            disabled={formErrors && Object.keys(formErrors).length > 0}
            onCancel={onCancelEdit}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
