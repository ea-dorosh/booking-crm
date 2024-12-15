import express from 'express';
import { getServices } from '@/services/service/serviceService';
import { validateServiceData } from '@/validators/servicesValidators';
import { upload } from '@/utils/uploadFile';
import { 
  CustomRequestType, 
  CustomResponseType,
  DbPoolType,
} from '@/@types/expressTypes';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { EmployeePriceType, ServiceDataType } from '@/@types/servicesTypes';
import { CategoryRow } from '@/@types/categoriesTypes';

const router = express.Router();

router.get(`/`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  try {
    const services = await getServices(req.dbPool);

    res.json(services);

    return;
  } catch (error) {
    console.error(`Database query error:`, error);
    res.status(500).json({ message: `Failed to query database` });

    return;
  }
});

router.get(`/categories`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  const sql = `
    SELECT c.id, c.name, c.img
    FROM ServiceCategories c
  `;

  try {
    const [results] = await req.dbPool.query<CategoryRow[]>(sql);

    const data = results.map((row) => ({
      id: row.id,
      name: row.name,
      image: row.img ? `${process.env.SERVER_API_URL}/images/${row.img}` : null,
    }));

    res.json(data);

    return;
  } catch (error) {
    console.error(`Database query error:`, error);
    res.status(500).json({ message: `Failed to query database` });

    return;
  }
});

router.post(`/create-service`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  const service: ServiceDataType = req.body;

  // Validation
  const errors = validateServiceData(service);

  if (Object.keys(errors).length > 0) {
    res.status(428).json({ errors });

    return;
  }

  const serviceQuery = `
    INSERT INTO Services (
      employee_id, 
      name, 
      category_id, 
      duration_time, 
      buffer_time, 
      booking_note
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const employeeIds = service.employeePrices.map(employeePrice => {
    if (employeePrice.price) {
      return employeePrice.employeeId
    }
  }).join(`,`);

  const serviceValues = [
      employeeIds,
      service.name,
      service.categoryId,
      service.durationTime,
      service.bufferTime,
      service.bookingNote,
  ];

  let serviceId;

  try {
    const [serviceResults] = await req.dbPool.query<ResultSetHeader>(serviceQuery, serviceValues);
    serviceId = serviceResults.insertId;

    // set price to ServiceEmployeePrice table
    if (service.employeePrices.length) {
      for (const employeePrice of service.employeePrices) {
        console.log(employeePrice);
        await saveEmployeePriceForService(req.dbPool, employeePrice, serviceId);
      }
    }

    res.json({
      message: `Service data inserted successfully`,
      data: serviceId,
    });

    return;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as { code?: string; message?: string };

      if (mysqlError.code === `ER_DUP_ENTRY`) {
        res.status(428).json({ errors: { name: `Service with this name already exists` } });

        return;
      }
        
      res.status(500).json({
        errorMessage: `Error while creating service`,
        message: mysqlError.message,
      });

      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ 
        errorMessage: `Error while creating service`,
        message: error.message,
      });

      return;
    }

    res.status(500).json({ 
      errorMessage: `Unknown error occurred while creating service`,
    });

    return;
  }
});

router.put(`/edit/:id`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  const serviceId = Number(req.params.id);
  const service: ServiceDataType = req.body;

  // Validation
  const errors = validateServiceData(service);

  if (Object.keys(errors).length > 0) {
    res.status(428).json({ errors });

    return;
  }

  const updateServiceQuery = `
    UPDATE Services
    SET employee_id = ?, name = ?, category_id = ?, duration_time = ?, buffer_time = ?, booking_note = ?
    WHERE id = ?;
  `;

  const employeeIds = service.employeePrices.map(employeePrice => employeePrice.employeeId).join(`,`);

  const serviceValues = [
    employeeIds,
    service.name,
    service.categoryId,
    service.durationTime,
    service.bufferTime,
    service.bookingNote,
    serviceId,
  ];

  try {
    await req.dbPool.query(updateServiceQuery, serviceValues);

    // Delete existing prices for the service
    await deleteEmployeesPriceForService(req.dbPool, serviceId);

    // set price to ServiceEmployeePrice table
    if (service.employeePrices.length) {
      for (const employeePrice of service.employeePrices) {
        console.log(employeePrice);
        await saveEmployeePriceForService(req.dbPool, employeePrice, serviceId);
      }
    }

    res.json({
      message: `Service data updated successfully`,
      data: serviceId,
    });

    return;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as { code?: string; message?: string };

      if (mysqlError.code === `ER_DUP_ENTRY`) {
        res.status(428).json({ errors: { name: `Service with this name already exists` } });

        return;
      }
        
      res.status(500).json({
        errorMessage: `Error while creating service`,
        message: mysqlError.message,
      });

      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ 
        errorMessage: `Error while creating service`,
        message: error.message,
      });

      return;
    }

    res.status(500).json({ 
      errorMessage: `Unknown error occurred while creating service`,
    });

    return;
  }
});

router.put(`/category/edit/:id`, upload.single(`image`), async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  const categoryId = req.params.id;
  const { name } = req.body;
  
  const imgPath = req.file?.filename || null;

  const updateServiceCategoryQuery = `
    UPDATE ServiceCategories
    SET name = ?, img = COALESCE(?, img)
    WHERE id = ?;
  `;

  const categoryValues = [
    name,
    imgPath,
    categoryId,
  ];

  try {
    await req.dbPool.query(updateServiceCategoryQuery, categoryValues);

    res.json({
        message: `Category data updated successfully`,
        data: categoryId,
    });

    return;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as { code?: string; message?: string };

      if (mysqlError.code === `ER_DUP_ENTRY`) {
        res.status(428).json({ errors: { name: `Category with this name already exists` } });

        return;
      }
        
      res.status(500).json({
        errorMessage: `Error while editing Category`,
        message: mysqlError.message,
      });

      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ 
        errorMessage: `Error while editing Category`,
        message: error.message,
      });

      return;
    }

    res.status(500).json({ 
      errorMessage: `Unknown error occurred while editing Category`,
    });

    return;
  }
});


router.delete(`/:id`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  const serviceId = req.params.id;
  const deleteQuery = `DELETE FROM Services WHERE id = ?`;

  try {
    const [serviceResults] = await req.dbPool.query<ResultSetHeader>(deleteQuery, [serviceId]);

    if (serviceResults.affectedRows === 0) {
      res.status(404).json({ error: `Service not found` });

      return;
    } else {
      res.status(200).json({ message: `Service deleted successfully` });

      return;
    }
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error deleting service` });

    return;
  }
});

