import express from "express";
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { getEmployees } from '@/services/employees/employeesService.js';
import { EmployeeStatusEnum } from '@/enums/enums.js';

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
    // For public routes, only return active employees
    const employees = await getEmployees(request.dbPool, [EmployeeStatusEnum.Active]);

    response.json(employees);

    return;
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: `Error fetching employees` });

    return;
  }
});

export default router;
