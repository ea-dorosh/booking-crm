import { RowDataPacket } from 'mysql2';

export interface CompanyBranchRequestRow extends RowDataPacket {
  id: number;
  name: string;
  address_street: string | null;
  address_zip: string | null;
  address_city: string | null;
  address_country: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CompanyBranchResponseData {
  id?: number;
  name: string;
  addressStreet: string | null;
  addressZip: string | null;
  addressCity: string | null;
  addressCountry: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
}

export interface CompanyBranchFormDataValidationErrors {
  name?: string;
  addressStreet?: string;
  addressZip?: string;
  addressCity?: string;
  addressCountry?: string;
  phone?: string;
  email?: string;
  isActive?: string;
}

export interface CreateCompanyBranchResult {
  newBranchId: number | null;
  validationErrors: CompanyBranchFormDataValidationErrors | null;
}

export interface UpdateCompanyBranchResult {
  updatedBranchId: number | null;
  validationErrors: CompanyBranchFormDataValidationErrors | null;
}
