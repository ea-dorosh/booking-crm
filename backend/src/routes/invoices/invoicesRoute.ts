import express from 'express';
import { 
  getInvoices, 
  geInvoiceById, 
  createInvoice,
} from '@/services/invoices/invoicesService';
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

router.get(`/:id`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  const invoiceId = request.params.id;

  try {
    const invoice = await geInvoiceById(request.dbPool, invoiceId);

    response.json(invoice);

    return;
  } catch (error) {
    response.status(500).json({ 
      errorMessage: `Error fetching invoice details`,
      message: (error as Error).message,
    });
  }
});

router.post(`/create-invoice`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({
      errorMessages: `Database connection not initialized`,
      error: new Error(`Database connection not initialized`).message,
    });

    return;
  }

  const customer = request.body;

  try {
    const { createdInvoiceId, validationErrors } = await createInvoice(request.dbPool, customer);
  
    if (validationErrors) {
      response.status(428).json({ 
          errorMessage: `Validation failed`,
          validationErrors,
        });
    } else if (createdInvoiceId) {
      response.json({
        message: `Invoice data inserted successfully`,
        data: createdInvoiceId,
      });
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as { code?: string; message?: string };
      if (mysqlError.code === `ER_DUP_ENTRY`) {
        response.status(409).json({
          errorMessage: `Invoice with this email already exists`,
        });

        return;
      }

      response.status(500).json({
        errorMessage: `Error while creating Invoice`,
        message: mysqlError.message,
      });

      return;
    }

    if (error instanceof Error) {
      response.status(500).json({ 
        errorMessage: `Error while creating Invoice`,
        message: error.message,
      });

      return;
    }

    response.status(500).json({ 
      errorMessage: `Unknown error occurred`,
    });

    return;
  }
});

export default router;
