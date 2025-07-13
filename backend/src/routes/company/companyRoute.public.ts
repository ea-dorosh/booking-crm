import express from 'express';
import { getCompany } from '@/services/company/companyService.js';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';

const router = express.Router();

router.get(`/`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({
      errorMessages: `Database connection not initialized`,
      error: new Error(`Database connection not initialized`).message,
    });

    return;
  }

  try {
    const company = await getCompany(request.dbPool);

    response.json(company);

    return;
  } catch (error) {
    response.status(500).json({
      errorMessages: `Error fetching company`,
      error: (error as Error).message,
    });

    return;
  }
});

export default router;
