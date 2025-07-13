import { RowDataPacket } from 'mysql2';
import { CompanyBranchResponseData } from '@/@types/companyBranchesTypes.js';

export interface CompanyRequestRow extends RowDataPacket {
  id: number;
  name: string;
  address_street: string;
  address_zip: string;
  address_city: string;
  address_country: string;
  phone: string;
  email: string;
  website: string;
  tax_number: string;
  bank_account: string;
}

export interface CompanyResponseData {
  id?: number;
  name: string | null;
  addressStreet: string | null;
  addressZip: string | null;
  addressCity: string | null;
  addressCountry: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxNumber: string | null;
  bankAccount: string | null;
  branches: CompanyBranchResponseData[];
}

export interface CompanyFormDataValidationErrors {
  name?: string;
  addressStreet?: string;
  addressZip?: string;
  addressCity?: string;
  addressCountry?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxNumber?: string;
  bankAccount?: string;
}

export interface CreateCompanyResult {
  newCompanyId: number | null;
  validationErrors: CompanyFormDataValidationErrors | null;
}

export interface UpdateCompanyResult {
  updatedCompanyId: number | null;
  validationErrors: CompanyFormDataValidationErrors | null;
}