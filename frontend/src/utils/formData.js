export const appendFormData = (data, formData = new FormData(), parentKey = '') => {
  if (data && typeof data === `object` && !(data instanceof File)) {
    Object.keys(data).forEach(key => {
      const fullKey = parentKey ? `${parentKey}[${key}]` : key;

      appendFormData(data[key], formData, fullKey);
    });
  } else {
    formData.append(parentKey, data);
  }

  return formData;
};
