import { useState, useCallback } from "react";

const useForm = (initialData = {}, options = {}) => {
  const {
    onSubmit,
    formErrors = {},
    cleanError,
    isPending = false,
  } = options;



  const [formData, setFormData] = useState(initialData);

  // Don't automatically clean errors on unmount
  // useEffect(() => {
  //   return () => {
  //     if (cleanErrors) {
  //       cleanErrors();
  //     }
  //   };
  // }, [cleanErrors]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;

    // Only clear error when user starts typing (not on focus)
    if (formErrors && formErrors[name] && cleanError && value.length > 0) {
      cleanError(name);
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }, [formErrors, cleanError]);

  const handleFieldChange = useCallback((name, value) => {
    if (formErrors && formErrors[name] && cleanError) {
      cleanError(name);
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }, [formErrors, cleanError]);

  const handleSubmit = useCallback(async (event) => {
    if (event) {
      event.preventDefault();
    }

    if (onSubmit) {
      await onSubmit(formData);
    }
  }, [formData, onSubmit]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
  }, [initialData]);

  const updateFormData = useCallback((newData) => {
    setFormData((prevData) => ({
      ...prevData,
      ...newData,
    }));
  }, []);

  return {
    formData,
    handleChange,
    handleFieldChange,
    handleSubmit,
    resetForm,
    updateFormData,
    isPending,
    formErrors,
  };
};

export default useForm;