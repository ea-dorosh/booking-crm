import { ResultSetHeader } from 'mysql2/promise';
import { validateCompanyData } from '@/validators/companyValidators.js';
import { formatPhone } from '@/utils/formatters.js';
import {
  CompanyResponseData,
  CompanyRequestRow,
  CreateCompanyResult,
  UpdateCompanyResult,
} from '@/@types/companyTypes.js';
import { DbPoolType } from '@/@types/expressTypes.js';
import { getAllCompanyBranches } from '@/services/companyBranches/companyBranchesService.js';

async function getCompany(dbPool: DbPoolType): Promise<CompanyResponseData> {
  const sql = `
    SELECT
      id,
      name,
      address_street,
      address_zip,
      address_city,
      address_country,
      phone,
      email,
      website,
      tax_number,
      bank_account
    FROM Company
  `;

  const [results] = await dbPool.query<CompanyRequestRow[]>(sql);

  const companyResponse = results.map((row) => ({
    id: row.id,
    name: row.name,
    addressStreet: row.address_street,
    addressZip: row.address_zip,
    addressCity: row.address_city,
    addressCountry: row.address_country,
    phone: row.phone,
    email: row.email,
    website: row.website,
    taxNumber: row.tax_number,
    bankAccount: row.bank_account,
    lastActivityDate: row.last_activity_date,
  }));

  if (companyResponse.length === 0) {
    throw new Error(`No company found`);
  }

  const branches = await getAllCompanyBranches(dbPool);

  return {
    ...companyResponse[0],
    branches,
  };
}

async function createCompany(dbPool: DbPoolType, companyData: CompanyResponseData): Promise<CreateCompanyResult> {
  const errors = validateCompanyData(companyData);

  if (Object.keys(errors).length > 0) {
    return {
      newCompanyId: null,
      validationErrors: errors,
    };
  }

  const companyQuery = `
    INSERT INTO Company (name, address_street, address_zip, address_city, address_country, phone, email, website, tax_number, bank_account)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const companyValues = [
    companyData.name,
    companyData.addressStreet,
    companyData.addressZip,
    companyData.addressCity,
    companyData.addressCountry,
    formatPhone(companyData.phone || ``),
    companyData.email,
    companyData.website,
    companyData.taxNumber,
    companyData.bankAccount,
  ];

  const [companyResults] = await dbPool.query<ResultSetHeader>(companyQuery, companyValues);

  return {
    newCompanyId: companyResults.insertId,
    validationErrors: null,
  };
}

async function updateCompanyData(dbPool: DbPoolType, companyData: CompanyResponseData, companyId: number): Promise<UpdateCompanyResult> {
  const errors = validateCompanyData(companyData);

  if (Object.keys(errors).length > 0) {
    return {
      updatedCompanyId: null,
      validationErrors: errors,
    };
  }

  const sql = `
    UPDATE Company
    SET name = ?, address_street = ?, address_zip = ?, address_city = ?, address_country = ?, phone = ?, email = ?, website = ?, tax_number = ?, bank_account = ?
    WHERE id = ?;
  `;

  const values = [
    companyData.name,
    companyData.addressStreet,
    companyData.addressZip,
    companyData.addressCity,
    companyData.addressCountry,
    formatPhone(companyData.phone || ``),
    companyData.email,
    companyData.website,
    companyData.taxNumber,
    companyData.bankAccount,
    companyId,
  ];

  await dbPool.query(sql, values);

  return {
    updatedCompanyId: companyId,
    validationErrors: null,
  };
}

export {
  getCompany,
  createCompany,
  updateCompanyData,
};