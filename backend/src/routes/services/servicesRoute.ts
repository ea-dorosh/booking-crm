import express from 'express';
import {
  createService,
  createServiceSubCategory,
  getServices,
  getServiceSubCategories,
  getServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  updateServiceCategoryStatus,
  updateService,
  updateServiceSubCategory,
} from '@/services/service/serviceService.js';
import { upload } from '@/utils/uploadFile.js';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { ResultSetHeader } from 'mysql2';
import {
  ServiceDataType,
  SubCategoryDataType,
} from '@/@types/servicesTypes.js';

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

router.get(`/sub-categories`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  try {
    const subCategories = await getServiceSubCategories(req.dbPool);

    res.json(subCategories);

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

  try {
    // support query param status=active&status=archived etc or status=active,archived
    let statuses: string[] | undefined = undefined;
    const { status } = req.query as { status?: string | string[] };
    if (Array.isArray(status)) {
      statuses = status.flatMap(s => s.split(',')).map(s => s.trim());
    } else if (typeof status === 'string') {
      statuses = status.split(',').map(s => s.trim());
    }

    const categories = await getServiceCategories(req.dbPool, statuses);

    res.json(categories);

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

  try {
    const { serviceId, validationErrors } = await createService(req.dbPool, service);

    if (validationErrors) {
      res.status(428).json({ errors: validationErrors });

      return;
    }

    if (serviceId) {
      res.json({
        message: `Service data inserted successfully`,
        data: serviceId,
      });

      return;
    }
  } catch (error: unknown) {
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

  try {
    const { serviceId: updatedServiceId, validationErrors } = await updateService(req.dbPool, serviceId, service);

    if (validationErrors) {
      res.status(428).json({ errors: validationErrors });

      return;
    }

    if (updatedServiceId) {
      res.json({
        message: `Service data updated successfully`,
        data: updatedServiceId,
      });

      return;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        errorMessage: `Error while updating service`,
        message: error.message,
      });

      return;
    }

    res.status(500).json({
      errorMessage: `Unknown error occurred while updating service`,
    });

    return;
  }
});

router.post(`/sub-category/create`, upload.single(`image`), async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  const subCategory: SubCategoryDataType = req.body;
  const imgPath = req.file?.filename || null;

  try {
    const { subCategoryId, validationErrors } = await createServiceSubCategory(req.dbPool, subCategory, imgPath);

    if (validationErrors) {
      res.status(428).json({ errors: validationErrors });

      return;
    }

    if (subCategoryId) {
      res.json({
        message: `Sub Category data inserted successfully`,
        data: subCategoryId,
      });

      return;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        errorMessage: `Error while creating sub category`,
        message: error.message,
      });

      return;
    }

    res.status(500).json({
      errorMessage: `Unknown error occurred while creating sub category`,
    });

    return;
  }
});

router.put(`/sub-category/edit/:id`, upload.single(`image`), async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  const subCategoryId = Number(req.params.id);
  const subCategory: SubCategoryDataType = req.body;
  const imgPath = req.file?.filename || null;

  try {
    const { subCategoryId: updatedSubCategoryId, validationErrors } = await updateServiceSubCategory(req.dbPool, subCategoryId, subCategory, imgPath);

    if (validationErrors) {
      res.status(428).json({ errors: validationErrors });

      return;
    }

    if (updatedSubCategoryId) {
      res.json({
        message: `SubCategory data updated successfully`,
        data: updatedSubCategoryId,
      });

      return;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        errorMessage: `Error while updating sub category`,
        message: error.message,
      });

      return;
    }

    res.status(500).json({
      errorMessage: `Unknown error occurred while updating sub category`,
    });

    return;
  }
});

router.post(`/category/create`, upload.single(`image`), async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  const { name } = req.body;
  const imgPath = req.file?.filename || null;

  try {
    const { categoryId, validationErrors } = await createServiceCategory(req.dbPool, name, imgPath);

    if (validationErrors) {
      res.status(428).json({ errors: validationErrors });

      return;
    }

    if (categoryId) {
      res.json({
        message: `Category data inserted successfully`,
        data: categoryId,
      });

      return;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        errorMessage: `Error while creating category`,
        message: error.message,
      });

      return;
    }

    res.status(500).json({
      errorMessage: `Unknown error occurred while creating category`,
    });

    return;
  }
});

router.put(`/category/edit/:id`, upload.single(`image`), async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  const categoryId = Number(req.params.id);
  const { name, status } = req.body;
  const imgPath = req.file?.filename || null;

  try {
    if (typeof status === 'string' && status.length > 0 && !name && !imgPath) {
      const { categoryId: updatedCategoryId, validationErrors } = await updateServiceCategoryStatus(req.dbPool, categoryId, status);

      if (validationErrors) {
        res.status(428).json({ errors: validationErrors });
        return;
      }

      if (updatedCategoryId) {
        res.json({
          message: `Category status updated successfully`,
          data: updatedCategoryId,
        });
        return;
      }
    }

    const { categoryId: updatedCategoryId, validationErrors } = await updateServiceCategory(req.dbPool, categoryId, name, imgPath);

    if (validationErrors) {
      res.status(428).json({ errors: validationErrors });

      return;
    }

    if (updatedCategoryId) {
      res.json({
        message: `Category data updated successfully`,
        data: updatedCategoryId,
      });

      return;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        errorMessage: `Error while updating category`,
        message: error.message,
      });

      return;
    }

    res.status(500).json({
      errorMessage: `Unknown error occurred while updating category`,
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

export default router;
