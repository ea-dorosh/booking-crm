import { ResultSetHeader } from 'mysql2/promise';
import { formatPhone } from '@/utils/formatters.js';
import {
  CompanyBranchResponseData,
  CompanyBranchRequestRow,
  CreateCompanyBranchResult,
  UpdateCompanyBranchResult,
} from '@/@types/companyBranchesTypes.js';
import { DbPoolType } from '@/@types/expressTypes.js';
import { validateCompanyBranchData } from '@/validators/companyBranchesValidators.js';

async function getAllCompanyBranches(dbPool: DbPoolType): Promise<CompanyBranchResponseData[]> {
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
      is_active,
      created_at,
      updated_at
    FROM CompanyBranches
    ORDER BY name ASC
  `;
  const [results] = await dbPool.query<CompanyBranchRequestRow[]>(sql);
  return results.map((row) => ({
    id: row.id,
    name: row.name,
    addressStreet: row.address_street,
    addressZip: row.address_zip,
    addressCity: row.address_city,
    addressCountry: row.address_country,
    phone: row.phone,
    email: row.email,
    isActive: row.is_active,
  }));
}

async function createCompanyBranch(dbPool: DbPoolType, branchData: CompanyBranchResponseData): Promise<CreateCompanyBranchResult> {
  const errors = validateCompanyBranchData(branchData);
  if (Object.keys(errors).length > 0) {
    return {
      newBranchId: null,
      validationErrors: errors,
    };
  }
  const sql = `
    INSERT INTO CompanyBranches (name, address_street, address_zip, address_city, address_country, phone, email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    branchData.name,
    branchData.addressStreet,
    branchData.addressZip,
    branchData.addressCity,
    branchData.addressCountry,
    formatPhone(branchData.phone || ``),
    branchData.email,
  ];
  const [result] = await dbPool.query<ResultSetHeader>(sql, values);
  return {
    newBranchId: result.insertId, validationErrors: null, 
  };
}

async function updateCompanyBranch(dbPool: DbPoolType, branchId: number, branchData: CompanyBranchResponseData): Promise<UpdateCompanyBranchResult> {
  const errors = validateCompanyBranchData(branchData);
  if (Object.keys(errors).length > 0) {
    return {
      updatedBranchId: null,
      validationErrors: errors,
    };
  }
  const sql = `
    UPDATE CompanyBranches
    SET name = ?, address_street = ?, address_zip = ?, address_city = ?, address_country = ?, phone = ?, email = ?, updated_at = NOW()
    WHERE id = ?
  `;
  const values = [
    branchData.name,
    branchData.addressStreet,
    branchData.addressZip,
    branchData.addressCity,
    branchData.addressCountry,
    formatPhone(branchData.phone || ``),
    branchData.email,
    branchId,
  ];
  await dbPool.query(sql, values);
  return {
    updatedBranchId: branchId, validationErrors: null, 
  };
}

async function getCompanyBranchById(dbPool: DbPoolType, branchId: number): Promise<CompanyBranchResponseData> {
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
      is_active,
      created_at,
      updated_at
    FROM CompanyBranches
    WHERE id = ?
  `;
  const [results] = await dbPool.query<CompanyBranchRequestRow[]>(sql, [branchId]);

  if (results.length === 0) {
    throw new Error(`Company branch with ID ${branchId} not found`);
  }

  const row = results[0];
  return {
    id: row.id,
    name: row.name,
    addressStreet: row.address_street,
    addressZip: row.address_zip,
    addressCity: row.address_city,
    addressCountry: row.address_country,
    phone: row.phone,
    email: row.email,
    isActive: row.is_active,
  };
}

export {
  getAllCompanyBranches,
  getCompanyBranchById,
  createCompanyBranch,
  updateCompanyBranch,
};