# Form Migration Plan

This document outlines the plan for migrating all existing forms to use the new reusable components.

## Migration Priority

### Phase 1: Simple Forms (High Priority)
1. **CompanyForm** ✅ (Example created)
2. **CompanyBranchForm** ✅ (Example created)
3. **ServiceCategoryForm** ✅ (Example created)
4. **EmployeeForm** - Simple form with image upload

### Phase 2: Complex Forms (Medium Priority)
1. **CustomerForm** ✅ (Example created)
2. **ServiceForm** - Complex form with dynamic fields
3. **InvoiceForm** - Most complex form with multiple sections

### Phase 3: Specialized Forms (Low Priority)
1. **DayFormRow** - Specialized component
2. Any other custom forms

## Migration Steps for Each Form

### Step 1: Analyze Current Form
- Identify field types and configurations
- Note any special handling (file uploads, dynamic fields, etc.)
- Document current validation logic

### Step 2: Create Field Configuration
```jsx
const formFields = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email" },
  // ... other fields
];
```

### Step 3: Replace Form Logic
- Replace `useState` with `useForm` hook
- Replace manual field rendering with `FormField` components
- Replace manual button rendering with `FormActions` component

### Step 4: Handle Special Cases
- File uploads: Use `ImageUpload` component
- Dynamic fields: Extend `FormField` or create custom components
- Complex validation: Use utility functions

### Step 5: Test and Validate
- Ensure all functionality works as before
- Test error handling
- Test loading states
- Test form submission

## Example Migration: EmployeeForm

### Before
```jsx
const [formData, setFormData] = useState({
  firstName: isEditMode ? employee.firstName : '',
  lastName: isEditMode ? employee.lastName : '',
  email: isEditMode ? employee.email : '',
  phone: isEditMode ? employee.phone : '',
  image: null,
});

const handleChange = (event) => {
  const { name, value } = event.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

// Manual field rendering for each field
```

### After
```jsx
const formFields = [
  ...PERSON_FIELDS,
  ...CONTACT_FIELDS,
];

const initialData = initializeFormData(employee, formFields);

const { formData, handleChange, handleSubmit, updateFormData } = useForm(initialData, {
  onSubmit: (data) => createEmployee(createSubmitData(employee, data)),
  formErrors,
  cleanError,
  cleanErrors,
});

// Automatic field rendering
{formFields.map((field) => (
  <FormField
    key={field.name}
    {...field}
    value={formData[field.name]}
    onChange={handleChange}
    error={formErrors?.[field.name]}
  />
))}

<ImageUpload
  name="image"
  onChange={handleImageChange}
  currentImage={employee?.image}
/>
```

## Benefits After Migration

### Code Reduction
- **CompanyForm**: ~237 lines → ~80 lines (66% reduction)
- **CustomerForm**: ~266 lines → ~100 lines (62% reduction)
- **ServiceCategoryForm**: ~133 lines → ~70 lines (47% reduction)

### Consistency
- All forms will have the same look and feel
- Standardized error handling
- Consistent loading states
- Uniform button styling

### Maintainability
- Changes to form behavior can be made in one place
- New forms can be created quickly using existing components
- Bug fixes apply to all forms automatically

## Testing Checklist

For each migrated form, verify:

- [ ] Form loads correctly in create mode
- [ ] Form loads correctly in edit mode with pre-filled data
- [ ] All fields are functional and validate correctly
- [ ] Error messages display properly
- [ ] Loading states work during submission
- [ ] Form submission works correctly
- [ ] Cancel functionality works (if applicable)
- [ ] File uploads work (if applicable)
- [ ] Dynamic fields work (if applicable)

## Rollback Plan

If issues arise during migration:

1. Keep original form files with `.original` extension
2. Test new forms thoroughly before removing old ones
3. Have feature flags ready to switch between old and new forms
4. Monitor error rates after deployment

## Timeline Estimate

- **Phase 1**: 1-2 days (simple forms)
- **Phase 2**: 3-4 days (complex forms)
- **Phase 3**: 1-2 days (specialized forms)
- **Testing**: 2-3 days
- **Total**: 7-11 days

## Success Metrics

- [ ] 50%+ reduction in form-related code
- [ ] Zero functionality regression
- [ ] Improved form consistency scores
- [ ] Faster form development time for new features
- [ ] Reduced bug reports related to forms