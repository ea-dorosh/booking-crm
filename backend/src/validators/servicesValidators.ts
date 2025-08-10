import { ServiceDataType, ServiceFormDataValidationErrors, SubCategoryDataType } from "@/@types/servicesTypes.js";

export interface SubCategoryValidationErrors {
  name?: string;
  categoryId?: string;
}

export interface CategoryValidationErrors {
  name?: string;
}

const validateServiceData = (service: ServiceDataType): ServiceFormDataValidationErrors => {
  const errors: ServiceFormDataValidationErrors = {};

  if (!service.name || service.name.length <= 3 ) {
    errors.name = `Service name must be at least 3 characters long`;
  }

  if (!service.categoryId || service.categoryId <= 0) {
    errors.categoryId = `Category is required`;
  }

  // subCategoryId is optional; if provided it must be a positive id
  if (service.subCategoryId !== null && service.subCategoryId !== undefined && service.subCategoryId <= 0) {
    errors.subCategoryId = `Invalid sub category`;
  }

  if (!service.durationTime || service.durationTime === `00:00:00`) {
    errors.durationTime = `Duration time is required`;
  }

    // Validate employee prices
  if (service.employeePrices && service.employeePrices.length > 0) {
    const invalidPrices = service.employeePrices.filter(emp =>
      emp.price === null || emp.price === undefined || emp.price < 0
    );

    if (invalidPrices.length > 0) {
      errors.employeePrices = `All selected employees must have a valid price (0 or greater)`;
    }
  }

  return errors;
};

const validateSubCategoryData = (subCategory: SubCategoryDataType): SubCategoryValidationErrors => {
  const errors: SubCategoryValidationErrors = {};

  if (!subCategory.name || subCategory.name.length <= 3) {
    errors.name = `Sub Category name must be at least 3 characters long`;
  }

  if (!subCategory.categoryId || subCategory.categoryId <= 0) {
    errors.categoryId = `Category is required`;
  }

  return errors;
};

const validateCategoryData = (name: string): CategoryValidationErrors => {
  const errors: CategoryValidationErrors = {};

  if (!name || name.length <= 3) {
    errors.name = `Category name must be at least 3 characters long`;
  }

  return errors;
};

export {
  validateServiceData,
  validateSubCategoryData,
  validateCategoryData,
}
