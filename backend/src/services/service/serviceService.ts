import { Pool } from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';
import { ServiceDetailsDataType } from '@/@types/servicesTypes';

interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  img: string | null;
}

interface ServiceRow extends RowDataPacket {
  id: number;
  name: string;
  category_id: number;
  duration_time: string;
  buffer_time: string;
  booking_note: string | null;
  employee_id: number | null;
  price: number | null;
}

interface CategoryData {
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
  categoryId: number;
  categoryName: string;
  durationTime: string;
  bufferTime: string;
  bookingNote: string | null;
  employeePrices: EmployeePrice[];
}

async function getServices(dbPool: Pool): Promise<ServiceData[]> {
  const categoriesSql = `
    SELECT c.id, c.name, c.img
    FROM ServiceCategories c
  `;

  const [categoriesResult] = await dbPool.query<CategoryRow[]>(categoriesSql);

  const categoriesData: CategoryData[] = categoriesResult.map((row) => ({
    id: row.id,
    name: row.name,
    image: row.img ? `${process.env.SERVER_API_URL}images/${row.img}` : null,
  }));

  const servicesQuery = `
    SELECT 
      s.id, 
      s.name, 
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
      category_id, 
      duration_time, 
      buffer_time,
      booking_note,
      employee_id,
      price,
    } = row;

    if (!servicesMap.has(id)) {
      const category = categoriesData.find(category => category.id === category_id);

      servicesMap.set(id, {
        id,
        name,
        categoryId: category_id,
        categoryName: category ? category.name : '',
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
    categoryId: row.category_id,
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
