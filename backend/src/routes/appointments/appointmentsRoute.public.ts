import express from 'express';
import dayjs from 'dayjs';
import { ResultSetHeader } from 'mysql2/promise';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import { getServiceDuration } from '@/utils/timeUtils.js';
import {
  formatName,
  formatPhone,
} from '@/utils/formatters.js';
import { getService } from '@/services/service/serviceService.js';
import {
  checkCustomerExists,
  createCustomer,
} from '@/services/customer/customerService.js';
import { checkEmployeeTimeNotOverlap } from '@/services/employees/employeesService.js';
import { getAppointmentEndTime } from '@/routes/calendar/calendarUtils.js';
import { CustomerNewStatusEnum } from '@/enums/enums.js';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { ServiceDetailsDataType } from '@/@types/servicesTypes.js';
import { AppointmentFormDataType } from '@/@types/appointmentsTypes.js';
import utc from 'dayjs/plugin/utc.js';

const router = express.Router();

dayjs.extend(advancedFormat);
dayjs.extend(utc);

router.post(`/create`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const appointmentFormData: AppointmentFormDataType = request.body.appointment;

  let serviceDurationAndBufferTimeInMinutes: string = ``;
  let serviceName: string = ``;

  try {
    const serviceDetails: ServiceDetailsDataType = await getService(request.dbPool, appointmentFormData.serviceId);

    /** save serviceName for response */
    serviceName = serviceDetails.name;

    serviceDurationAndBufferTimeInMinutes = getServiceDuration(serviceDetails.durationTime, serviceDetails.bufferTime);
  } catch (error) {
    response.status(500).json({
      errorMessage: `Error while fetching service`,
      error: (error as Error).message,
    });
    return;
  }

  /** check customer already exists and create if not */
  let isCustomerNew = CustomerNewStatusEnum.New;
  let customerId;

  try {
    const checkCustomerResult = await checkCustomerExists(request.dbPool, {email: appointmentFormData.email, customerId: null});

    if (checkCustomerResult.exists) {
      isCustomerNew = CustomerNewStatusEnum.Existing;
      customerId = checkCustomerResult.customerId;
    } else {
      const { newCustomerId, validationErrors } = await createCustomer(request.dbPool, appointmentFormData);

      if (validationErrors) {
        response.status(428).json({
            errorMessage: `Validation failed`,
            validationErrors,
          });
          return;
      } else if (newCustomerId) {
        customerId = newCustomerId;
      }
    }
  } catch (error) {
    response.status(500).json({
      errorMessage: `Error while creating customer`,
      message: (error as Error).message,
    });
    return;
  }

  const employeeId = appointmentFormData.employeeId;
  const date = appointmentFormData.date;

  const timeStart = dayjs
  .utc(`${date} ${appointmentFormData.time}`, `YYYY-MM-DD HH:mm:ss`)
  .format(`YYYY-MM-DDTHH:mm:ss.SSS[Z]`);

  const timeEnd = getAppointmentEndTime(timeStart, serviceDurationAndBufferTimeInMinutes);

  try {
    const { isEmployeeAvailable } = await checkEmployeeTimeNotOverlap(request.dbPool, { date, employeeId, timeStart, timeEnd })

    if (!isEmployeeAvailable) {
      response.status(409).json({
        errorMessage: `Employee is already busy at the specified date and time.`,
      });
      return;
    }
  } catch (error) {
    response.status(500).json({
      errorMessage: `Error while checking employee availability`,
      message: (error as Error).message,
    });
    return;
  }

  const appointmentQuery = `
    INSERT INTO SavedAppointments (
      date,
      time_start,
      time_end,
      service_id,
      service_name,
      customer_id,
      service_duration,
      employee_id,
      created_date,
      customer_salutation,
      customer_first_name,
      customer_last_name,
      customer_email,
      customer_phone,
      is_customer_new
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const appointmentValues = [
    date,
    timeStart,
    timeEnd,
    appointmentFormData.serviceId,
    serviceName,
    customerId,
    serviceDurationAndBufferTimeInMinutes,
    employeeId,
    dayjs().format(`YYYY-MM-DD HH:mm:ss`),
    appointmentFormData.salutation,
    formatName(appointmentFormData.firstName),
    formatName(appointmentFormData.lastName),
    appointmentFormData.email,
    formatPhone(appointmentFormData.phone),
    isCustomerNew,
  ];


  try {
    const [appointmentResults] = await request.dbPool.query<ResultSetHeader>(appointmentQuery, appointmentValues);

    response.json({
      message: `Appointment has been saved successfully`,
      data: {
        id: appointmentResults.insertId,
        date,
        timeStart,
        timeEnd,
        serviceName,
        firstName: formatName(appointmentFormData.firstName),
        lastName: formatName(appointmentFormData.lastName),
        salutation: appointmentFormData.salutation,
      },
    });
    return;
  } catch (error) {
    response.status(500).json({
      errorMessage: `Error while creating appointment`,
      message: (error as Error).message,
    });
    return;
  }
});

export default router;