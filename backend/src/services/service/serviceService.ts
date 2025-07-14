import { Pool } from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';
import { ServiceDetailsDataType } from '@/@types/servicesTypes.js';
import { Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';

interface SubCategoryRow extends RowDataPacket {
  id: number;
  name: string;
  img: string | null;
}

interface ServiceRow extends RowDataPacket {
  id: number;
  name: string;
  sub_category_id: number;
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
}

interface EmployeePrice {
  employeeId: number;
  price: number | null;
}

interface ServiceData {
  id: number;
  name: string;
  subCategoryId: number;
  subCategoryName: string;
  durationTime: string;
  bufferTime: string;
  bookingNote: string | null;
  employeePrices: EmployeePrice[];
}

async function getServices(dbPool: Pool): Promise<ServiceData[]> {
  const subCategoriesSql = `
    SELECT c.id, c.name, c.img
    FROM ServiceSubCategories c
  `;

  const [subCategoriesResult] = await dbPool.query<SubCategoryRow[]>(subCategoriesSql);

  const subCategoriesData: SubCategoryData[] = subCategoriesResult.map((row) => ({
    id: row.id,
    name: row.name,
    image: row.img ? `${process.env.SERVER_API_URL}images/${row.img}` : null,
  }));

  const servicesQuery = `
    SELECT
      s.id,
      s.name,
      s.sub_category_id,
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

export {
  getServices,
  getService,
};
