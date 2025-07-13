import { CompanyBranchResponseData, CompanyBranchFormDataValidationErrors } from '@/@types/companyBranchesTypes.js';
import { validateEmail, validatePhone } from '@/utils/validators.js';

export function validateCompanyBranchData(branchData: CompanyBranchResponseData): CompanyBranchFormDataValidationErrors {
  const errors: CompanyBranchFormDataValidationErrors = {};

  if (!branchData.name || branchData.name.trim().length === 0) {
    errors.name = `name required`;
  } else if (branchData.name.length > 255) {
    errors.name = `name too long`;
  }
  if (branchData.addressStreet && branchData.addressStreet.length > 255) {
    errors.addressStreet = `addressStreet too long`;
  }
  if (branchData.addressZip && branchData.addressZip.length > 20) {
    errors.addressZip = `addressZip too long`;
  }
  if (branchData.addressCity && branchData.addressCity.length > 255) {
    errors.addressCity = `addressCity too long`;
  }
  if (branchData.addressCountry && branchData.addressCountry.length > 255) {
    errors.addressCountry = `addressCountry too long`;
  }
  if (branchData.phone && !validatePhone(branchData.phone)) {
    errors.phone = `Phone is invalid`;
  }
  if (branchData.email && !validateEmail(branchData.email)) {
    errors.email = `invalid email`;
  }

  return errors;
}