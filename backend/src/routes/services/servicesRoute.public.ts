import express from 'express';
import { toKebabCase } from '@/utils/formatters.js';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { SubCategoryRow } from '@/@types/categoriesTypes.js';
import { getEmployees } from '@/services/employees/employeesService.js';
import { getServiceCategories } from '@/services/service/serviceService.js';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

router.get(`/`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  try {
    // get service categories
    const categoriesData = await getServiceCategories(req.dbPool);

    // get service sub categories
    const subCategoriesSql = `
      SELECT c.id, c.name, c.img
      FROM ServiceSubCategories c
    `;

    const [subCategoriesResult] = await req.dbPool.query<SubCategoryRow[]>(subCategoriesSql);

    const subCategoriesData = subCategoriesResult.map((row) => ({
      id: row.id,
      name: row.name,
      image: row.img ? `${process.env.SERVER_API_URL}/images/${row.img}` : null,
    }));

    const employeesData = await getEmployees(req.dbPool);

    // get all services and map with sub categories and employee prices
    const sql = `
      SELECT
        s.id,
        s.name,
        s.category_id,
        s.sub_category_id,
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
        sub_category_id,
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
          subCategoryId: sub_category_id,
          durationTime: duration_time,
          bufferTime: buffer_time,
          bookingNote: booking_note,
          employees: [],
          subCategoryName: subCategoriesData.find(subCategory => subCategory.id === sub_category_id)?.name || '',
          subCategoryImage: subCategoriesData.find(subCategory => subCategory.id === sub_category_id)?.image || null,
          subCategoryUrl: toKebabCase(subCategoriesData.find(subCategory => subCategory.id === sub_category_id)?.name || ''),
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
    const services = Array.from(servicesMap.values());

    // Group services by category and subcategory
    const groupedData = categoriesData.map(category => {
      const categoryServices = services.filter(service => service.categoryId === category.id);

      // Group services by subcategory within this category
      const subCategoriesMap = new Map();

      categoryServices.forEach(service => {
        const subCategoryId = service.subCategoryId;

        if (!subCategoriesMap.has(subCategoryId)) {
          subCategoriesMap.set(subCategoryId, {
            subCategoryId,
            subCategoryName: service.subCategoryName,
            subCategoryImage: service.subCategoryImage,
            subCategoryUrl: service.subCategoryUrl,
            services: []
          });
        }

        subCategoriesMap.get(subCategoryId).services.push(service);
      });

      return {
        categoryId: category.id,
        categoryName: category.name,
        categoryImage: category.image,
        subCategories: Array.from(subCategoriesMap.values())
      };
    });

    // Filter out categories that have no services
    const filteredData = groupedData.filter(category => category.subCategories.length > 0);
    console.log(`filteredData: `, JSON.stringify(filteredData, null, 4));
    res.json(filteredData);
  } catch (error) {
    console.error(`Database query error:`, error);
    res.status(500).json({ message: `Failed to query database` });
  }
});

export default router;