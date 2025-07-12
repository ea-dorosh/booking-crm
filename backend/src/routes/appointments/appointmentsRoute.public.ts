import express from 'express';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { AppointmentFormDataType } from '@/@types/appointmentsTypes.js';
import { createAppointment } from '@/services/appointment/appointmentService.js';

const router = express.Router();

router.post(`/create`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const appointmentFormData: AppointmentFormDataType = request.body.appointment;

  try {
    const result = await createAppointment(request.dbPool, appointmentFormData);

    if (result && `errorMessage` in result && `errors` in result) {
      response.status(428).json({
        errorMessage: result.errorMessage,
        errors: result.errors,
      });
      return;
    } else if (result && `errorMessage` in result && `validationErrors` in result) {
      response.status(428).json({
        errorMessage: result.errorMessage,
        validationErrors: result.validationErrors,
      });
      return;
    } else if (result && `errorMessage` in result && `error` in result) {
      response.status(409).json({
        errorMessage: result.errorMessage,
        error: result.error,
      });
      return;
    } else if (result && `errorMessage` in result) {
      response.status(500).json({
        errorMessage: result.errorMessage,
      });
      return;
    } else {
      response.json({
        message: `Appointment created successfully`,
        data: result,
      })
      return;
    }
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: `Error creating appointment` });
    return;
  }
});

export default router;
