import express from 'express';
import { toKebabCase } from '@/utils/formatters.js';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { CategoryRow } from '@/@types/categoriesTypes.js';
import { getEmployees } from '@/services/employees/employeesService.js';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

router.get(`/`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  try {
    // get service categories
    const categoriesSql = `
      SELECT c.id, c.name, c.img
      FROM ServiceCategories c
    `;

    const [categoriesResult] = await req.dbPool.query<CategoryRow[]>(categoriesSql);

    const categoriesData = categoriesResult.map((row) => ({
      id: row.id,
      name: row.name,
      image: row.img ? `${process.env.SERVER_API_URL}/images/${row.img}` : null,
    }));

    const employeesData = await getEmployees(req.dbPool);

    // get all services and map with categories and employee prices
    const sql = `
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

    const [results] = await req.dbPool.query<RowDataPacket[]>(sql);
    const servicesMap = new Map(); // Using Map to group results by service ID

    // Process results
    results.forEach(row => {
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
        servicesMap.set(id, {
          id,
          name,
          categoryId: category_id,
          durationTime: duration_time,
          bufferTime: buffer_time,
          bookingNote: booking_note,
          employees: [],
          categoryName: categoriesData.find(category => category.id === category_id)?.name || '',
          categoryImage: categoriesData.find(category => category.id === category_id)?.image || null,
          categoryUrl: toKebabCase(categoriesData.find(category => category.id === category_id)?.name || ''),
        });
      }
      // Push employee ID and price into the array
      if (employee_id) {
        servicesMap.get(id).employees.push({
          id: employee_id,
          price,
          firstName: employeesData.find(employee => employee.employeeId === employee_id)?.firstName || '',
          lastName: employeesData.find(employee => employee.employeeId === employee_id)?.lastName || '',
          email: employeesData.find(employee => employee.employeeId === employee_id)?.email || '',
          phone: employeesData.find(employee => employee.employeeId === employee_id)?.phone || '',
          image: employeesData.find(employee => employee.employeeId === employee_id)?.image || '',
         });
      }
    });

    // Convert Map values to an array of services
    const data = Array.from(servicesMap.values());
    res.json(data);
  } catch (error) {
    console.error(`Database query error:`, error);
    res.status(500).json({ message: `Failed to query database` });
  }
});

export default router;