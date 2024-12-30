import express from 'express';
import { getInvoices } from '@/services/invoices/invoicesService';
import { 
  CustomRequestType, 
  CustomResponseType,
} from '@/@types/expressTypes';

const router = express.Router();

router.get(`/`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  try {
    const invoices = await getInvoices(request.dbPool);

    response.json(invoices);

    return;
  } catch (error) {
    response.status(500).json({
      errorMessages: `Error fetching invoices`,
      error: (error as Error).message,
    });

    return;
  }
});

export default router;
