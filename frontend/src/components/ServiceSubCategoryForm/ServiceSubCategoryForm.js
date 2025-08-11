import { Box } from "@mui/material";
import FormActions from "@/components/common/FormActions";
import FormField from "@/components/common/FormField";
import ImageUpload from "@/components/common/ImageUpload";
import useForm from "@/hooks/useForm";
import { createSubmitData } from "@/utils/formUtils";

export default function ServiceSubCategoryForm({
  subCategory,
  submitForm,
  formErrors,
  cleanError,
  cleanErrors,
  serviceCategories = [],
}) {
  const isEditMode = Boolean(subCategory);

  // Define form fields configuration
  const formFields = [
    {
      name: `name`,
      label: `Service Sub Category Name`,
      type: `text`,
      required: true,
    },
    {
      name: `categoryId`,
      label: `Service Category`,
      type: `select`,
      required: true,
      options: serviceCategories.map(category => ({
        value: category.id,
        label: category.name,
      })),
    },
  ];



  // Initialize form data
  const initialData = formFields.reduce((acc, field) => {
    if (field.name === `categoryId`) {
      acc[field.name] = isEditMode
        ? subCategory[field.name] || ``
        : field.defaultValue || ``;
    } else {
      acc[field.name] = isEditMode
        ? subCategory[field.name] || field.defaultValue || ``
        : field.defaultValue || ``;
    }
    return acc;
  }, {});

  const {
    formData,
    handleChange,
    handleSubmit,
    updateFormData,
  } = useForm(initialData, {
    onSubmit: (data) => submitForm(createSubmitData(subCategory, data)),
    formErrors: formErrors || {},
    cleanError,
    cleanErrors,
  });

  const handleImageChange = (event) => {
    const [file] = event.target.files;
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
          options={field.options}
        />
      ))}

      <ImageUpload
        name="image"
        onChange={handleImageChange}
        currentImage={subCategory?.image}
      />

      <FormActions
        onSubmit={handleSubmit}
        disabled={formErrors && Object.keys(formErrors).length > 0}
      />
    </Box>
  );
}