const deleteEmployeesPriceForService = async (db: DbPoolType, serviceId: number) => {
  try {
    const deleteQuery = `DELETE FROM ServiceEmployeePrice WHERE service_id = ?`;

    await db.query(deleteQuery, [serviceId]);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const saveEmployeePriceForService = async (db: DbPoolType, employeePrice: EmployeePriceType, serviceId: number) => {
  try {
    // Check if there's an existing record for the employee and service
    const checkQuery = `SELECT price FROM ServiceEmployeePrice WHERE employee_id = ? AND service_id = ?`;

    interface ServiceEmployeePriceRow extends RowDataPacket {
      price: number;
    }

    const [existingRows] = await db.query<ServiceEmployeePriceRow[]>(checkQuery, [employeePrice.employeeId, serviceId]);

    if (existingRows.length === 0 || existingRows[0].price !== employeePrice.price) {
      // If no existing record or price is different, insert a new one or update the price
      const query = existingRows.length === 0 ?
          `INSERT INTO ServiceEmployeePrice (employee_id, service_id, price) VALUES (?, ?, ?)` :
          `UPDATE ServiceEmployeePrice SET price = ? WHERE employee_id = ? AND service_id = ?`;

      const queryParams = existingRows.length === 0 ?
          [employeePrice.employeeId, serviceId, employeePrice.price] :
          [employeePrice.price, employeePrice.employeeId, serviceId];

      await db.execute(query, queryParams);
      console.log(existingRows.length === 0 ? `New record inserted successfully` : `Existing record updated successfully`);
    } else {
      console.log(`Price in database is already the same as the new service data. No need to update.`);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export default router;