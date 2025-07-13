# Form Components Documentation

This directory contains reusable form components that standardize form handling across the application.

## Components

### FormField
A universal form field component that supports different input types.

**Props:**
- `type` - Input type: "text", "email", "tel", "url", "select", "radio", "textarea"
- `name` - Field name
- `label` - Field label
- `value` - Field value
- `onChange` - Change handler
- `error` - Error message
- `disabled` - Disabled state
- `required` - Required field
- `options` - Array of options for select fields: `[{value, label}]`
- `radioOptions` - Array of options for radio fields: `[{value, label}]`
- `rows` - Number of rows for textarea
- `sx` - Custom styles

**Example:**
```jsx
<FormField
  type="text"
  name="firstName"
  label="First Name"
  value={formData.firstName}
  onChange={handleChange}
  error={formErrors?.firstName}
  required
/>
```

### FormActions
Standardized form action buttons.

**Props:**
- `onSubmit` - Submit handler
- `onCancel` - Cancel handler
- `submitText` - Submit button text (default: "Save")
- `cancelText` - Cancel button text (default: "Cancel")
- `isPending` - Loading state
- `disabled` - Disabled state
- `showCancel` - Show cancel button (default: true)
- `sx` - Custom styles

**Example:**
```jsx
<FormActions
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isPending={isPending}
  disabled={hasErrors}
/>
```

### ImageUpload
Standardized image upload component with preview.

**Props:**
- `name` - Input name
- `onChange` - Change handler
- `currentImage` - Current image URL
- `disabled` - Disabled state
- `sx` - Custom styles

**Example:**
```jsx
<ImageUpload
  name="image"
  onChange={handleImageChange}
  currentImage={entity?.image}
/>
```

## Hooks

### useForm
Custom hook for form state management.

**Parameters:**
- `initialData` - Initial form data
- `options` - Configuration object
  - `onSubmit` - Submit handler
  - `formErrors` - Form errors object
  - `cleanError` - Error cleaning function
  - `cleanErrors` - All errors cleaning function
  - `isPending` - Loading state

**Returns:**
- `formData` - Current form data
- `handleChange` - Change handler for inputs
- `handleFieldChange` - Direct field change handler
- `handleSubmit` - Submit handler
- `resetForm` - Form reset function
- `updateFormData` - Update form data function
- `isPending` - Loading state
- `formErrors` - Form errors

**Example:**
```jsx
const {
  formData,
  handleChange,
  handleSubmit,
} = useForm(initialData, {
  onSubmit: (data) => submitForm(data),
  formErrors,
  cleanError,
  cleanErrors,
  isPending,
});
```

## Constants

### formFields.js
Predefined field configurations for common form patterns.

**Available constants:**
- `ADDRESS_FIELDS` - Address form fields
- `CONTACT_FIELDS` - Contact form fields
- `PERSON_FIELDS` - Person form fields
- `SALUTATION_OPTIONS` - Salutation radio options
- `TIME_DURATIONS` - Time duration select options
- `DAYS_TO_PAY` - Payment days select options
- `TAX_RATES` - Tax rate select options

**Example:**
```jsx
import { ADDRESS_FIELDS, CONTACT_FIELDS } from '../../constants/formFields';

const formFields = [
  ...PERSON_FIELDS,
  ...CONTACT_FIELDS,
  ...ADDRESS_FIELDS,
];
```

## Utilities

### formUtils.js
Utility functions for form handling.

**Available functions:**
- `initializeFormData(entity, fields)` - Initialize form data with defaults
- `createSubmitData(entity, formData)` - Create submission data
- `hasFormErrors(formErrors)` - Check if form has errors
- `cleanFieldError(cleanError, formErrors, fieldName)` - Clean specific field error
- `validateRequiredFields(formData, requiredFields)` - Validate required fields
- `validateEmail(email)` - Validate email format
- `formatFormData(data)` - Format data for API submission

## Migration Guide

### Before (Original Form)
```jsx
const [formData, setFormData] = useState({
  name: isEditMode ? company.name : '',
  email: isEditMode ? company.email : '',
});

const handleChange = (event) => {
  const { name, value } = event.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

return (
  <Box>
    <FormControl error={Boolean(formErrors?.name)}>
      <TextField
        value={formData.name}
        label="Name"
        name="name"
        onChange={handleChange}
      />
      {formErrors?.name && <FormHelperText>{formErrors.name}</FormHelperText>}
    </FormControl>
    <Button onClick={handleSubmit}>Save</Button>
  </Box>
);
```

### After (Refactored Form)
```jsx
const formFields = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email" },
];

const initialData = initializeFormData(company, formFields);

const { formData, handleChange, handleSubmit } = useForm(initialData, {
  onSubmit: (data) => submitForm(createSubmitData(company, data)),
  formErrors,
  cleanError,
  cleanErrors,
  isPending,
});

return (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
    {formFields.map((field) => (
      <FormField
        key={field.name}
        {...field}
        value={formData[field.name]}
        onChange={handleChange}
        error={formErrors?.[field.name]}
        disabled={isPending}
      />
    ))}
    <FormActions onSubmit={handleSubmit} isPending={isPending} />
  </Box>
);
```

## Benefits

1. **Reduced Code Duplication** - Common patterns are abstracted into reusable components
2. **Consistent UI/UX** - Standardized styling and behavior across all forms
3. **Easier Maintenance** - Changes to form behavior can be made in one place
4. **Better Type Safety** - Consistent prop interfaces
5. **Improved Developer Experience** - Less boilerplate code to write
6. **Centralized Validation** - Common validation logic in utilities