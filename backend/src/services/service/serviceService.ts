import { Pool } from 'mysql2/promise';
import {
  RowDataPacket,
  ResultSetHeader,
} from 'mysql2';
import {
  ServiceDetailsDataType,
  ServiceDataType,
  ServiceFormDataValidationErrors,
  EmployeePriceType,
  SubCategoryDataType,
} from '@/@types/servicesTypes.js';
import { Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';
import {
  validateServiceData,
  validateSubCategoryData,
  validateCategoryData,
  SubCategoryValidationErrors,
  CategoryValidationErrors
} from '@/validators/servicesValidators.js';
import { CategoryStatusEnum } from '@/enums/enums.js';

interface SubCategoryRow extends RowDataPacket {
  id: number;
  name: string;
  img: string | null;
  status?: string;
  category_id: number | null;
}

interface ServiceRow extends RowDataPacket {
  id: number;
  name: string;
  sub_category_id: number | null;
  category_id: number | null;
  duration_time: Time_HH_MM_SS_Type;
  buffer_time: Time_HH_MM_SS_Type;
  booking_note: string | null;
  employee_id: number | null;
  price: number | null;
}

interface SubCategoryData {
  id: number;
  name: string;
  image: string | null;
  status?: string;
  categoryId: number | null;
}

interface EmployeePrice {
  employeeId: number;
  price: number | null;
}

interface ServiceData {
  id: number;
  name: string;
  categoryId: number | null;
  subCategoryId: number | null;
  subCategoryName: string;
  durationTime: string;
  bufferTime: string;
  bookingNote: string | null;
  employeePrices: EmployeePrice[];
}

interface CreateServiceResult {
  serviceId: number | null;
  validationErrors: ServiceFormDataValidationErrors | null;
}

interface UpdateServiceResult {
  serviceId: number | null;
  validationErrors: ServiceFormDataValidationErrors | null;
}

interface CreateSubCategoryResult {
  subCategoryId: number | null;
  validationErrors: SubCategoryValidationErrors | null;
}

interface UpdateSubCategoryResult {
  subCategoryId: number | null;
  validationErrors: SubCategoryValidationErrors | null;
}

interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  img: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface CategoryData {
  id: number;
  name: string;
  image: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateCategoryResult {
  categoryId: number | null;
  validationErrors: CategoryValidationErrors | null;
}

interface UpdateCategoryResult {
  categoryId: number | null;
  validationErrors: CategoryValidationErrors | null;
}

async function getServices(dbPool: Pool): Promise<ServiceData[]> {
  const subCategoriesData = await getServiceSubCategories(dbPool);

  const servicesQuery = `
    SELECT
      s.id,
      s.name,
      s.sub_category_id,
      s.category_id,
      s.duration_time,
      s.buffer_time,
      s.booking_note,
      sep.employee_id,
      sep.price
    FROM Services s
    LEFT JOIN ServiceEmployeePrice sep ON s.id = sep.service_id
  `;

  const [servicesResults] = await dbPool.query<ServiceRow[]>(servicesQuery);

  const servicesMap = new Map<number, ServiceData>();

  for (const row of servicesResults) {
    const {
      id,
      name,
      sub_category_id,
      category_id,
      duration_time,
      buffer_time,
      booking_note,
      employee_id,
      price,
    } = row;

    if (!servicesMap.has(id)) {
      const subCategory = subCategoriesData.find(subCategory => subCategory.id === sub_category_id);

      servicesMap.set(id, {
        id,
        name,
        categoryId: category_id,
        subCategoryId: sub_category_id,
        subCategoryName: subCategory ? subCategory.name : '',
        durationTime: duration_time,
        bufferTime: buffer_time,
        bookingNote: booking_note,
        employeePrices: [],
      });
    }

    if (employee_id !== null) {
      const service = servicesMap.get(id);
      if (service) {
        service.employeePrices.push({ employeeId: employee_id, price });
      }
    }
  }

  const services = Array.from(servicesMap.values());

  return services;
}



async function getService(dbPool: Pool, serviceId: number): Promise<ServiceDetailsDataType> {
  const serviceQuery = `
    SELECT *
    FROM Services
    WHERE id = ?
  `;

  const [serviceRows] = await dbPool.query<ServiceRow[]>(serviceQuery, [serviceId]);

  const serviceData: ServiceDetailsDataType[] = serviceRows.map((row) => ({
    id: row.id,
    name: row.name,
    subCategoryId: row.sub_category_id,
    employeeIds: [],
    durationTime: row.duration_time,
    bufferTime: row.buffer_time,
    bookingNote: row.booking_note,
  }));

  return serviceData[0];
}

async function getServiceSubCategories(dbPool: Pool, statuses?: string[]): Promise<SubCategoryData[]> {
  const allowedStatuses = new Set<string>([
    CategoryStatusEnum.Active,
    CategoryStatusEnum.Archived,
    CategoryStatusEnum.Disabled,
  ]);
  const filterStatuses = (Array.isArray(statuses) && statuses.length > 0 ? statuses : [CategoryStatusEnum.Active])
    .map(s => String(s).toLowerCase())
    .filter(s => allowedStatuses.has(s));

  const finalStatuses = filterStatuses.length > 0 ? filterStatuses : [CategoryStatusEnum.Active];

  const subCategoriesSql = `
    SELECT c.id, c.name, c.img, c.status, c.category_id
    FROM ServiceSubCategories c
    WHERE c.status IN (?)
  `;

  const [subCategoriesResult] = await dbPool.query<SubCategoryRow[]>(subCategoriesSql, [finalStatuses]);

  const subCategoriesData: SubCategoryData[] = subCategoriesResult.map((row) => ({
    id: row.id,
    name: row.name,
    image: row.img ? `${process.env.SERVER_API_URL}/images/${row.img}` : null,
    status: row.status,
    categoryId: row.category_id,
  }));

  return subCategoriesData;
}

async function getServiceCategories(dbPool: Pool, statuses?: string[]): Promise<CategoryData[]> {
  const allowedStatuses = new Set<string>([
    CategoryStatusEnum.Active,
    CategoryStatusEnum.Archived,
    CategoryStatusEnum.Disabled,
  ]);
  const filterStatuses = (Array.isArray(statuses) && statuses.length > 0 ? statuses : [`active`])
    .map(s => String(s).toLowerCase())
    .filter(s => allowedStatuses.has(s));

  // Fallback to 'active' if after filtering we have none
  const finalStatuses = filterStatuses.length > 0 ? filterStatuses : [`active`];

  const categoriesSql = `
    SELECT c.id, c.name, c.img, c.status, c.created_at, c.updated_at
    FROM ServiceCategories c
    WHERE c.status IN (?)
    ORDER BY c.name
  `;

  const [categoriesResult] = await dbPool.query<CategoryRow[]>(categoriesSql, [finalStatuses]);

  const categoriesData: CategoryData[] = categoriesResult.map((row) => ({
    id: row.id,
    name: row.name,
    image: row.img ? `${process.env.SERVER_API_URL}/images/${row.img}` : null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return categoriesData;
}

const deleteEmployeesPriceForService = async (dbPool: Pool, serviceId: number) => {
  try {
    const deleteQuery = `DELETE FROM ServiceEmployeePrice WHERE service_id = ?`;
    await dbPool.query(deleteQuery, [serviceId]);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const saveEmployeePriceForService = async (dbPool: Pool, employeePrice: EmployeePriceType, serviceId: number) => {
  try {
    // Skip saving if price is null, undefined, or negative
    if (employeePrice.price === null || employeePrice.price === undefined || employeePrice.price < 0) {
      console.log(`Skipping employee ${employeePrice.employeeId} - invalid price: ${employeePrice.price}`);
      return;
    }

    // Check if there's an existing record for the employee and service
    const checkQuery = `SELECT price FROM ServiceEmployeePrice WHERE employee_id = ? AND service_id = ?`;

    interface ServiceEmployeePriceRow extends RowDataPacket {
      price: number;
    }

    const [existingRows] = await dbPool.query<ServiceEmployeePriceRow[]>(checkQuery, [employeePrice.employeeId, serviceId]);

    if (existingRows.length === 0 || existingRows[0].price !== employeePrice.price) {
      // If no existing record or price is different, insert a new one or update the price
      const query = existingRows.length === 0 ?
          `INSERT INTO ServiceEmployeePrice (employee_id, service_id, price) VALUES (?, ?, ?)` :
          `UPDATE ServiceEmployeePrice SET price = ? WHERE employee_id = ? AND service_id = ?`;

      const queryParams = existingRows.length === 0 ?
          [employeePrice.employeeId, serviceId, employeePrice.price] :
          [employeePrice.price, employeePrice.employeeId, serviceId];

      await dbPool.execute(query, queryParams);
      console.log(existingRows.length === 0 ? `New record inserted successfully` : `Existing record updated successfully`);
    } else {
      console.log(`Price in database is already the same as the new service data. No need to update.`);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

async function createService(dbPool: Pool, service: ServiceDataType): Promise<CreateServiceResult> {
  // Validation
  const errors = validateServiceData(service);

  if (Object.keys(errors).length > 0) {
    return {
      serviceId: null,
      validationErrors: errors,
    };
  }

  const serviceQuery = `
    INSERT INTO Services (
      employee_id,
      name,
      sub_category_id,
      category_id,
      duration_time,
      buffer_time,
      booking_note
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const employeeIds = service.employeePrices.map(employeePrice => {
    if (employeePrice.price) {
      return employeePrice.employeeId
    }
  }).join(`,`);

  const serviceValues = [
      employeeIds,
      service.name,
      service.subCategoryId,
      service.categoryId || null,
      service.durationTime,
      service.bufferTime,
      service.bookingNote,
  ];

  try {
    const [serviceResults] = await dbPool.query<ResultSetHeader>(serviceQuery, serviceValues);
    const serviceId = serviceResults.insertId;

    // set price to ServiceEmployeePrice table
    if (service.employeePrices.length) {
      for (const employeePrice of service.employeePrices) {
        console.log(employeePrice);
        await saveEmployeePriceForService(dbPool, employeePrice, serviceId);
      }
    }

    return {
      serviceId,
      validationErrors: null,
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as { code?: string; message?: string };

      if (mysqlError.code === `ER_DUP_ENTRY`) {
        return {
          serviceId: null,
          validationErrors: { name: `Service with this name already exists` },
        };
      }

      throw new Error(`Error while creating service: ${mysqlError.message}`);
    }

    throw error;
  }
}

async function updateService(dbPool: Pool, serviceId: number, service: ServiceDataType): Promise<UpdateServiceResult> {
  // Validation
  const errors = validateServiceData(service);

  if (Object.keys(errors).length > 0) {
    return {
      serviceId: null,
      validationErrors: errors,
    };
  }

  const updateServiceQuery = `
    UPDATE Services
    SET employee_id = ?, name = ?, sub_category_id = ?, category_id = ?, duration_time = ?, buffer_time = ?, booking_note = ?
    WHERE id = ?;
  `;

  const employeeIds = service.employeePrices.map(employeePrice => employeePrice.employeeId).join(`,`);

  const serviceValues = [
    employeeIds,
    service.name,
    service.subCategoryId,
    service.categoryId || null,
    service.durationTime,
    service.bufferTime,
    service.bookingNote,
    serviceId,
  ];

  try {
    await dbPool.query(updateServiceQuery, serviceValues);

    // Delete existing prices for the service
    await deleteEmployeesPriceForService(dbPool, serviceId);

    // set price to ServiceEmployeePrice table
    if (service.employeePrices.length) {
      for (const employeePrice of service.employeePrices) {
        console.log(employeePrice);
        await saveEmployeePriceForService(dbPool, employeePrice, serviceId);
      }
    }

    return {
      serviceId,
      validationErrors: null,
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as { code?: string; message?: string };

      if (mysqlError.code === `ER_DUP_ENTRY`) {
        return {
          serviceId: null,
          validationErrors: { name: `Service with this name already exists` },
        };
      }

      throw new Error(`Error while updating service: ${mysqlError.message}`);
    }

    throw error;
  }
}

async function createServiceSubCategory(dbPool: Pool, subCategory: SubCategoryDataType, imgPath: string | null): Promise<CreateSubCategoryResult> {
  // Validation
  const errors = validateSubCategoryData(subCategory);

  if (Object.keys(errors).length > 0) {
    return {
      subCategoryId: null,
      validationErrors: errors,
    };
  }

  const subCategoryQuery = `
    INSERT INTO ServiceSubCategories (
      name,
      img,
      category_id
    )
    VALUES (?, ?, ?)
  `;

  const subCategoryValues = [
    subCategory.name,
    imgPath,
    subCategory.categoryId || null,
  ];

  try {
    const [results] = await dbPool.query<ResultSetHeader>(subCategoryQuery, subCategoryValues);
    const subCategoryId = results.insertId;

    return {
      subCategoryId,
      validationErrors: null,
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as { code?: string; message?: string };

      if (mysqlError.code === `ER_DUP_ENTRY`) {
        return {
          subCategoryId: null,
          validationErrors: { name: `Sub Category with this name already exists` },
        };
      }

      throw new Error(`Error while creating sub category: ${mysqlError.message}`);
    }

    throw error;
  }
}

async function updateServiceSubCategory(dbPool: Pool, subCategoryId: number, subCategory: SubCategoryDataType, imgPath: string | null): Promise<UpdateSubCategoryResult> {
  // Validation
  const errors = validateSubCategoryData(subCategory);

  if (Object.keys(errors).length > 0) {
    return {
      subCategoryId: null,
      validationErrors: errors,
    };
  }

  const updateServiceSubCategoryQuery = `
    UPDATE ServiceSubCategories
    SET name = ?, img = COALESCE(?, img), category_id = ?
    WHERE id = ?;
  `;

  const subCategoryValues = [
    subCategory.name,
    imgPath,
    subCategory.categoryId || null,
    subCategoryId,
  ];

  try {
    await dbPool.query(updateServiceSubCategoryQuery, subCategoryValues);

    return {
      subCategoryId,
      validationErrors: null,
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as { code?: string; message?: string };

      if (mysqlError.code === `ER_DUP_ENTRY`) {
        return {
          subCategoryId: null,
          validationErrors: { name: `Sub Category with this name already exists` },
        };
      }

      throw new Error(`Error while updating sub category: ${mysqlError.message}`);
    }

    throw error;
  }
}

async function updateServiceSubCategoryStatus(dbPool: Pool, subCategoryId: number, status: string): Promise<UpdateSubCategoryResult> {
  const allowedStatuses = new Set<string>([
    CategoryStatusEnum.Active,
    CategoryStatusEnum.Archived,
    CategoryStatusEnum.Disabled,
  ]);

  if (!allowedStatuses.has(String(status).toLowerCase())) {
    return {
      subCategoryId: null,
      // Casting to keep shape similar; consumers only check existence
      validationErrors: { status: 'Invalid status value' } as unknown as SubCategoryValidationErrors,
    };
  }

  const updateStatusQuery = `
    UPDATE ServiceSubCategories
    SET status = ?
    WHERE id = ?;
  `;

  await dbPool.query(updateStatusQuery, [status, subCategoryId]);

  return {
    subCategoryId,
    validationErrors: null,
  };
}

async function createServiceCategory(dbPool: Pool, name: string, imgPath: string | null): Promise<CreateCategoryResult> {
  // Validation
  const errors = validateCategoryData(name);

  if (Object.keys(errors).length > 0) {
    return {
      categoryId: null,
      validationErrors: errors,
    };
  }

  const categoryQuery = `
    INSERT INTO ServiceCategories (
      name,
      img,
      status
    )
    VALUES (?, ?, 'active')
  `;

  const categoryValues = [name, imgPath];

  try {
    const [results] = await dbPool.query<ResultSetHeader>(categoryQuery, categoryValues);
    const categoryId = results.insertId;

    return {
      categoryId,
      validationErrors: null,
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as { code?: string; message?: string };

      if (mysqlError.code === `ER_DUP_ENTRY`) {
        return {
          categoryId: null,
          validationErrors: { name: `Category with this name already exists` },
        };
      }

      throw new Error(`Error while creating category: ${mysqlError.message}`);
    }

    throw error;
  }
}

async function updateServiceCategory(dbPool: Pool, categoryId: number, name: string, imgPath: string | null): Promise<UpdateCategoryResult> {
  // Validation
  const errors = validateCategoryData(name);

  if (Object.keys(errors).length > 0) {
    return {
      categoryId: null,
      validationErrors: errors,
    };
  }

  const updateCategoryQuery = `
    UPDATE ServiceCategories
    SET name = ?, img = COALESCE(?, img)
    WHERE id = ?;
  `;

  const categoryValues = [name, imgPath, categoryId];

  try {
    await dbPool.query(updateCategoryQuery, categoryValues);

    return {
      categoryId,
      validationErrors: null,
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as { code?: string; message?: string };

      if (mysqlError.code === `ER_DUP_ENTRY`) {
        return {
          categoryId: null,
          validationErrors: { name: `Category with this name already exists` },
        };
      }

      throw new Error(`Error while updating category: ${mysqlError.message}`);
    }

    throw error;
  }
}

async function updateServiceCategoryStatus(dbPool: Pool, categoryId: number, status: string): Promise<UpdateCategoryResult> {
  // basic validation for status
  const allowedStatuses = new Set<string>([
    CategoryStatusEnum.Active,
    CategoryStatusEnum.Archived,
    CategoryStatusEnum.Disabled,
  ]);
  if (!allowedStatuses.has(status)) {
    return {
      categoryId: null,
      validationErrors: { status: `Invalid status value` } as unknown as CategoryValidationErrors,
    };
  }

  const updateStatusQuery = `
    UPDATE ServiceCategories
    SET status = ?
    WHERE id = ?;
  `;

  try {
    await dbPool.query(updateStatusQuery, [status, categoryId]);

    return {
      categoryId,
      validationErrors: null,
    };
  } catch (error) {
    throw error;
  }
}

export {
  createService,
  createServiceCategory,
  createServiceSubCategory,
  getService,
  getServiceCategories,
  getServices,
  getServiceSubCategories,
  updateService,
  updateServiceCategory,
  updateServiceCategoryStatus,
  updateServiceSubCategory,
  updateServiceSubCategoryStatus,
};
