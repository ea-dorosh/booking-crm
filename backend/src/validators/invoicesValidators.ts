import { validateIsoDate } from '@/utils/validators.js';
import { InvoiceUpdatedData, InvoiceFormDataValidationErrors } from '@/@types/invoicesTypes.js';
import { validateCustomerData } from '@/validators/customersValidators.js';
import { parseNumberWithComma } from '@/utils/formatters.js';
import { Date_ISO_Type } from '@/@types/utilTypes.js';

const validateInvoiceFormData = (formData: InvoiceUpdatedData): InvoiceFormDataValidationErrors => {
  let errors: InvoiceFormDataValidationErrors = {};

  if (!formData.customerId && formData.isNewCustomer) {
    const customerErrors = validateCustomerData({
      formData,
      publicErrors: false,
    });

    if (Object.keys(customerErrors).length) {
      if (customerErrors.email) {
        errors.email = customerErrors.email;
      }

      if (customerErrors.firstName) {
        errors.firstName = customerErrors.firstName;
      }

      if (customerErrors.lastName) {
        errors.lastName = customerErrors.lastName;
      }

      if (customerErrors.phone) {
        errors.phone = customerErrors.phone;
      }

      if (customerErrors.salutation) {
        errors.salutation = customerErrors.salutation;
      }
    }
  } else if (!formData.customerId && !formData.isNewCustomer) {
    errors.customerId = `Customer is required. Please choose an existing customer or create a new one`;
  }

  if (!formData.dateIssued.length) {
    errors.dateIssued = `Date issued is required`;
  } else if (!validateIsoDate(formData.dateIssued as Date_ISO_Type)) {
    errors.dateIssued = `Invalid date format`;
  }

  if (formData.dueDate === null || Number.isNaN(Number(formData.dueDate))) {
    errors.dueDate = `Due date is required`;
  }

  if (formData.services.length === 0) {
    errors.services = [{ name: `At least one service is required` }];
  } else {
    errors.services = [];

    formData.services.forEach((service, index) => {
      errors.services![index] = {};

      if (!service.name.length) {
        errors.services![index] = { name: `Service name is required` };
      }

      if (service.price === null ||
        service.price === `` ||
        service.price === undefined) {
        errors.services![index] = {
          ...errors.services![index],
          price: `Service price can't be empty`,
        };
      } else if (Number.isNaN(parseNumberWithComma(service.price))) {
        errors.services![index] = {
          ...errors.services![index],
          price: `Service price must be a number`,
        };
      }

      if (!service.quantity || Number.isNaN(parseNumberWithComma(service.quantity.toString()))) {
        errors.services![index] = {
          ...errors.services![index],
          quantity: `Service quantity must be a number`,
        };
      }

      if (service.taxRate === null ||
        service.taxRate === `` ||
        service.taxRate === undefined) {
        errors.services![index] = {
          ...errors.services![index],
          taxRate: `Service tax rate can't be empty`,
        };
      } else if (Number.isNaN(parseNumberWithComma(service.quantity.toString()))) {
        errors.services![index] = {
          ...errors.services![index],
          taxRate: `Service tax rate must be a number`,
        };
      }
    });
  }

  errors = removeEmptyRecursivelyKeepArray(errors);

  return errors;
};

function removeEmptyRecursivelyKeepArray<T>(data: T): T | Record<string, never> {
  if (Array.isArray(data)) {
    let hasNonEmptyItem = false;

    for (let i = 0; i < data.length; i++) {
      data[i] = removeEmptyRecursivelyKeepArray(data[i]) as T;

      if (isEmpty(data[i])) {
        data[i] = {} as T;
      } else {
        hasNonEmptyItem = true;
      }
    }

    return hasNonEmptyItem ? data : {};
  } else if (typeof data === `object` && data !== null) {
    Object.keys(data).forEach((key) => {
      const value = (data as any)[key];
      (data as any)[key] = removeEmptyRecursivelyKeepArray(value);

      if (isEmpty((data as any)[key])) {
        delete (data as any)[key];
      }
    });

    return Object.keys(data).length > 0 ? data : {};
  }

  return data;
}

function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === `object`) {
    return Object.keys(value).length === 0;
  }
  return false;
}

export {
  validateInvoiceFormData,
};
