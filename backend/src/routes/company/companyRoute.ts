import express from 'express';
import {
  getCompany,
  createCompany,
  updateCompanyData,
 } from '@/services/company/companyService.js';
import {
  getAllCompanyBranches,
  createCompanyBranch,
  updateCompanyBranch,
} from '@/services/companyBranches/companyBranchesService.js';
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
    const branches = await getAllCompanyBranches(request.dbPool);

    const companyWithBranches = {
      ...company,
      branches,
    };

    response.json(companyWithBranches);

    return;
  } catch (error) {
    response.status(500).json({
      errorMessages: `Error fetching company`,
      error: (error as Error).message,
    });

    return;
  }
});

router.post(`/create-company`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({
      errorMessages: `Database connection not initialized`,
      error: new Error(`Database connection not initialized`).message,
    });

    return;
  }

  const company = request.body;

  try {
    const { newCompanyId, validationErrors } = await createCompany(request.dbPool, company);

    if (validationErrors) {
      response.status(428).json({
          errorMessage: `Validation failed`,
          validationErrors,
        });
    } else if (newCompanyId) {
      response.json({
        message: `Company data inserted successfully`,
        data: newCompanyId,
      });
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as { code?: string; message?: string };
      if (mysqlError.code === 'ER_DUP_ENTRY') {
        response.status(409).json({
          errorMessage: `Company with this name already exists`,
        });

        return;
      }

      response.status(500).json({
        errorMessage: `Error while creating company`,
        message: mysqlError.message,
      });

      return;
    }

    if (error instanceof Error) {
      response.status(500).json({
        errorMessage: `Error while creating company`,
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

router.post(`/create-company-branch`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({
      errorMessages: `Database connection not initialized`,
      error: new Error(`Database connection not initialized`).message,
    });

    return;
  }

  const companyBranch = request.body;

  try {
    const { newBranchId, validationErrors } = await createCompanyBranch(request.dbPool, companyBranch);

    if (validationErrors) {
      response.status(428).json({
          errorMessage: `Validation failed`,
          validationErrors,
        });
    } else if (newBranchId) {
      response.json({
        message: `Company branch data inserted successfully`,
        data: newBranchId,
      });
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as { code?: string; message?: string };
      if (mysqlError.code === 'ER_DUP_ENTRY') {
        response.status(409).json({
          errorMessage: `Company with this name already exists`,
        });

        return;
      }

      response.status(500).json({
        errorMessage: `Error while creating company`,
        message: mysqlError.message,
      });

      return;
    }

    if (error instanceof Error) {
      response.status(500).json({
        errorMessage: `Error while creating company`,
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

router.put(`/edit/:id`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({
      errorMessages: `Database connection not initialized`,
      error: new Error(`Database connection not initialized`).message,
    });

    return;
  }

  const companyId = Number(request.params.id);
  const company = request.body;

  try {
    const { updatedCompanyId, validationErrors } = await updateCompanyData(request.dbPool, company, companyId);

    if (validationErrors) {
      response.status(428).json({
          errorMessage: `Validation failed`,
          validationErrors,
        });
    } else if (updatedCompanyId) {
      response.json({
        message: `Company with id: ${updatedCompanyId} has been updated successfully`,
        data: updatedCompanyId,
      });
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as { code?: string; message?: string };

      if (mysqlError.code === `ER_DUP_ENTRY`) {
        response.status(409).json({
          errorMessage: `Company with this name already exists`,
        });

        return;
      }

      response.status(500).json({
        errorMessage: `Error while updating company`,
        message: mysqlError.message,
      });

      return;
    }

    if (error instanceof Error) {
      response.status(500).json({
        errorMessage: `Error while updating company`,
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

router.put(`/edit-company-branch/:id`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({
      errorMessages: `Database connection not initialized`,
      error: new Error(`Database connection not initialized`).message,
    });

    return;
  }

  const companyBranchId = Number(request.params.id);
  const companyBranch = request.body;

  try {
    const { updatedBranchId, validationErrors } = await updateCompanyBranch(request.dbPool, companyBranchId, companyBranch);

    if (validationErrors) {
      response.status(428).json({
        errorMessage: `Validation failed`,
        validationErrors,
      });
    } else if (updatedBranchId) {
      response.json({
        message: `Company branch with id: ${updatedBranchId} has been updated successfully`,
        data: updatedBranchId,
      });
    }
  } catch (error) {
    console.error(error);

    response.status(500).json({
      errorMessage: `Unknown error occurred`,
    });

    return;
  }
});

export default router;
