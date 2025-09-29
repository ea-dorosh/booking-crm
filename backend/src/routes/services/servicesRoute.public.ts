import express from 'express';
import { toKebabCase } from '@/utils/formatters.js';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { getEmployees } from '@/services/employees/employeesService.js';
import { getServiceCategories, getServiceSubCategories } from '@/services/service/serviceService.js';
import { RowDataPacket } from 'mysql2';
import { CategoryStatusEnum, EmployeeStatusEnum } from '@/enums/enums.js';

const router = express.Router();

router.get(`/`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  try {
    // get service categories (only active)
    const categoriesData = await getServiceCategories(req.dbPool, [CategoryStatusEnum.Active]);

    // get service sub categories (only active)
    const subCategoriesDataRaw = await getServiceSubCategories(req.dbPool, [CategoryStatusEnum.Active]);

    const subCategoriesData = subCategoriesDataRaw.map((subCategory) => ({
      id: subCategory.id,
      name: subCategory.name,
      image: subCategory.image,
    }));

    const employeesData = await getEmployees(req.dbPool, [EmployeeStatusEnum.Active]);

    // get all services and map with sub categories and employee prices
    // (only active services with active categories and active subcategories)
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
      INNER JOIN ServiceCategories sc ON s.category_id = sc.id AND sc.status = '${CategoryStatusEnum.Active}'
      LEFT JOIN ServiceSubCategories ssc ON s.sub_category_id = ssc.id
      WHERE s.status = '${CategoryStatusEnum.Active}'
        AND (s.sub_category_id IS NULL OR ssc.status = '${CategoryStatusEnum.Active}')
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
          categoryName: categoriesData.find(category => category.id === category_id)?.name || ``,
          subCategoryId: sub_category_id,
          durationTime: duration_time,
          bufferTime: buffer_time,
          bookingNote: booking_note,
          employees: [],
          subCategoryName: subCategoriesData.find(subCategory => subCategory.id === sub_category_id)?.name || ``,
          subCategoryImage: subCategoriesData.find(subCategory => subCategory.id === sub_category_id)?.image || null,
          subCategoryUrl: toKebabCase(subCategoriesData.find(subCategory => subCategory.id === sub_category_id)?.name || ``),
        });
      }
      // Push employee ID and price into the array
      if (employee_id) {
        servicesMap.get(id).employees.push({
          id: employee_id,
          price,
          firstName: employeesData.find(employee => employee.employeeId === employee_id)?.firstName || ``,
          lastName: employeesData.find(employee => employee.employeeId === employee_id)?.lastName || ``,
          image: employeesData.find(employee => employee.employeeId === employee_id)?.image || ``,
        });
      }
    });

    // Convert Map values to an array of services
    const services = Array.from(servicesMap.values());

    // Group services by category. If category has no subcategories at all (all services have null subCategoryId),
    // return services directly with a flag. Otherwise, group by subcategories and set the flag.
    const groupedData = categoriesData.map(category => {
      const categoryServices = services.filter(service => service.categoryId === category.id);

      const hasAnySubcategory = categoryServices.some(service => service.subCategoryId !== null);

      if (!hasAnySubcategory) {
        return {
          categoryId: category.id,
          categoryName: category.name,
          categoryImage: category.image,
          hasSubCategories: false,
          services: categoryServices,
          subCategories: [],
        };
      }

      // Group services by subcategory within this category
      const subCategoriesMap = new Map();

      categoryServices.forEach(service => {
        // Skip services without subcategory when category has subcategories
        if (service.subCategoryId === null) {
          return;
        }

        const subCategoryId = service.subCategoryId;

        if (!subCategoriesMap.has(subCategoryId)) {
          subCategoriesMap.set(subCategoryId, {
            subCategoryId,
            subCategoryName: service.subCategoryName,
            subCategoryImage: service.subCategoryImage,
            subCategoryUrl: service.subCategoryUrl,
            services: [],
          });
        }

        subCategoriesMap.get(subCategoryId).services.push(service);
      });

      return {
        categoryId: category.id,
        categoryName: category.name,
        categoryImage: category.image,
        hasSubCategories: true,
        subCategories: Array.from(subCategoriesMap.values()),
        services: [],
      };
    });

    // Filter out categories that have no services
    const filteredData = groupedData.filter(category =>
      category.hasSubCategories ? category.subCategories.length > 0 : category.services.length > 0,
    );

    res.json(filteredData);
  } catch (error) {
    console.error(`Database query error:`, error);
    res.status(500).json({ message: `Failed to query database` });
  }
});

export default router;
